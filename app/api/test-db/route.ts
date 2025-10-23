import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testando conexão com o banco de dados...')
    
    // Testar conexão básica
    const testQuery = 'SELECT 1 as test'
    const testResult = await query(testQuery)
    console.log('✅ Conexão com banco OK:', testResult)
    
    // Verificar se as tabelas existem
    const tablesQuery = `
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN ('companies', 'service_orders')
    `
    const tables = await query(tablesQuery)
    console.log('📋 Tabelas encontradas:', tables)
    
    // Verificar estrutura da tabela companies
    const companiesStructure = await query('DESCRIBE companies')
    console.log('🏢 Estrutura da tabela companies:', companiesStructure)
    
    // Verificar estrutura da tabela service_orders
    const serviceOrdersStructure = await query('DESCRIBE service_orders')
    console.log('📋 Estrutura da tabela service_orders:', serviceOrdersStructure)
    
    // Contar registros
    const companiesCount = await query('SELECT COUNT(*) as count FROM companies')
    const serviceOrdersCount = await query('SELECT COUNT(*) as count FROM service_orders')
    
    return NextResponse.json({
      success: true,
      connection: 'OK',
      tables: tables,
      companiesStructure: companiesStructure,
      serviceOrdersStructure: serviceOrdersStructure,
      counts: {
        companies: companiesCount[0]?.count || 0,
        serviceOrders: serviceOrdersCount[0]?.count || 0
      }
    })
    
  } catch (error) {
    console.error('❌ Erro no teste do banco:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}