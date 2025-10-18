import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database.js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('dateRange') || '30'
    const sectorId = searchParams.get('sectorId') || 'ALL'
    
    console.log('📊 SECTOR PERFORMANCE API - Buscando performance dos setores...')
    console.log('📅 Período:', dateRange, 'dias')
    console.log('🏢 Setor:', sectorId)

    // Calcular data de início baseada no período
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(dateRange))
    const startDateStr = startDate.toISOString().split('T')[0]

    // Query para performance por setor
    const sectorPerformanceQuery = `
      SELECT 
        s.id as sector_id,
        s.nome as sector_name,
        COUNT(DISTINCT e.id) as total_equipment,
        COUNT(so.id) as total_orders,
        COUNT(CASE WHEN so.status IN ('concluida', 'fechada') THEN 1 END) as completed_orders,
        COUNT(CASE WHEN so.status = 'aberta' THEN 1 END) as open_orders,
        COUNT(CASE WHEN so.status = 'em_andamento' THEN 1 END) as in_progress_orders,
        COUNT(CASE WHEN so.priority = 'alta' THEN 1 END) as high_priority_orders,
        COALESCE(AVG(CASE 
          WHEN so.status IN ('concluida', 'fechada') AND so.completion_date IS NOT NULL 
          THEN TIMESTAMPDIFF(HOUR, so.requested_date, so.completion_date) 
        END), 0) as avg_resolution_time_hours,
        COALESCE(SUM(CASE WHEN so.status IN ('concluida', 'fechada') THEN so.cost ELSE 0 END), 0) as total_cost,
        0 as preventive_count,
        0 as corrective_count
      FROM setores s
      LEFT JOIN equipment e ON s.id = e.sector_id
      LEFT JOIN service_orders so ON e.id = so.equipment_id AND so.requested_date >= ?
      WHERE 1=1 ${sectorId !== 'ALL' ? 'AND s.id = ?' : ''}
      GROUP BY s.id, s.nome
      ORDER BY completed_orders DESC, total_orders DESC
    `

    const sectorPerformanceParams = sectorId !== 'ALL' ? [startDateStr, sectorId] : [startDateStr]
    const sectorPerformanceResult = await query(sectorPerformanceQuery, sectorPerformanceParams)

    // Query para técnicos por setor (se houver tabela de técnicos)
    const technicianPerformanceQuery = `
      SELECT 
        s.id as sector_id,
        s.nome as sector_name,
        so.assigned_to,
        COUNT(so.id) as assigned_orders,
        COUNT(CASE WHEN so.status IN ('concluida', 'fechada') THEN 1 END) as completed_orders,
        COALESCE(AVG(CASE 
          WHEN so.status IN ('concluida', 'fechada') AND so.completion_date IS NOT NULL 
          THEN TIMESTAMPDIFF(HOUR, so.created_at, so.completion_date) 
        END), 0) as avg_resolution_time
      FROM service_orders so
      JOIN equipment e ON so.equipment_id = e.id
      JOIN setores s ON e.sector_id = s.id
      WHERE so.created_at >= ? 
        AND so.assigned_to IS NOT NULL 
        AND so.assigned_to != ''
        ${sectorId !== 'ALL' ? 'AND s.id = ?' : ''}
      GROUP BY s.id, s.nome, so.assigned_to
      HAVING assigned_orders > 0
      ORDER BY completed_orders DESC
    `

    const technicianPerformanceResult = await query(technicianPerformanceQuery, sectorPerformanceParams)

    // Processar dados de performance dos setores
    const sectorData = (sectorPerformanceResult as any[]).map(row => {
      const totalOrders = parseInt(row.total_orders) || 0
      const completedOrders = parseInt(row.completed_orders) || 0
      const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0
      
      return {
        sector_id: row.sector_id,
        sector_name: row.sector_name,
        total_equipment: parseInt(row.total_equipment) || 0,
        total_orders: totalOrders,
        completed_orders: completedOrders,
        open_orders: parseInt(row.open_orders) || 0,
        in_progress_orders: parseInt(row.in_progress_orders) || 0,
        high_priority_orders: parseInt(row.high_priority_orders) || 0,
        completion_rate: Math.round(completionRate * 100) / 100,
        avg_resolution_time_hours: Math.round((parseFloat(row.avg_resolution_time_hours) || 0) * 100) / 100,
        total_cost: parseFloat(row.total_cost) || 0,
        preventive_count: parseInt(row.preventive_count) || 0,
        corrective_count: parseInt(row.corrective_count) || 0,
        preventive_ratio: totalOrders > 0 ? Math.round(((parseInt(row.preventive_count) || 0) / totalOrders) * 10000) / 100 : 0
      }
    })

    // Processar dados de técnicos
    const technicianData = (technicianPerformanceResult as any[]).reduce((acc: any, row) => {
      const sectorId = row.sector_id
      if (!acc[sectorId]) {
        acc[sectorId] = {
          sector_name: row.sector_name,
          technicians: []
        }
      }
      
      const assignedOrders = parseInt(row.assigned_orders) || 0
      const completedOrders = parseInt(row.completed_orders) || 0
      const completionRate = assignedOrders > 0 ? (completedOrders / assignedOrders) * 100 : 0
      
      acc[sectorId].technicians.push({
        name: row.assigned_to,
        assigned_orders: assignedOrders,
        completed_orders: completedOrders,
        completion_rate: Math.round(completionRate * 100) / 100,
        avg_resolution_time: Math.round((parseFloat(row.avg_resolution_time) || 0) * 100) / 100
      })
      
      return acc
    }, {})

    // Calcular estatísticas gerais
    const totalEquipment = sectorData.reduce((sum, sector) => sum + sector.total_equipment, 0)
    const totalOrders = sectorData.reduce((sum, sector) => sum + sector.total_orders, 0)
    const totalCompletedOrders = sectorData.reduce((sum, sector) => sum + sector.completed_orders, 0)
    const overallCompletionRate = totalOrders > 0 ? (totalCompletedOrders / totalOrders) * 100 : 0
    const totalCost = sectorData.reduce((sum, sector) => sum + sector.total_cost, 0)
    const avgResolutionTime = sectorData.length > 0 ? 
      sectorData.reduce((sum, sector) => sum + sector.avg_resolution_time_hours, 0) / sectorData.length : 0

    // Identificar melhor e pior setor
    const bestSector = sectorData.reduce((best, current) => 
      current.completion_rate > best.completion_rate ? current : best, sectorData[0] || {})
    const worstSector = sectorData.reduce((worst, current) => 
      current.completion_rate < worst.completion_rate ? current : worst, sectorData[0] || {})

    const response = {
      sectorPerformance: sectorData,
      technicianPerformance: technicianData,
      summary: {
        totalEquipment,
        totalOrders,
        totalCompletedOrders,
        overallCompletionRate: Math.round(overallCompletionRate * 100) / 100,
        totalCost,
        avgResolutionTime: Math.round(avgResolutionTime * 100) / 100,
        bestPerformingSector: bestSector?.sector_name || 'N/A',
        worstPerformingSector: worstSector?.sector_name || 'N/A',
        period: `${dateRange} dias`,
        sector: sectorId === 'ALL' ? 'Todos os setores' : `Setor ${sectorId}`
      }
    }

    console.log('✅ SECTOR PERFORMANCE API - Dados processados com sucesso')
    console.log('🏢 Setores analisados:', sectorData.length)
    console.log('📊 Taxa de conclusão geral:', overallCompletionRate.toFixed(2) + '%')
    console.log('⏱️ Tempo médio de resolução:', avgResolutionTime.toFixed(2), 'horas')
    console.log('🏆 Melhor setor:', bestSector?.sector_name)
    console.log('⚠️ Pior setor:', worstSector?.sector_name)

    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ SECTOR PERFORMANCE API - Erro:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}