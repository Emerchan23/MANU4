import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database.js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('dateRange') || '30'
    const sectorId = searchParams.get('sectorId') || 'ALL'
    
    console.log('🔍 REPORTS API - Buscando dados de relatórios...')
    console.log('📅 Período:', dateRange, 'dias')
    console.log('🏢 Setor:', sectorId)

    // Calcular data de início baseada no período
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(dateRange))
    const startDateStr = startDate.toISOString().split('T')[0]

    // Query base para filtros
    const sectorFilter = sectorId !== 'ALL' ? 'AND e.sector_id = ?' : ''
    const sectorParams = sectorId !== 'ALL' ? [sectorId] : []

    // 1. Estatísticas gerais
    const statsQueries = [
      // Total de equipamentos
      `SELECT COUNT(*) as total FROM equipment e WHERE 1=1 ${sectorFilter}`,
      
      // Ordens de serviço abertas
      `SELECT COUNT(*) as total FROM service_orders so 
       JOIN equipment e ON so.equipment_id = e.id 
       WHERE so.status IN ('ABERTA', 'EM_ANDAMENTO') ${sectorFilter}`,
      
      // Custo total no período
      `SELECT COALESCE(SUM(so.total_cost), 0) as total FROM service_orders so 
       JOIN equipment e ON so.equipment_id = e.id 
       WHERE so.created_at >= ? ${sectorFilter}`,
      
      // Tempo médio de resolução (em horas)
      `SELECT COALESCE(AVG(TIMESTAMPDIFF(HOUR, so.created_at, so.completed_at)), 0) as avg_time 
       FROM service_orders so 
       JOIN equipment e ON so.equipment_id = e.id 
       WHERE so.status = 'CONCLUIDA' AND so.created_at >= ? ${sectorFilter}`
    ]

    const [
      totalEquipmentResult,
      openOrdersResult,
      totalCostResult,
      avgTimeResult
    ] = await Promise.all([
      query(statsQueries[0], sectorParams),
      query(statsQueries[1], sectorParams),
      query(statsQueries[2], [startDateStr, ...sectorParams]),
      query(statsQueries[3], [startDateStr, ...sectorParams])
    ])

    // 2. Dados para gráfico de manutenções
    const maintenanceChartQuery = `
      SELECT 
        DATE(so.created_at) as date,
        so.maintenance_type as type,
        COUNT(*) as count
      FROM service_orders so
      JOIN equipment e ON so.equipment_id = e.id
      WHERE so.created_at >= ? ${sectorFilter}
      GROUP BY DATE(so.created_at), so.maintenance_type
      ORDER BY date DESC
      LIMIT 30
    `
    const maintenanceChartResult = await query(maintenanceChartQuery, [startDateStr, ...sectorParams])

    // 3. Dados para gráfico de custos
    const costChartQuery = `
      SELECT 
        DATE(so.created_at) as date,
        COALESCE(SUM(so.total_cost), 0) as cost,
        COUNT(*) as orders
      FROM service_orders so
      JOIN equipment e ON so.equipment_id = e.id
      WHERE so.created_at >= ? AND so.total_cost IS NOT NULL ${sectorFilter}
      GROUP BY DATE(so.created_at)
      ORDER BY date DESC
      LIMIT 30
    `
    const costChartResult = await query(costChartQuery, [startDateStr, ...sectorParams])

    // 4. Performance por setor
    const sectorPerformanceQuery = `
      SELECT 
        s.name as sector,
        COUNT(so.id) as totalOrders,
        SUM(CASE WHEN so.status = 'CONCLUIDA' THEN 1 ELSE 0 END) as completedOrders,
        ROUND(
          (SUM(CASE WHEN so.status = 'CONCLUIDA' THEN 1 ELSE 0 END) * 100.0 / COUNT(so.id)), 2
        ) as completionRate,
        COALESCE(AVG(TIMESTAMPDIFF(HOUR, so.created_at, so.completed_at)), 0) as avgResolutionTime,
        COALESCE(SUM(so.total_cost), 0) as totalCost
      FROM setores s
      LEFT JOIN equipment e ON s.id = e.sector_id
      LEFT JOIN service_orders so ON e.id = so.equipment_id AND so.created_at >= ?
      ${sectorId !== 'ALL' ? 'WHERE s.id = ?' : ''}
      GROUP BY s.id, s.name
      ORDER BY totalOrders DESC
    `
    const sectorPerformanceParams = sectorId !== 'ALL' ? [startDateStr, sectorId] : [startDateStr]
    const sectorPerformanceResult = await query(sectorPerformanceQuery, sectorPerformanceParams)

    // 5. Status dos equipamentos
    const equipmentStatusQuery = `
      SELECT 
        e.status,
        COUNT(*) as count
      FROM equipment e
      ${sectorId !== 'ALL' ? 'WHERE e.sector_id = ?' : ''}
      GROUP BY e.status
    `
    const equipmentStatusResult = await query(equipmentStatusQuery, sectorParams)

    // 6. Alertas prioritários
    const priorityAlertsQuery = `
      SELECT 
        a.id,
        a.tipo as type,
        a.prioridade as priority,
        a.descricao as description,
        e.name as equipment_name,
        s.nome as sector_name,
        a.data_vencimento as due_date,
        DATEDIFF(a.data_vencimento, NOW()) as days_until_expiration
      FROM alerts a
      JOIN equipment e ON a.equipment_id = e.id
      JOIN setores s ON e.sector_id = s.id
      WHERE a.status = 'ATIVO' 
        AND (a.prioridade = 'ALTA' OR DATEDIFF(a.data_vencimento, NOW()) <= 7)
        ${sectorFilter.replace('e.', 'e.')}
      ORDER BY 
        CASE a.prioridade 
          WHEN 'ALTA' THEN 1 
          WHEN 'MEDIA' THEN 2 
          ELSE 3 
        END,
        a.data_vencimento ASC
      LIMIT 10
    `
    const priorityAlertsResult = await query(priorityAlertsQuery, sectorParams)

    // Formatar resposta
    const response = {
      stats: {
        totalEquipment: (totalEquipmentResult as any[])[0]?.total || 0,
        openOrders: (openOrdersResult as any[])[0]?.total || 0,
        totalCost: (totalCostResult as any[])[0]?.total || 0,
        avgResolutionTime: Math.round((avgTimeResult as any[])[0]?.avg_time || 0)
      },
      charts: {
        maintenance: maintenanceChartResult,
        cost: costChartResult,
        sectorPerformance: sectorPerformanceResult,
        equipmentStatus: equipmentStatusResult
      },
      alerts: priorityAlertsResult
    }

    console.log('✅ REPORTS API - Dados carregados com sucesso')
    console.log('📊 Estatísticas:', response.stats)
    console.log('📈 Gráficos:', {
      maintenance: (maintenanceChartResult as any[]).length,
      cost: (costChartResult as any[]).length,
      sectors: (sectorPerformanceResult as any[]).length,
      equipment: (equipmentStatusResult as any[]).length
    })
    console.log('🚨 Alertas:', (priorityAlertsResult as any[]).length)

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ REPORTS API - Erro:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}