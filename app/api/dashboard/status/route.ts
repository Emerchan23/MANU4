import { NextRequest, NextResponse } from 'next/server'
import { getConnection } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const connection = await getConnection()
    
    // Buscar status dos equipamentos
    const [equipmentStatus] = await connection.execute(`
      SELECT 
        status,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM equipamentos)), 2) as percentage
      FROM equipamentos
      WHERE status IS NOT NULL
      GROUP BY status
      ORDER BY count DESC
    `)

    // Buscar status das ordens de serviço
    const [serviceOrderStatus] = await connection.execute(`
      SELECT 
        status,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ordens_servico)), 2) as percentage
      FROM ordens_servico
      WHERE status IS NOT NULL
      GROUP BY status
      ORDER BY count DESC
    `)

    // Buscar alertas ativos (funcionalidade removida)
    const activeAlerts: any[] = []

    // Buscar métricas de disponibilidade
    const [availability] = await connection.execute(`
      SELECT 
        AVG(CASE WHEN status = 'Operacional' THEN 100 ELSE 0 END) as equipment_availability,
        COUNT(CASE WHEN status = 'Operacional' THEN 1 END) as operational_count,
        COUNT(CASE WHEN status = 'Manutenção' THEN 1 END) as maintenance_count,
        COUNT(CASE WHEN status = 'Inativo' THEN 1 END) as inactive_count,
        COUNT(*) as total_equipment
      FROM equipamentos
    `)

    // Buscar performance das ordens de serviço
    const [servicePerformance] = await connection.execute(`
      SELECT 
        COUNT(CASE WHEN status = 'concluida' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'em_andamento' THEN 1 END) as in_progress_orders,
        COUNT(CASE WHEN status = 'aberta' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'cancelada' THEN 1 END) as cancelled_orders,
        COUNT(*) as total_orders,
        AVG(CASE 
          WHEN status = 'concluida' AND completion_date IS NOT NULL 
          THEN DATEDIFF(completion_date, requested_date) 
          ELSE NULL 
        END) as avg_completion_days
      FROM service_orders
      WHERE requested_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `)

    const availabilityData = availability[0] as any
    const performanceData = servicePerformance[0] as any

    // Preparar dados de resposta
    const statusData = {
      equipment: {
        distribution: equipmentStatus,
        availability: Math.round(availabilityData?.equipment_availability || 0),
        operational: availabilityData?.operational_count || 0,
        maintenance: availabilityData?.maintenance_count || 0,
        inactive: availabilityData?.inactive_count || 0,
        total: availabilityData?.total_equipment || 0
      },
      serviceOrders: {
        distribution: serviceOrderStatus,
        completed: performanceData?.completed_orders || 0,
        inProgress: performanceData?.in_progress_orders || 0,
        pending: performanceData?.pending_orders || 0,
        cancelled: performanceData?.cancelled_orders || 0,
        total: performanceData?.total_orders || 0,
        avgCompletionDays: Math.round(performanceData?.avg_completion_days || 0)
      },
      alerts: {
        active: activeAlerts,
        totalActive: activeAlerts.reduce((sum: number, alert: any) => sum + alert.count, 0),
        critical: activeAlerts.filter((a: any) => a.severity === 'critical').reduce((sum: number, alert: any) => sum + alert.count, 0),
        warning: activeAlerts.filter((a: any) => a.severity === 'warning').reduce((sum: number, alert: any) => sum + alert.count, 0)
      }
    }

    await connection.end()

    return NextResponse.json({
      success: true,
      data: statusData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao buscar status:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}