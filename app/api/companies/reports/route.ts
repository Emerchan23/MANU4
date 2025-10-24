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
  timezone: '+00:00',
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 10000,
}

export async function GET(request: NextRequest) {
  let connection: mysql.Connection | null = null

  try {
    console.log('🔍 Iniciando busca de empresas para relatórios...')

    // Conectar ao banco de dados
    connection = await mysql.createConnection(dbConfig)
    console.log('✅ Conectado ao MariaDB')

    // Obter parâmetros de filtro
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const search = searchParams.get('search')

    console.log('📅 Filtros:', { startDate, endDate, search })

    // Query para buscar empresas com estatísticas
    let companiesQuery = `
      SELECT 
        c.id,
        c.name,
        c.cnpj,
        c.address,
        c.contact_person,
        c.phone,
        c.email,
        c.address,
        c.is_active,
        COUNT(so.id) as total_services,
        COALESCE(SUM(so.cost), 0) as total_cost,
        COALESCE(AVG(so.cost), 0) as average_cost,
        MIN(so.created_at) as first_service_date,
        MAX(so.created_at) as last_service_date
      FROM companies c
      LEFT JOIN service_orders so ON c.id = so.company_id
    `

    const queryParams: any[] = []
    const whereConditions: string[] = []

    // Adicionar filtros de data nas ordens de serviço
    if (startDate && endDate) {
      whereConditions.push('(so.created_at >= ? AND so.created_at <= ?)')
      queryParams.push(startDate, endDate)
    } else if (startDate) {
      whereConditions.push('so.created_at >= ?')
      queryParams.push(startDate)
    } else if (endDate) {
      whereConditions.push('so.created_at <= ?')
      queryParams.push(endDate)
    }

    // Adicionar filtro de busca por nome ou CNPJ
    if (search) {
      whereConditions.push('(c.name LIKE ? OR c.cnpj LIKE ?)')
      queryParams.push(`%${search}%`, `%${search}%`)
    }

    // Aplicar condições WHERE se existirem
    if (whereConditions.length > 0) {
      companiesQuery += ` WHERE ${whereConditions.join(' AND ')}`
    }

    companiesQuery += `
      GROUP BY c.id, c.name, c.cnpj, c.address, c.contact_person, c.phone, c.email, c.is_active
      ORDER BY c.name
    `

    console.log('🔍 Executando query de empresas...')
    const [companiesRows] = await connection.execute(companiesQuery, queryParams)
    const companies = Array.isArray(companiesRows) ? companiesRows : []

    console.log('🏢 Empresas encontradas:', companies.length)

    // Calcular estatísticas gerais
    const totalCompanies = companies.length
    const totalServices = companies.reduce((sum: number, company: any) => sum + parseInt(company.total_services || 0), 0)
    const totalAmount = companies.reduce((sum: number, company: any) => sum + parseFloat(company.total_cost || 0), 0)
    const averageServiceCost = totalServices > 0 ? totalAmount / totalServices : 0

    // Formatar dados das empresas
    const formattedCompanies = companies.map((company: any) => ({
      id: company.id,
      name: company.name,
      cnpj: company.cnpj,
      address: company.address,
      contact_person: company.contact_person,
      phone: company.phone,
      email: company.email,
      address: company.address || 'Não informado',
      is_active: company.is_active,
      total_services: parseInt(company.total_services) || 0,
      total_cost: parseFloat(company.total_cost) || 0,
      average_cost: parseFloat(company.average_cost) || 0,
      first_service_date: company.first_service_date,
      last_service_date: company.last_service_date
    }))

    const response = {
      companies: formattedCompanies,
      stats: {
        total_companies: totalCompanies,
        total_services: totalServices,
        total_amount: totalAmount,
        average_service_cost: averageServiceCost
      },
      period: {
        start_date: startDate,
        end_date: endDate
      }
    }

    console.log('✅ Relatório de empresas gerado com sucesso')
    console.log('📊 Estatísticas:', response.stats)

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Erro ao buscar empresas:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        companies: [],
        stats: {
          total_companies: 0,
          total_services: 0,
          total_amount: 0,
          average_service_cost: 0
        },
        period: {
          start_date: null,
          end_date: null
        }
      },
      { status: 500 }
    )
  } finally {
    // Fechar conexão se foi criada
    if (connection) {
      try {
        await connection.end()
      } catch (closeError) {
        console.error('❌ Erro ao fechar conexão:', closeError)
      }
    }
  }
}