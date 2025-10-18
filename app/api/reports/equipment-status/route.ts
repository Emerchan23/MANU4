import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database.js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('dateRange') || '30'
    const sectorId = searchParams.get('sectorId') || 'ALL'
    
    console.log('⚙️ EQUIPMENT STATUS API - Buscando status dos equipamentos...')
    console.log('📅 Período:', dateRange, 'dias')
    console.log('🏢 Setor:', sectorId)

    // Calcular data de início baseada no período
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(dateRange))
    const startDateStr = startDate.toISOString().split('T')[0]

    // Query base para filtros
    const sectorFilter = sectorId !== 'ALL' ? 'AND e.sector_id = ?' : ''
    const sectorParams = sectorId !== 'ALL' ? [sectorId] : []

    // Query para status dos equipamentos
    const equipmentStatusQuery = `
      SELECT 
        e.id,
        e.name as equipment_name,
        e.model,
        e.serial_number,
        e.status,
        e.subsector_id as location,
        s.nome as sector_name,
        s.id as sector_id,
        COUNT(so.id) as total_orders,
        COUNT(CASE WHEN so.status = 'aberta' THEN 1 END) as open_orders,
        COUNT(CASE WHEN so.status = 'em_andamento' THEN 1 END) as in_progress_orders,
        COUNT(CASE WHEN so.status IN ('concluida', 'fechada') THEN 1 END) as completed_orders,
        COUNT(CASE WHEN so.priority = 'alta' THEN 1 END) as high_priority_orders,
        MAX(so.requested_date) as last_maintenance_date,
        COALESCE(SUM(CASE WHEN so.status IN ('concluida', 'fechada') THEN so.cost ELSE 0 END), 0) as total_cost,
        0 as preventive_count,
        0 as corrective_count
      FROM equipment e
      LEFT JOIN setores s ON e.sector_id = s.id
      LEFT JOIN service_orders so ON e.id = so.equipment_id AND so.requested_date >= ?
      WHERE 1=1 ${sectorFilter}
      GROUP BY e.id, e.name, e.model, e.serial_number, e.status, e.subsector_id, s.nome, s.id
      ORDER BY 
        CASE e.status 
          WHEN 'inativo' THEN 1 
          WHEN 'manutencao' THEN 2 
          WHEN 'ativo' THEN 3 
          ELSE 4 
        END,
        total_orders DESC
    `

    const equipmentStatusResult = await query(equipmentStatusQuery, [startDateStr, ...sectorParams])

    // Query para estatísticas gerais de status
    const statusSummaryQuery = `
      SELECT 
        e.status,
        COUNT(*) as count,
        COUNT(CASE WHEN so.status = 'aberta' THEN 1 END) as with_open_orders,
        COUNT(CASE WHEN so.priority = 'alta' THEN 1 END) as with_high_priority
      FROM equipment e
      LEFT JOIN service_orders so ON e.id = so.equipment_id AND so.created_at >= ?
      WHERE 1=1 ${sectorFilter}
      GROUP BY e.status
      ORDER BY count DESC
    `

    const statusSummaryResult = await query(statusSummaryQuery, [startDateStr, ...sectorParams])

    // Query para equipamentos críticos (com mais problemas)
    const criticalEquipmentQuery = `
      SELECT 
        e.id,
        e.name as equipment_name,
        e.status,
        s.nome as sector_name,
        COUNT(so.id) as total_issues,
        COUNT(CASE WHEN so.status = 'aberta' THEN 1 END) as open_issues,
        COUNT(CASE WHEN so.priority = 'alta' THEN 1 END) as high_priority_issues,
        COALESCE(SUM(so.cost), 0) as total_cost,
        MAX(so.created_at) as last_issue_date
      FROM equipment e
      LEFT JOIN setores s ON e.sector_id = s.id
      LEFT JOIN service_orders so ON e.id = so.equipment_id AND so.created_at >= ?
      WHERE 1=1 ${sectorFilter}
      GROUP BY e.id, e.name, e.status, s.nome
      HAVING COUNT(so.id) > 0
      ORDER BY 
        (COUNT(CASE WHEN so.status = 'aberta' THEN 1 END) * 3 + 
         COUNT(CASE WHEN so.priority = 'alta' THEN 1 END) * 2 + 
         COUNT(so.id)) DESC,
        COALESCE(SUM(so.cost), 0) DESC
      LIMIT 10
    `

    const criticalEquipmentResult = await query(criticalEquipmentQuery, [startDateStr, ...sectorParams])

    // Processar dados dos equipamentos
    const equipmentData = (equipmentStatusResult as any[]).map(row => {
      const totalOrders = parseInt(row.total_orders) || 0
      const completedOrders = parseInt(row.completed_orders) || 0
      const openOrders = parseInt(row.open_orders) || 0
      const inProgressOrders = parseInt(row.in_progress_orders) || 0
      
      // Calcular score de saúde do equipamento
      const healthScore = calculateHealthScore({
        totalOrders,
        openOrders,
        inProgressOrders,
        highPriorityOrders: parseInt(row.high_priority_orders) || 0,
        totalCost: parseFloat(row.total_cost) || 0
      })
      
      return {
        id: row.id,
        equipment_name: row.equipment_name,
        model: row.model || '',
        serial_number: row.serial_number || '',
        status: row.status,
        location: row.location || null,
        sector_name: row.sector_name,
        sector_id: row.sector_id,
        total_orders: totalOrders,
        open_orders: openOrders,
        in_progress_orders: inProgressOrders,
        completed_orders: completedOrders,
        high_priority_orders: parseInt(row.high_priority_orders) || 0,
        last_maintenance_date: row.last_maintenance_date,
        total_cost: parseFloat(row.total_cost) || 0,
        preventive_count: 0,
        corrective_count: 0,
        health_score: healthScore
      }
    })

    // Processar estatísticas de status
    const statusSummary = (statusSummaryResult as any[]).map(row => ({
      status: row.status,
      count: parseInt(row.count) || 0,
      with_open_orders: parseInt(row.with_open_orders) || 0,
      with_high_priority: parseInt(row.with_high_priority) || 0
    }))

    // Processar equipamentos críticos
    const criticalEquipment = (criticalEquipmentResult as any[]).map(row => ({
      id: row.id,
      equipment_name: row.equipment_name,
      status: row.status,
      sector_name: row.sector_name,
      total_issues: parseInt(row.total_issues) || 0,
      open_issues: parseInt(row.open_issues) || 0,
      high_priority_issues: parseInt(row.high_priority_issues) || 0,
      total_cost: parseFloat(row.total_cost) || 0,
      last_issue_date: row.last_issue_date,
      criticality_score: (parseInt(row.open_issues) || 0) * 3 + 
                        (parseInt(row.high_priority_issues) || 0) * 2 + 
                        (parseInt(row.total_issues) || 0)
    }))

    console.log(`✅ Encontrados ${equipmentData.length} equipamentos`)
    console.log(`📊 Status summary: ${statusSummary.length} categorias`)
    console.log(`⚠️ Equipamentos críticos: ${criticalEquipment.length}`)

    return NextResponse.json({
      equipmentStatus: equipmentData,
      statusSummary: statusSummary,
      criticalEquipment: criticalEquipment,
      summary: {
        total_equipment: equipmentData.length,
        active_equipment: statusSummary.find(s => s.status === 'ativo')?.count || 0,
        inactive_equipment: statusSummary.find(s => s.status === 'inativo')?.count || 0,
        maintenance_equipment: statusSummary.find(s => s.status === 'manutencao')?.count || 0,
        critical_equipment: criticalEquipment.length,
        total_orders: equipmentData.reduce((sum, eq) => sum + eq.total_orders, 0),
        total_cost: equipmentData.reduce((sum, eq) => sum + eq.total_cost, 0)
      }
    })

  } catch (error) {
    console.error('❌ Erro na API equipment-status:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}

function calculateHealthScore(equipmentData: any): number {
  const { totalOrders, openOrders, inProgressOrders, highPriorityOrders, totalCost } = equipmentData
  
  // Score base de 100
  let score = 100
  
  // Penalizar por ordens abertas (mais crítico)
  score -= openOrders * 15
  
  // Penalizar por ordens em andamento
  score -= inProgressOrders * 10
  
  // Penalizar por ordens de alta prioridade
  score -= highPriorityOrders * 20
  
  // Penalizar por custo alto (normalizado)
  if (totalCost > 1000) {
    score -= Math.min(20, (totalCost / 1000) * 5)
  }
  
  // Garantir que o score não seja negativo
  return Math.max(0, Math.round(score))
}