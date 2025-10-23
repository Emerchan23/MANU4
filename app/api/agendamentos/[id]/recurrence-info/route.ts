import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    console.log(`🔍 [RECURRENCE-INFO] Verificando recorrências para agendamento ID: ${id}`)

    // Verificar se o agendamento existe
    const existingSchedule = await query('SELECT * FROM maintenance_schedules WHERE id = ?', [id])
    if (existingSchedule.length === 0) {
      console.log(`❌ [RECURRENCE-INFO] Agendamento não encontrado: ${id}`)
      return NextResponse.json(
        { success: false, error: 'Agendamento não encontrado' },
        { status: 404 }
      )
    }

    const schedule = existingSchedule[0]
    let hasRecurrence = false
    let recurringCount = 0
    let isParent = false

    console.log(`📊 [RECURRENCE-INFO] Agendamento ${id} - parent_schedule_id: ${schedule.parent_schedule_id}`)

    // Verificar se é um agendamento principal (sem parent_schedule_id)
    if (!schedule.parent_schedule_id) {
      // Contar quantos agendamentos filhos existem
      const childSchedules = await query(
        'SELECT COUNT(*) as count FROM maintenance_schedules WHERE parent_schedule_id = ?', 
        [id]
      )
      recurringCount = childSchedules[0]?.count || 0
      hasRecurrence = recurringCount > 0
      isParent = true
      
      console.log(`📊 [RECURRENCE-INFO] Agendamento principal ${id} tem ${recurringCount} filhos`)
    } else {
      console.log(`📊 [RECURRENCE-INFO] Agendamento ${id} é filho de ${schedule.parent_schedule_id}`)
    }

    const result = {
      scheduleId: id,
      hasRecurrence: hasRecurrence,
      recurringCount: recurringCount,
      isParent: isParent,
      isChild: !!schedule.parent_schedule_id
    }

    console.log(`✅ [RECURRENCE-INFO] Resultado para ${id}:`, result)

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('❌ [RECURRENCE-INFO] Erro ao verificar recorrências:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}