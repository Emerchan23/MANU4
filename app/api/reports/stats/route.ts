import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database.js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('dateRange') || '30'
    const sectorId = searchParams.get('sectorId') || 'ALL'
    
    console.log('📊 REPORTS STATS API - Buscando estatísticas...')
    console.log('📅 Período:', dateRange, 'dias')
    console.log('🏢 Setor:', sectorId)

    // Calcular data de início baseada no período
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(dateRange))
    const startDateStr = startDate.toISOString().split('T')[0]

    console.log('📅 Data de início:', startDateStr)

    // Query base para filtros
    const sectorFilter = sectorId !== 'ALL' ? 'AND e.sector_id = ?' : ''
    const sectorParams = sectorId !== 'ALL' ? [sectorId] : []

    // 1. Total de equipamentos
    const totalEquipmentQuery = `
      SELECT COUNT(*) as total FROM equipment e 
      WHERE e.created_at <= NOW() ${sectorFilter}
    `

    // 2. Ordens de serviço abertas
    const openOrdersQuery = `
      SELECT COUNT(*) as total FROM service_orders so 
      JOIN equipment e ON so.equipment_id = e.id 
      WHERE so.status IN ('aberta', 'em_andamento') ${sectorFilter}
    `

    // 3. Custo total
    const totalCostQuery = `
      SELECT COALESCE(SUM(so.cost), 0) as total FROM service_orders so 
      JOIN equipment e ON so.equipment_id = e.id 
      WHERE so.requested_date >= ? ${sectorFilter}
    `

    // 4. Tempo médio de resolução
    const avgTimeQuery = `
      SELECT COALESCE(AVG(TIMESTAMPDIFF(HOUR, so.requested_date, so.completion_date)), 0) as avg_time 
      FROM service_orders so 
      JOIN equipment e ON so.equipment_id = e.id 
      WHERE so.status = 'concluida' AND so.requested_date >= ? ${sectorFilter}
    `

    // Executar queries
    console.log('🔍 Executando queries...')
    const [
      totalEquipmentResult,
      openOrdersResult,
      totalCostResult,
      avgTimeResult
    ] = await Promise.all([
      query(totalEquipmentQuery, sectorParams),
      query(openOrdersQuery, sectorParams),
      query(totalCostQuery, [startDateStr, ...sectorParams]),
      query(avgTimeQuery, [startDateStr, ...sectorParams])
    ])
    
    console.log('🔍 Resultados das queries:')
    console.log('  - totalEquipmentResult:', totalEquipmentResult)
    console.log('  - openOrdersResult:', openOrdersResult)
    console.log('  - totalCostResult:', totalCostResult)
    console.log('  - avgTimeResult:', avgTimeResult)

    // Extrair valores com conversão segura
    const totalEquipment = Number(totalEquipmentResult[0]?.total) || 0
    const openOrders = Number(openOrdersResult[0]?.total) || 0
    const totalCost = Number(totalCostResult[0]?.total) || 0
    const avgResolutionTime = Number(avgTimeResult[0]?.avg_time) || 0

    console.log('🔍 Valores extraídos:')
    console.log('  - totalEquipment:', totalEquipment, typeof totalEquipment)
    console.log('  - openOrders:', openOrders, typeof openOrders)
    console.log('  - totalCost:', totalCost, typeof totalCost)
    console.log('  - avgResolutionTime:', avgResolutionTime, typeof avgResolutionTime)

    // Formatar resposta simplificada
    const response = {
      currentPeriod: {
        totalEquipment,
        openOrders,
        totalCost,
        avgResolutionTime
      },
      comparison: {
        equipmentChange: '0%',
        ordersChange: '0%',
        costChange: '0%',
        timeChange: '0%'
      }
    }

    console.log('✅ REPORTS STATS API - Estatísticas calculadas com sucesso')
    console.log('📊 Dados:', response)

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ REPORTS STATS API - Erro:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}