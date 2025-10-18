import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

// GET - List maintenance plans with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const frequency = searchParams.get('frequency')
    const maintenance_type = searchParams.get('maintenance_type')
    const is_active = searchParams.get('is_active')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Build WHERE clause
    let whereConditions = []
    let queryParams = []

    if (search) {
      whereConditions.push('(name LIKE ? OR description LIKE ?)')
      queryParams.push(`%${search}%`, `%${search}%`)
    }
    
    if (frequency) {
      whereConditions.push('frequency = ?')
      queryParams.push(frequency)
    }
    
    if (maintenance_type) {
      whereConditions.push('maintenance_type = ?')
      queryParams.push(maintenance_type)
    }
    
    if (is_active !== null && is_active !== undefined) {
      whereConditions.push('is_active = ?')
      queryParams.push(is_active === 'true' ? 1 : 0)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM maintenance_plans ${whereClause}`
    const countResult = await query(countQuery, queryParams)
    const total = countResult[0]?.total || 0

    // Get paginated data
    const dataQuery = `
      SELECT * FROM maintenance_plans 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `
    const data = await query(dataQuery, [...queryParams, limit, offset])

    return NextResponse.json({
      success: true,
      data: data || [],
      total,
      page,
      limit
    })

  } catch (error) {
    console.error('Error fetching maintenance plans:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch maintenance plans' },
      { status: 500 }
    )
  }
}

// POST - Create new maintenance plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      frequency,
      maintenance_type,
      estimated_duration,
      estimated_cost,
      equipment_ids,
      tasks
    } = body

    // Validate required fields
    if (!name || !frequency || !maintenance_type || !estimated_duration) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate frequency
    const validFrequencies = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL']
    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { success: false, error: 'Invalid frequency value' },
        { status: 400 }
      )
    }

    // Validate maintenance type
    const validTypes = ['PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE']
    if (!validTypes.includes(maintenance_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid maintenance type' },
        { status: 400 }
      )
    }

    // Create maintenance plan
    const insertPlanQuery = `
      INSERT INTO maintenance_plans (
        name, 
        description, 
        frequency, 
        maintenance_type, 
        estimated_duration, 
        estimated_cost, 
        equipment_ids, 
        is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `

    const planResult = await query(insertPlanQuery, [
      name,
      description || null,
      frequency,
      maintenance_type,
      parseInt(estimated_duration),
      parseFloat(estimated_cost) || 0,
      JSON.stringify(equipment_ids || [])
    ])

    const planId = planResult.insertId

    // Get the created plan
    const getPlanQuery = 'SELECT * FROM maintenance_plans WHERE id = ?'
    const planData = await query(getPlanQuery, [planId])

    // Create associated tasks if provided
    if (tasks && tasks.length > 0) {
      const insertTasksQuery = `
        INSERT INTO maintenance_tasks (
          plan_id, 
          task_name, 
          description, 
          is_required, 
          order_sequence
        ) VALUES ?
      `

      const tasksToInsert = tasks.map((task: any, index: number) => [
        planId,
        task.task_name || task.name,
        task.description || null,
        task.is_required !== false ? 1 : 0,
        task.order_sequence || index + 1
      ])

      try {
        // Insert tasks one by one since MariaDB doesn't support bulk insert with VALUES
        for (const taskData of tasksToInsert) {
          await query(
            'INSERT INTO maintenance_tasks (plan_id, task_name, description, is_required, order_sequence) VALUES (?, ?, ?, ?, ?)',
            taskData
          )
        }
      } catch (tasksError) {
        console.error('Error creating maintenance tasks:', tasksError)
        // Don't fail the entire operation, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      data: planData[0],
      message: 'Maintenance plan created successfully'
    })

  } catch (error) {
    console.error('Error creating maintenance plan:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create maintenance plan' },
      { status: 500 }
    )
  }
}

// PUT - Update maintenance plan
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      name,
      description,
      frequency,
      maintenance_type,
      estimated_duration,
      estimated_cost,
      equipment_ids,
      is_active,
      tasks
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Plan ID is required' },
        { status: 400 }
      )
    }

    // Build update query dynamically
    let updateFields = []
    let updateParams = []

    if (name !== undefined) {
      updateFields.push('name = ?')
      updateParams.push(name)
    }
    if (description !== undefined) {
      updateFields.push('description = ?')
      updateParams.push(description)
    }
    if (frequency !== undefined) {
      updateFields.push('frequency = ?')
      updateParams.push(frequency)
    }
    if (maintenance_type !== undefined) {
      updateFields.push('maintenance_type = ?')
      updateParams.push(maintenance_type)
    }
    if (estimated_duration !== undefined) {
      updateFields.push('estimated_duration = ?')
      updateParams.push(parseInt(estimated_duration))
    }
    if (estimated_cost !== undefined) {
      updateFields.push('estimated_cost = ?')
      updateParams.push(parseFloat(estimated_cost))
    }
    if (equipment_ids !== undefined) {
      updateFields.push('equipment_ids = ?')
      updateParams.push(JSON.stringify(equipment_ids))
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?')
      updateParams.push(is_active ? 1 : 0)
    }

    updateFields.push('updated_at = ?')
    updateParams.push(new Date())
    updateParams.push(id)

    const updatePlanQuery = `
      UPDATE maintenance_plans 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `

    await query(updatePlanQuery, updateParams)

    // Get updated plan
    const getPlanQuery = 'SELECT * FROM maintenance_plans WHERE id = ?'
    const planData = await query(getPlanQuery, [id])

    if (planData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Maintenance plan not found' },
        { status: 404 }
      )
    }

    // Update tasks if provided
    if (tasks) {
      // Delete existing tasks
      await query('DELETE FROM maintenance_tasks WHERE plan_id = ?', [id])

      // Insert new tasks
      if (tasks.length > 0) {
        for (const task of tasks) {
          await query(
            'INSERT INTO maintenance_tasks (plan_id, task_name, description, is_required, order_sequence) VALUES (?, ?, ?, ?, ?)',
            [
              id,
              task.task_name || task.name,
              task.description || null,
              task.is_required !== false ? 1 : 0,
              task.order_sequence || tasks.indexOf(task) + 1
            ]
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: planData[0],
      message: 'Maintenance plan updated successfully'
    })

  } catch (error) {
    console.error('Error updating maintenance plan:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update maintenance plan' },
      { status: 500 }
    )
  }
}