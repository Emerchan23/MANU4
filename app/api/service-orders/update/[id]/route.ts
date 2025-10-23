import { NextRequest, NextResponse } from 'next/server'
import { formatDateBR, formatDateISO } from '@/lib/date-utils-br'

// POST - Atualizar ordem de serviço (usando POST para evitar problemas com PUT)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    console.log('=== INICIANDO ATUALIZAÇÃO DE ORDEM DE SERVIÇO ===', id)
    
    // Verificar se a ordem existe primeiro
    console.log('Verificando se ordem existe...')
    const existingOrder = await query('SELECT * FROM service_orders WHERE id = ?', [id])
    
    if (existingOrder.length === 0) {
      console.log('❌ Ordem de serviço não encontrada:', id)
      return NextResponse.json(
        { success: false, error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      )
    }

    console.log('✅ Ordem encontrada:', existingOrder[0].id, existingOrder[0].status)

    // Ler o body da requisição
    let body
    try {
      body = await request.json()
      console.log('✅ Body lido com sucesso:', body)
    } catch (error) {
      console.error('❌ Erro ao ler body:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao processar dados da requisição' },
        { status: 400 }
      )
    }

    if (!body) {
      console.log('❌ Body vazio ou inválido')
      return NextResponse.json(
        { success: false, error: 'Dados da requisição inválidos' },
        { status: 400 }
      )
    }

    const {
      equipmentId,
      companyId,
      maintenanceType,
      maintenanceTypeId,
      description,
      priority,
      status,
      estimatedCost,
      actualCost,
      scheduledDate,
      completionDate,
      observations,
      assignedTo,
      templateId
    } = body

    console.log('Dados extraídos do body:', {
      status,
      equipmentId,
      companyId,
      priority
    })

    // Preparar campos para atualização
    const updateFields = []
    const updateValues = []

    if (equipmentId !== undefined) {
      updateFields.push('equipment_id = ?')
      updateValues.push(equipmentId)
    }

    if (companyId !== undefined) {
      updateFields.push('company_id = ?')
      updateValues.push(companyId)
    }

    if (maintenanceType !== undefined) {
      updateFields.push('type = ?')
      updateValues.push(maintenanceType)
    }

    if (maintenanceTypeId !== undefined) {
      updateFields.push('maintenance_type_id = ?')
      updateValues.push(maintenanceTypeId)
    }

    if (description !== undefined) {
      updateFields.push('description = ?')
      updateValues.push(description)
    }

    if (priority !== undefined) {
      updateFields.push('priority = ?')
      updateValues.push(priority)
    }

    if (status !== undefined) {
      updateFields.push('status = ?')
      updateValues.push(status)
      console.log('🔄 Atualizando status para:', status)
    }

    if (estimatedCost !== undefined) {
      updateFields.push('cost = ?')
      updateValues.push(estimatedCost)
    }

    if (body.cost !== undefined) {
      updateFields.push('cost = ?')
      updateValues.push(body.cost)
    }

    if (scheduledDate !== undefined) {
      updateFields.push('scheduled_date = ?')
      if (scheduledDate) {
        const formattedDate = formatDateISO(scheduledDate)
        updateValues.push(formattedDate || null)
      } else {
        updateValues.push(null)
      }
    }

    if (completionDate !== undefined) {
      updateFields.push('completion_date = ?')
      if (completionDate) {
        const formattedDate = formatDateISO(completionDate)
        updateValues.push(formattedDate || null)
      } else {
        updateValues.push(null)
      }
    }

    if (observations !== undefined) {
      updateFields.push('observations = ?')
      updateValues.push(observations)
    }

    if (assignedTo !== undefined) {
      updateFields.push('assigned_to = ?')
      updateValues.push(assignedTo)
    }

    if (updateFields.length === 0) {
      console.log('❌ Nenhum campo para atualizar')
      return NextResponse.json(
        { success: false, error: 'Nenhum campo para atualizar' },
        { status: 400 }
      )
    }

    console.log('📝 Campos para atualizar:', updateFields)
    console.log('📊 Valores:', updateValues)

    // Executar atualização
    const updateQuery = `
      UPDATE service_orders 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    
    updateValues.push(id)
    
    console.log('🔍 Query final:', updateQuery)
    console.log('🔍 Valores finais:', updateValues)
    
    const result = await query(updateQuery, updateValues)
    console.log('✅ Resultado da atualização:', result)

    // Buscar ordem atualizada
    console.log('🔍 Buscando ordem atualizada...')
    const updatedOrder = await query(`
      SELECT 
        so.*,
        e.name as equipment_name,
        c.name as company_name,
        u1.name as created_by_name,
        u2.name as assigned_to_name,
        mt.name as maintenance_type_name
      FROM service_orders so
      LEFT JOIN equipment e ON so.equipment_id = e.id
      LEFT JOIN companies c ON so.company_id = c.id
      LEFT JOIN users u1 ON so.created_by = u1.id
      LEFT JOIN users u2 ON so.assigned_to = u2.id
      LEFT JOIN maintenance_types mt ON so.maintenance_type_id = mt.id
      WHERE so.id = ?
    `, [id])

    if (updatedOrder.length === 0) {
      console.log('❌ Erro: ordem não encontrada após atualização')
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar ordem atualizada' },
        { status: 500 }
      )
    }

    const order = updatedOrder[0]
    console.log('✅ Ordem encontrada após atualização:', order.id, order.status)

    // Formatar datas
    const formattedOrder = {
      ...order,
      scheduled_date: order.scheduled_date ? formatDateBR(order.scheduled_date) : null,
      completion_date: order.completion_date ? formatDateBR(order.completion_date) : null,
      created_at: formatDateBR(order.created_at),
      updated_at: formatDateBR(order.updated_at)
    }

    console.log('🎉 Ordem atualizada com sucesso! Status:', formattedOrder.status)

    return NextResponse.json({
      success: true,
      data: formattedOrder,
      message: 'Ordem de serviço atualizada com sucesso!'
    })

  } catch (error) {
    console.error('💥 ERRO CRÍTICO ao atualizar ordem de serviço:', error)
    console.error('Stack trace:', error.stack)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}