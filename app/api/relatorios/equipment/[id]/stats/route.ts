import { NextRequest, NextResponse } from 'next/server'
import { getConnection } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const equipmentId = parseInt(params.id)

    if (isNaN(equipmentId)) {
      return NextResponse.json(
        { error: 'ID do equipamento inválido' },
        { status: 400 }
      )
    }

    const connection = await getConnection()
    
    // Buscar estatísticas do equipamento (com tratamento de erro)
    try {
      const [statsRows] = await connection.execute(`
        SELECT 
          COUNT(*) as total_maintenances,
          COALESCE(SUM(estimated_cost), 0) as total_cost,
          0 as average_repair_time,
          ROUND(
            (COUNT(CASE WHEN status = 'CONCLUIDA' THEN 1 END) * 100.0 / 
             NULLIF(COUNT(*), 0)), 1
          ) as success_rate
        FROM maintenance_schedules
        WHERE equipment_id = ?
      `, [equipmentId])

      await connection.end()

      const stats = statsRows[0] || {
        total_maintenances: 0,
        total_cost: 0,
        average_repair_time: 0,
        success_rate: 0
      }

      return NextResponse.json({
        totalMaintenances: parseInt(stats.total_maintenances) || 0,
        totalCost: parseFloat(stats.total_cost) || 0,
        averageRepairTime: Math.round(parseFloat(stats.average_repair_time) || 0),
        successRate: parseFloat(stats.success_rate) || 0
      })
    } catch (queryError) {
      console.error('Erro na query de estatísticas:', queryError)
      await connection.end()
      return NextResponse.json({
        totalMaintenances: 0,
        totalCost: 0,
        averageRepairTime: 0,
        successRate: 0
      })
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas do equipamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}