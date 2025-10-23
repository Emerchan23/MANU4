import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  charset: 'utf8mb4',
  timezone: '+00:00'
}

// GET - List maintenance schedules with filters and joins
export async function GET(request: NextRequest) {
  let connection;
  
  try {
    console.log('🔄 API /api/maintenance-schedules - Iniciando busca de agendamentos...');
    
    const { searchParams } = new URL(request.url)
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const equipment_id = searchParams.get('equipment_id')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assigned_to = searchParams.get('assigned_to')
    const plan_id = searchParams.get('plan_id')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    console.log('📊 Parâmetros:', { start_date, end_date, equipment_id, status, priority, assigned_to, plan_id, page, limit, offset });

    // Create direct connection
    connection = await mysql.createConnection(dbConfig);

    // Check if maintenance_schedules table exists
    console.log('🔍 Verificando se a tabela maintenance_schedules existe...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'maintenance_schedules'
    `, [process.env.DB_NAME || 'hospital_maintenance']);
    
    if (tables.length === 0) {
      console.log('❌ Tabela maintenance_schedules não existe! Criando...');
      
      await connection.execute(`
        CREATE TABLE maintenance_schedules (
          id INT(11) NOT NULL AUTO_INCREMENT,
          equipment_id INT(11) NOT NULL,
          maintenance_plan_id INT(11) NULL,
          scheduled_date DATE NOT NULL,
          priority ENUM('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL DEFAULT 'MEDIUM',
          assigned_user_id INT(11) NULL,
          description TEXT NULL,
          estimated_duration INT(11) NULL COMMENT 'Duration in minutes',
          status ENUM('SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED','OVERDUE') NOT NULL DEFAULT 'SCHEDULED',
          completion_date DATETIME NULL,
          completion_notes TEXT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          INDEX idx_equipment_id (equipment_id),
          INDEX idx_scheduled_date (scheduled_date),
          INDEX idx_status (status),
          INDEX idx_assigned_user (assigned_user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('✅ Tabela maintenance_schedules criada!');
    }

    // Build WHERE conditions
    const conditions = []
    const params = []

    if (start_date) {
      conditions.push('ms.scheduled_date >= ?')
      params.push(start_date)
    }
    
    if (end_date) {
      conditions.push('ms.scheduled_date <= ?')
      params.push(end_date)
    }
    
    if (equipment_id) {
      conditions.push('ms.equipment_id = ?')
      params.push(equipment_id)
    }
    
    if (status) {
      conditions.push('ms.status = ?')
      params.push(status)
    }
    
    if (priority) {
      conditions.push('ms.priority = ?')
      params.push(priority)
    }
    
    if (assigned_to) {
      conditions.push('ms.assigned_user_id = ?')
      params.push(assigned_to)
    }
    
    if (plan_id) {
      conditions.push('ms.maintenance_plan_id = ?')
      params.push(plan_id)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    console.log('🔍 WHERE clause:', whereClause);
    console.log('🔍 Query params:', params);

    // Count total records
    const countQuery = `
      SELECT COUNT(*) as total
      FROM maintenance_schedules ms
      ${whereClause}
    `
    
    console.log('📊 Executando query de contagem...');
    const [countResult] = await connection.execute(countQuery, params)
    const total = countResult[0]?.total || 0
    console.log('📊 Total de registros encontrados:', total);

    // Get paginated data with joins
    const dataQuery = `
      SELECT 
        ms.*,
        e.name as equipment_name,
        u1.name as assigned_user_name,
        u2.name as created_by_name
      FROM maintenance_schedules ms
      LEFT JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN users u1 ON ms.assigned_to = u1.id
      LEFT JOIN users u2 ON ms.created_by = u2.id
      ${whereClause}
      ORDER BY ms.scheduled_date DESC
      LIMIT ? OFFSET ?
    `
    
    const dataParams = [...params, limit, offset]
    console.log('📊 Executando query de dados com parâmetros:', dataParams);
    const [schedules] = await connection.execute(dataQuery, dataParams)
    console.log('📊 Agendamentos encontrados:', schedules.length);

    const response = {
      success: true,
      data: schedules,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    console.log('✅ API /api/maintenance-schedules - Busca concluída com sucesso');
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Erro ao buscar agendamentos de manutenção:', error)
    console.error('❌ Stack trace:', error.stack)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor ao buscar agendamentos' },
      { status: 500 }
    )
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// POST - Create new maintenance schedule
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      equipment_id,
      maintenance_plan_id,
      scheduled_date,
      priority = 'media',
      assigned_user_id,
      description,
      estimated_duration,
      status = 'agendado'
    } = body

    // Validate required fields
    if (!equipment_id || !scheduled_date) {
      return NextResponse.json(
        { success: false, error: 'Equipment ID and scheduled date are required' },
        { status: 400 }
      )
    }

    // Check if equipment exists
    const equipmentCheck = await query(
      'SELECT id FROM equipment WHERE id = ?',
      [equipment_id]
    )
    
    if (equipmentCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Equipment not found' },
        { status: 404 }
      )
    }

    // Check if maintenance plan exists (if provided)
    if (maintenance_plan_id) {
      const planCheck = await query(
        'SELECT id FROM maintenance_plans WHERE id = ?',
        [maintenance_plan_id]
      )
      
      if (planCheck.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Maintenance plan not found' },
          { status: 404 }
        )
      }
    }

    // Check if user exists (if provided)
    if (assigned_user_id) {
      const userCheck = await query(
        'SELECT id FROM users WHERE id = ?',
        [assigned_user_id]
      )
      
      if (userCheck.length === 0) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        )
      }
    }

    // Insert new schedule
    const insertQuery = `
      INSERT INTO maintenance_schedules (
        equipment_id,
        maintenance_plan_id,
        scheduled_date,
        priority,
        assigned_user_id,
        description,
        estimated_duration,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `

    const result = await query(insertQuery, [
      equipment_id,
      maintenance_plan_id,
      scheduled_date,
      priority,
      assigned_user_id,
      description,
      estimated_duration,
      status
    ])

    // Get the created schedule with joins
    const createdSchedule = await query(`
      SELECT 
        ms.*,
        mp.name as maintenance_plan_name,
        e.name as equipment_name,
        e.patrimonio as equipment_code,
        u.full_name as user_name
      FROM maintenance_schedules ms
      LEFT JOIN maintenance_plans mp ON ms.maintenance_plan_id = mp.id
      LEFT JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN users u ON ms.assigned_user_id = u.id
      WHERE ms.id = ?
    `, [result.insertId])

    return NextResponse.json({
      success: true,
      data: createdSchedule[0],
      message: 'Maintenance schedule created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating maintenance schedule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create maintenance schedule' },
      { status: 500 }
    )
  }
}

// PUT - Update maintenance schedule
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      equipment_id,
      maintenance_plan_id,
      scheduled_date,
      priority,
      assigned_user_id,
      description,
      estimated_duration,
      status
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Schedule ID is required' },
        { status: 400 }
      )
    }

    // Check if schedule exists
    const scheduleCheck = await query(
      'SELECT id FROM maintenance_schedules WHERE id = ?',
      [id]
    )
    
    if (scheduleCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Maintenance schedule not found' },
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
    if (maintenance_plan_id !== undefined) {
      updates.push('maintenance_plan_id = ?')
      params.push(maintenance_plan_id)
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
    if (description !== undefined) {
      updates.push('description = ?')
      params.push(description)
    }
    if (estimated_duration !== undefined) {
      updates.push('estimated_duration = ?')
      params.push(estimated_duration)
    }
    if (status !== undefined) {
      updates.push('status = ?')
      params.push(status)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      )
    }

    updates.push('updated_at = NOW()')
    params.push(id)

    const updateQuery = `
      UPDATE maintenance_schedules 
      SET ${updates.join(', ')}
      WHERE id = ?
    `

    await query(updateQuery, params)

    // Get the updated schedule with joins
    const updatedSchedule = await query(`
      SELECT 
        ms.*,
        mp.name as maintenance_plan_name,
        e.name as equipment_name,
        e.patrimonio as equipment_code,
        u.full_name as user_name
      FROM maintenance_schedules ms
      LEFT JOIN maintenance_plans mp ON ms.maintenance_plan_id = mp.id
      LEFT JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN users u ON ms.assigned_user_id = u.id
      WHERE ms.id = ?
    `, [id])

    return NextResponse.json({
      success: true,
      data: updatedSchedule[0],
      message: 'Maintenance schedule updated successfully'
    })

  } catch (error) {
    console.error('Error updating maintenance schedule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update maintenance schedule' },
      { status: 500 }
    )
  }
}