import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Configuração do banco MariaDB
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  charset: 'utf8mb4'
}

// GET - Get specific maintenance schedule with details
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  let connection;
  try {
    const { id } = context.params
    console.log('🔄 API /api/maintenance-schedules/[id] - Buscando agendamento:', id);

    // Conectar ao MariaDB
    connection = await mysql.createConnection(dbConfig);

    // First, let's check if the schedule exists in the maintenance_schedules table
    const checkQuery = `SELECT * FROM maintenance_schedules WHERE id = ?`
    const [checkResult] = await connection.execute(checkQuery, [id])

    if (checkResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Agendamento de manutenção não encontrado' },
        { status: 404 }
      )
    }

    // Get maintenance schedule - simplified query first
    const scheduleQuery = `
      SELECT 
        ms.*
      FROM maintenance_schedules ms
      WHERE ms.id = ?
    `

    const [scheduleResult] = await connection.execute(scheduleQuery, [id])
    
    if (scheduleResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Agendamento não encontrado após JOIN' },
        { status: 404 }
      )
    }
    
    const scheduleData = scheduleResult[0]

    console.log('✅ Agendamento encontrado:', scheduleData.id);

    return NextResponse.json({
      success: true,
      data: scheduleData
    })

  } catch (error) {
    console.error('❌ Erro ao buscar agendamento:', error)
    console.error('❌ Stack trace:', error.stack)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor ao buscar agendamento' },
      { status: 500 }
    )
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// PUT - Update maintenance schedule (using request body)
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  let connection;
  try {
    const { id } = context.params
    console.log('🔄 API /api/maintenance-schedules/[id] - Atualizando agendamento:', id);
    
    // Ler o body da requisição
    const body = await request.json()
    console.log('📊 Body recebido:', body);

    const {
      equipment_id,
      maintenance_type,
      description,
      scheduled_date,
      priority,
      assigned_user_id,
      estimated_cost,
      status,
      company_id,
      maintenance_plan_id,
      observations
    } = body

    // Conectar ao MariaDB
    connection = await mysql.createConnection(dbConfig);

    // Check if schedule exists
    const [scheduleCheck] = await connection.execute(
      'SELECT id FROM maintenance_schedules WHERE id = ?',
      [id]
    )
    
    if (scheduleCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Agendamento de manutenção não encontrado' },
        { status: 404 }
      )
    }

    // Build update query dynamically
    const updates = []
    const params = []

    if (equipment_id !== undefined) {
      updates.push('equipment_id = ?')
      params.push(equipment_id)
    }
    if (maintenance_type !== undefined) {
      updates.push('maintenance_type = ?')
      params.push(maintenance_type)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      params.push(description)
    }
    if (scheduled_date !== undefined) {
      updates.push('scheduled_date = ?')
      params.push(scheduled_date)
    }
    if (priority !== undefined) {
      updates.push('priority = ?')
      params.push(priority)
    }
    if (assigned_user_id !== undefined) {
      updates.push('assigned_user_id = ?')
      params.push(assigned_user_id)
    }
    if (estimated_cost !== undefined) {
      updates.push('estimated_cost = ?')
      params.push(estimated_cost)
    }
    if (status !== undefined) {
      updates.push('status = ?')
      params.push(status)
    }
    if (company_id !== undefined) {
      updates.push('company_id = ?')
      params.push(company_id)
    }
    if (maintenance_plan_id !== undefined) {
      updates.push('maintenance_plan_id = ?')
      params.push(maintenance_plan_id)
    }
    if (observations !== undefined) {
      updates.push('observations = ?')
      params.push(observations)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum campo para atualizar foi fornecido' },
        { status: 400 }
      )
    }

    // Add updated_at
    updates.push('updated_at = NOW()')
    params.push(id)

    const updateQuery = `
      UPDATE maintenance_schedules 
      SET ${updates.join(', ')}
      WHERE id = ?
    `

    console.log('📊 Query de atualização:', updateQuery);
    console.log('📊 Parâmetros:', params);

    const [updateResult] = await connection.execute(updateQuery, params)

    if (updateResult.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhuma alteração foi feita' },
        { status: 400 }
      )
    }

    // Get updated schedule
    const [updatedSchedule] = await connection.execute(`
      SELECT 
        ms.*,
        e.name as equipment_name,
        e.code as equipment_code,
        e.model as equipment_model,
        e.sector_id,
        c.name as company_name,
        u.name as assigned_user_name
      FROM maintenance_schedules ms
      LEFT JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN companies c ON ms.company_id = c.id
      LEFT JOIN users u ON ms.assigned_user_id = u.id
      WHERE ms.id = ?
    `, [id])

    console.log('✅ Agendamento atualizado com sucesso:', id);

    return NextResponse.json({
      success: true,
      data: updatedSchedule[0],
      message: 'Agendamento atualizado com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro ao atualizar agendamento:', error)
    console.error('❌ Stack trace completo:', error.stack)
    console.error('❌ Detalhes do erro:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    })
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor ao atualizar agendamento' },
      { status: 500 }
    )
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// DELETE - Delete maintenance schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection;
  try {
    const { id } = params
    console.log('🔄 API /api/maintenance-schedules/[id] - Deletando agendamento:', id);

    // Conectar ao MariaDB
    connection = await mysql.createConnection(dbConfig);

    // Check if schedule exists
    const [scheduleCheck] = await connection.execute(
      'SELECT id, status FROM maintenance_schedules WHERE id = ?',
      [id]
    )

    if (scheduleCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Agendamento de manutenção não encontrado' },
        { status: 404 }
      )
    }

    const schedule = scheduleCheck[0]

    // Prevent deletion of completed schedules
    if (schedule.status === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Não é possível deletar agendamentos concluídos' },
        { status: 400 }
      )
    }

    // Delete the schedule
    const [deleteResult] = await connection.execute('DELETE FROM maintenance_schedules WHERE id = ?', [id])

    console.log('✅ Agendamento deletado com sucesso:', id);

    return NextResponse.json({
      success: true,
      message: 'Agendamento deletado com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro ao deletar agendamento:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor ao deletar agendamento' },
      { status: 500 }
    )
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}