import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

// PUT - Complete maintenance schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const {
      completed_tasks,
      actual_duration,
      actual_cost,
      completion_notes,
      photos
    } = body

    // Validate required fields
    if (!completed_tasks || !actual_duration) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: completed_tasks, actual_duration' },
        { status: 400 }
      )
    }

    // Get current schedule
    const currentScheduleQuery = `
      SELECT * FROM maintenance_schedules WHERE id = ?
    `
    const currentScheduleResult = await query(currentScheduleQuery, [id])

    if (currentScheduleResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Maintenance schedule not found' },
        { status: 404 }
      )
    }

    const currentSchedule = currentScheduleResult[0]

    if (currentSchedule.status === 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Maintenance schedule is already completed' },
        { status: 400 }
      )
    }

    const completedAt = new Date()

    // Update schedule as completed
    const updateScheduleQuery = `
      UPDATE maintenance_schedules 
      SET 
        status = 'COMPLETED',
        completed_at = ?,
        actual_duration = ?,
        actual_cost = ?,
        completion_notes = ?,
        updated_at = ?
      WHERE id = ?
    `

    await query(updateScheduleQuery, [
      completedAt,
      parseInt(actual_duration),
      actual_cost ? parseFloat(actual_cost) : null,
      completion_notes || null,
      completedAt,
      id
    ])

    // Get updated schedule
    const updatedScheduleResult = await query(currentScheduleQuery, [id])
    const updatedSchedule = updatedScheduleResult[0]

    // Create history record
    const historyQuery = `
      INSERT INTO maintenance_history (
        schedule_id, 
        equipment_id, 
        execution_date, 
        duration_minutes, 
        cost, 
        notes, 
        completed_tasks, 
        photos, 
        executed_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    try {
      await query(historyQuery, [
        id,
        currentSchedule.equipment_id,
        completedAt,
        parseInt(actual_duration),
        actual_cost ? parseFloat(actual_cost) : 0,
        completion_notes || null,
        JSON.stringify(completed_tasks || []),
        JSON.stringify(photos || []),
        currentSchedule.assigned_user_id
      ])
    } catch (historyError) {
      console.error('Error creating maintenance history:', historyError)
      // Don't fail the entire operation, just log the error
    }

    // Generate next schedule if this was from a recurring plan
    if (currentSchedule.maintenance_plan_id) {
      try {
        const planQuery = `
          SELECT frequency, estimated_duration, estimated_cost 
          FROM maintenance_plans 
          WHERE id = ?
        `
        const planResult = await query(planQuery, [currentSchedule.maintenance_plan_id])

        if (planResult.length > 0) {
          const planData = planResult[0]
          const nextDate = calculateNextMaintenanceDate(
            new Date(currentSchedule.scheduled_date),
            planData.frequency
          )

          if (nextDate) {
            const insertNextScheduleQuery = `
              INSERT INTO maintenance_schedules (
                maintenance_plan_id, 
                equipment_id, 
                scheduled_date, 
                status, 
                priority, 
                notes
              ) VALUES (?, ?, ?, 'SCHEDULED', 'MEDIUM', ?)
            `

            await query(insertNextScheduleQuery, [
              currentSchedule.maintenance_plan_id,
              currentSchedule.equipment_id,
              nextDate,
              `Auto-generated from completed maintenance on ${completedAt.toLocaleDateString()}`
            ])
          }
        }
      } catch (error) {
        console.error('Error generating next schedule:', error)
        // Don't fail the operation if next schedule generation fails
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedSchedule,
      message: 'Maintenance completed successfully'
    })

  } catch (error) {
    console.error('Error completing maintenance schedule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to complete maintenance schedule' },
      { status: 500 }
    )
  }
}

// Helper function to calculate next maintenance date based on frequency
function calculateNextMaintenanceDate(currentDate: Date, frequency: string): Date | null {
  const nextDate = new Date(currentDate)

  switch (frequency) {
    case 'DAILY':
      nextDate.setDate(nextDate.getDate() + 1)
      break
    case 'WEEKLY':
      nextDate.setDate(nextDate.getDate() + 7)
      break
    case 'MONTHLY':
      nextDate.setMonth(nextDate.getMonth() + 1)
      break
    case 'QUARTERLY':
      nextDate.setMonth(nextDate.getMonth() + 3)
      break
    case 'SEMIANNUAL':
      nextDate.setMonth(nextDate.getMonth() + 6)
      break
    case 'ANNUAL':
      nextDate.setFullYear(nextDate.getFullYear() + 1)
      break
    default:
      return null
  }

  return nextDate
}