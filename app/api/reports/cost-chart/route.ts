import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database.js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('dateRange') || '30'
    const sectorId = searchParams.get('sectorId') || 'ALL'
    
    console.log('💰 COST CHART API - Buscando dados de custos...')
    console.log('📅 Período:', dateRange, 'dias')
    console.log('🏢 Setor:', sectorId)

    // Calcular data de início baseada no dateRange
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(dateRange))
    const startDateStr = startDate.toISOString().split('T')[0]
    
    console.log('📅 COST CHART API - Período:', { dateRange, startDateStr, sectorId })

    // Query base para filtros
    const sectorFilter = sectorId !== 'ALL' ? 'AND e.sector_id = ?' : ''
    const sectorParams = sectorId !== 'ALL' ? [sectorId] : []

    // Query para custos por equipamento
    const costByEquipmentQuery = `
      SELECT 
        e.name as equipment_name,
        e.id as equipment_id,
        s.nome as sector_name,
        COALESCE(SUM(so.cost), 0) as total_cost,
        COUNT(so.id) as maintenance_count
      FROM equipment e
      LEFT JOIN service_orders so ON e.id = so.equipment_id 
        AND so.requested_date >= ? 
        AND so.cost > 0
      LEFT JOIN setores s ON e.sector_id = s.id
      WHERE 1=1 ${sectorFilter}
      GROUP BY e.id, e.name, s.nome
      HAVING total_cost > 0
      ORDER BY total_cost DESC
      LIMIT 20
    `

    const costByEquipmentResult = await query(costByEquipmentQuery, [startDateStr, ...sectorParams])

    // Query para custos por período (últimos 30 dias)
    const costByPeriodQuery = `
      SELECT 
        DATE(so.requested_date) as date,
        COALESCE(SUM(so.cost), 0) as daily_cost,
        COUNT(so.id) as orders_count
      FROM service_orders so
      JOIN equipment e ON so.equipment_id = e.id
      WHERE so.requested_date >= ? 
        AND so.cost > 0
        ${sectorFilter}
      GROUP BY DATE(so.requested_date)
      ORDER BY date DESC
      LIMIT 30
    `

    const costByPeriodResult = await query(costByPeriodQuery, [startDateStr, ...sectorParams])

    // Query para custos por setor
    const costBySectorQuery = `
      SELECT 
        s.nome as sector_name,
        s.id as sector_id,
        COALESCE(SUM(so.cost), 0) as total_cost,
        COUNT(so.id) as maintenance_count,
        COUNT(DISTINCT e.id) as equipment_count
      FROM setores s
      LEFT JOIN equipment e ON s.id = e.sector_id
      LEFT JOIN service_orders so ON e.id = so.equipment_id 
        AND so.requested_date >= ? 
        AND so.cost > 0
      WHERE 1=1 ${sectorId !== 'ALL' ? 'AND s.id = ?' : ''}
      GROUP BY s.id, s.nome
      HAVING total_cost > 0
      ORDER BY total_cost DESC
    `

    const costBySectorParams = sectorId !== 'ALL' ? [startDateStr, sectorId] : [startDateStr]
    const costBySectorResult = await query(costBySectorQuery, costBySectorParams)

    // Processar dados para o formato do gráfico
    const equipmentData = (costByEquipmentResult as any[]).map(row => ({
      name: row.equipment_name,
      equipment_id: row.equipment_id,
      sector: row.sector_name,
      cost: parseFloat(row.total_cost) || 0,
      maintenances: parseInt(row.maintenance_count) || 0
    }))

    const periodData = (costByPeriodResult as any[]).map(row => ({
      date: new Date(row.date).toLocaleDateString('pt-BR'),
      cost: parseFloat(row.daily_cost) || 0,
      orders: parseInt(row.orders_count) || 0
    })).reverse() // Inverter para ordem cronológica

    const sectorData = (costBySectorResult as any[]).map(row => ({
      name: row.sector_name,
      sector_id: row.sector_id,
      cost: parseFloat(row.total_cost) || 0,
      maintenances: parseInt(row.maintenance_count) || 0,
      equipments: parseInt(row.equipment_count) || 0
    }))

    // Calcular estatísticas
    const totalCost = equipmentData.reduce((sum, item) => sum + item.cost, 0)
    const averageCostPerEquipment = equipmentData.length > 0 ? totalCost / equipmentData.length : 0
    const totalMaintenances = equipmentData.reduce((sum, item) => sum + item.maintenances, 0)
    const averageCostPerMaintenance = totalMaintenances > 0 ? totalCost / totalMaintenances : 0

    const response = {
      data: periodData, // Formato esperado pelo componente
      equipmentCosts: equipmentData,
      periodCosts: periodData,
      sectorCosts: sectorData,
      summary: {
        totalCost,
        averageCostPerEquipment: Math.round(averageCostPerEquipment * 100) / 100,
        averageCostPerMaintenance: Math.round(averageCostPerMaintenance * 100) / 100,
        totalMaintenances,
        period: `${dateRange} dias`,
        sector: sectorId === 'ALL' ? 'Todos os setores' : `Setor ${sectorId}`
      }
    }

    console.log('✅ COST CHART API - Dados processados com sucesso')
    console.log('💰 Custo total:', totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
    console.log('📊 Equipamentos com custos:', equipmentData.length)
    console.log('📈 Pontos no gráfico de período:', periodData.length)
    console.log('🏢 Setores com custos:', sectorData.length)

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ COST CHART API - Erro:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}