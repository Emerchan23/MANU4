import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testando API de empresas simplificada...')
    
    // Query simples para buscar empresas
    const companiesQuery = `
      SELECT 
        c.id,
        c.name,
        c.cnpj,
        c.city,
        c.state
      FROM companies c
      ORDER BY c.name
    `
    
    const companies = await query(companiesQuery)
    console.log('✅ Empresas encontradas:', companies.length)
    
    // Query simples para contar service orders por empresa
    const serviceOrdersQuery = `
      SELECT 
        company_id,
        COUNT(*) as total_services,
        SUM(actual_cost) as total_cost
      FROM service_orders 
      GROUP BY company_id
    `
    
    const serviceOrders = await query(serviceOrdersQuery)
    console.log('✅ Service orders encontradas:', serviceOrders.length)
    
    // Combinar dados
    const companiesWithStats = companies.map((company: any) => {
      const stats = serviceOrders.find((so: any) => so.company_id === company.id)
      return {
        id: company.id,
        name: company.name,
        cnpj: company.cnpj,
        city: company.city,
        state: company.state,
        totalServices: stats?.total_services || 0,
        totalCost: parseFloat(stats?.total_cost || 0)
      }
    })
    
    return NextResponse.json({
      success: true,
      companies: companiesWithStats,
      stats: {
        totalCompanies: companies.length,
        totalServices: serviceOrders.reduce((sum: number, so: any) => sum + so.total_services, 0),
        totalAmount: serviceOrders.reduce((sum: number, so: any) => sum + parseFloat(so.total_cost || 0), 0)
      }
    })
    
  } catch (error) {
    console.error('❌ Erro na API de empresas:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}