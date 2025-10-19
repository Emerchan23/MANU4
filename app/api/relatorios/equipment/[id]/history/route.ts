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
    
    // Buscar histórico de manutenções do equipamento (retornar array vazio se não houver dados)
    try {
      const [rows] = await connection.execute(`
        SELECT 
          ms.id,
          ms.scheduled_date as date,
          COALESCE(ms.maintenance_type, 'Manutenção') as type,
          COALESCE(ms.description, 'Sem descrição') as description,
          ms.status,
          COALESCE(u.name, 'Não atribuído') as technician_name,
          COALESCE(ms.estimated_cost, 0) as cost,
          'Agendamento' as source_type
        FROM maintenance_schedules ms
        LEFT JOIN users u ON ms.assigned_technician_id = u.id
        WHERE ms.equipment_id = ?
        ORDER BY ms.scheduled_date DESC
        LIMIT 20
      `, [equipmentId])

      await connection.end()
      return NextResponse.json(rows || [])
    } catch (queryError) {
      console.error('Erro na query de histórico:', queryError)
      await connection.end()
      return NextResponse.json([])
    }
  } catch (error) {
    console.error('Erro ao buscar histórico do equipamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}