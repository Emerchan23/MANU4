import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

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

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306')
    })
    
    // Buscar estatísticas do equipamento (com tratamento de erro)
    try {
      console.log(`🔍 [STATS API] Buscando estatísticas para equipamento ${equipmentId}`)
      
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

      console.log(`📊 [STATS API] Resultado da query:`, statsRows[0])

      await connection.end()

      const stats = statsRows[0] || {
        total_maintenances: 0,
        total_cost: 0,
        average_repair_time: 0,
        success_rate: 0
      }

      const response = {
        totalMaintenances: parseInt(stats.total_maintenances) || 0,
        totalCost: parseFloat(stats.total_cost) || 0,
        averageRepairTime: Math.round(parseFloat(stats.average_repair_time) || 0),
        successRate: parseFloat(stats.success_rate) || 0
      }

      console.log(`✅ [STATS API] Resposta final:`, response)
      return NextResponse.json(response)
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