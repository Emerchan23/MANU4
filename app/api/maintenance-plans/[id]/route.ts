import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

// GET - Get specific maintenance plan with tasks
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Get maintenance plan
    const planQuery = 'SELECT * FROM maintenance_plans WHERE id = ?'
    const planResult = await query(planQuery, [id])

    if (planResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Maintenance plan not found' },
        { status: 404 }
      )
    }

    const planData = planResult[0]

    // Get associated tasks
    const tasksQuery = `
      SELECT * FROM maintenance_tasks 
      WHERE plan_id = ? 
      ORDER BY order_sequence ASC
    `
    const tasksData = await query(tasksQuery, [id])

    // Parse equipment_ids JSON
    let equipment_ids = []
    try {
      equipment_ids = JSON.parse(planData.equipment_ids || '[]')
    } catch (e) {
      console.error('Error parsing equipment_ids:', e)
    }

    const result = {
      ...planData,
      equipment_ids,
      tasks: tasksData || []
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error fetching maintenance plan:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch maintenance plan' },
      { status: 500 }
    )
  }
}

// DELETE - Delete maintenance plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if plan has active schedules
    const schedulesQuery = `
      SELECT id FROM maintenance_schedules 
      WHERE maintenance_plan_id = ? 
      AND status IN ('SCHEDULED', 'IN_PROGRESS') 
      LIMIT 1
    `
    const schedules = await query(schedulesQuery, [id])

    if (schedules.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete plan with active schedules' },
        { status: 400 }
      )
    }

    // Delete associated tasks first
    const deleteTasksQuery = 'DELETE FROM maintenance_tasks WHERE plan_id = ?'
    await query(deleteTasksQuery, [id])

    // Delete maintenance plan
    const deletePlanQuery = 'DELETE FROM maintenance_plans WHERE id = ?'
    const deleteResult = await query(deletePlanQuery, [id])

    if (deleteResult.affectedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Maintenance plan not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Maintenance plan deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting maintenance plan:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete maintenance plan' },
      { status: 500 }
    )
  }
}