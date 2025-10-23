import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  port: parseInt(process.env.DB_PORT || '3306'),
  charset: 'utf8mb4',
  timezone: '+00:00'
}

export async function GET(request: NextRequest) {
  let connection: mysql.Connection | null = null
  
  try {
    console.log('🔍 Iniciando busca de empresas...')
    
    // Conectar ao banco de dados
    connection = await mysql.createConnection(dbConfig)
    console.log('✅ Conectado ao MariaDB')

    // Obter parâmetros de filtro
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    console.log('📅 Filtros de data:', { startDate, endDate })

    // Query simples para buscar empresas (usando campos que existem na tabela)
    const companiesQuery = `
      SELECT 
        c.id,
        c.name,
        c.cnpj,
        c.address,
        c.contact_person,
        c.phone,
        c.email
      FROM companies c
      ORDER BY c.name
    `
    
    const [companiesRows] = await connection.execute(companiesQuery)
    console.log('🏢 Empresas encontradas:', Array.isArray(companiesRows) ? companiesRows.length : 0)

    // Query para buscar estatísticas de service orders por empresa
    let serviceOrdersQuery = `
      SELECT 
        so.company_id,
        COUNT(*) as total_services,
        COALESCE(SUM(so.actual_cost), 0) as total_cost,
        COALESCE(AVG(so.actual_cost), 0) as average_cost,
        MIN(so.created_at) as first_service_date,
        MAX(so.created_at) as last_service_date
      FROM service_orders so
    `
    
    const queryParams: any[] = []
    
    // Adicionar filtros de data
    if (startDate && endDate) {
      serviceOrdersQuery += ` WHERE so.created_at >= ? AND so.created_at <= ?`
      queryParams.push(startDate, endDate)
    } else if (startDate) {
      serviceOrdersQuery += ` WHERE so.created_at >= ?`
      queryParams.push(startDate)
    } else if (endDate) {
      serviceOrdersQuery += ` WHERE so.created_at <= ?`
      queryParams.push(endDate)
    }
    
    serviceOrdersQuery += ` GROUP BY so.company_id`

    const [serviceOrdersRows] = await connection.execute(serviceOrdersQuery, queryParams)
    console.log('📋 Service orders encontradas:', Array.isArray(serviceOrdersRows) ? serviceOrdersRows.length : 0)

    // Combinar dados das empresas com estatísticas
    const companies = Array.isArray(companiesRows) ? companiesRows : []
    const serviceOrders = Array.isArray(serviceOrdersRows) ? serviceOrdersRows : []
    
    const formattedCompanies = companies.map((company: any) => {
       const stats = serviceOrders.find((so: any) => so.company_id === company.id)
       return {
         id: company.id,
         name: company.name,
         cnpj: company.cnpj,
         address: company.address,
         contact_person: company.contact_person,
         phone: company.phone,
         email: company.email,
         city: company.city || 'Não informado',
         state: company.state || 'N/A',
         total_services: parseInt(stats?.total_services) || 0,
         total_cost: parseFloat(stats?.total_cost) || 0,
         average_cost: parseFloat(stats?.average_cost) || 0,
         first_service_date: stats?.first_service_date,
         last_service_date: stats?.last_service_date
       }
     }).sort((a, b) => b.total_cost - a.total_cost) // Ordenar por custo total decrescente

    // Calcular estatísticas gerais
    const totalServices = serviceOrders.reduce((sum: number, so: any) => sum + parseInt(so.total_services), 0)
    const totalAmount = serviceOrders.reduce((sum: number, so: any) => sum + parseFloat(so.total_cost || 0), 0)
    const averageServiceCost = totalServices > 0 ? totalAmount / totalServices : 0

    console.log('📊 Estatísticas calculadas:', {
      totalCompanies: companies.length,
      totalServices,
      totalAmount,
      averageServiceCost
    })

    return NextResponse.json({
      companies: formattedCompanies,
      stats: {
        total_companies: companies.length,
        total_services: totalServices,
        total_amount: totalAmount,
        average_service_cost: averageServiceCost
      },
      period: {
        startDate,
        endDate
      }
    })

  } catch (error) {
    console.error('❌ Erro ao buscar empresas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  } finally {
    if (connection) {
      await connection.end()
      console.log('🔌 Conexão com MariaDB fechada')
    }
  }
}