import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database.js'
import { formatDateISO, formatDateBR } from '@/lib/date-utils-br'

// GET - Buscar ordem de serviço específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    const orderQuery = `
      SELECT 
        so.*,
        e.name as equipment_name,
        e.model as equipment_model,
        e.serial_number as equipment_serial,
        c.name as company_name,
        c.contact_phone as company_phone,
        u1.name as created_by_name,
        u2.name as assigned_to_name,
        st.name as template_name,
        st.description_template,
        mt.nome as maintenance_type_name
      FROM service_orders so
      LEFT JOIN equipment e ON so.equipment_id = e.id
      LEFT JOIN companies c ON so.company_id = c.id
      LEFT JOIN users u1 ON so.created_by = u1.id
      LEFT JOIN users u2 ON so.assigned_to = u2.id
      LEFT JOIN service_templates st ON so.template_id = st.id
      LEFT JOIN tipos_manutencao mt ON so.maintenance_type_id = mt.id
      WHERE so.id = ?
    `

    const result = await query(orderQuery, [id])

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      )
    }

    const order = result[0]

    // Buscar histórico da ordem
    const historyQuery = `
      SELECT 
        mh.*,
        u.name as performed_by_name
      FROM maintenance_history mh
      LEFT JOIN users u ON mh.performed_by = u.id
      WHERE mh.service_order_id = ?
      ORDER BY mh.created_at DESC
    `

    const history = await query(historyQuery, [id])

    // Formatar datas
    const formattedOrder = {
      ...order,
      scheduled_date: order.scheduled_date ? formatDateBR(order.scheduled_date) : null,
      completion_date: order.completion_date ? formatDateBR(order.completion_date) : null,
      created_at: formatDateBR(order.created_at),
      updated_at: formatDateBR(order.updated_at)
    }

    const formattedHistory = history.map(item => ({
      ...item,
      execution_date: formatDateBR(item.execution_date),
      created_at: formatDateBR(item.created_at)
    }))

    return NextResponse.json({
      success: true,
      data: {
        ...formattedOrder,
        history: formattedHistory
      }
    })

  } catch (error) {
    console.error('Erro ao buscar ordem de serviço:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar ordem de serviço
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const body = await request.json()
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

    // Verificar se a ordem existe
    const existingOrder = await query('SELECT * FROM service_orders WHERE id = ?', [id])
    
    if (existingOrder.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      )
    }

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
    }

    // Usar 'cost' ao invés de 'estimated_cost' pois é o campo que existe na tabela
    if (estimatedCost !== undefined) {
      updateFields.push('cost = ?')
      updateValues.push(estimatedCost)
    }

    // Usar 'cost' para o campo cost da API
    if (body.cost !== undefined) {
      updateFields.push('cost = ?')
      updateValues.push(body.cost)
    }

    // Remover campos que não existem na tabela
    // if (actualCost !== undefined) {
    //   updateFields.push('actual_cost = ?')
    //   updateValues.push(actualCost)
    // }

    if (scheduledDate !== undefined) {
      updateFields.push('scheduled_date = ?')
      updateValues.push(scheduledDate ? formatDateISO(new Date(scheduledDate)) : null)
    }

    if (completionDate !== undefined) {
      updateFields.push('completion_date = ?')
      updateValues.push(completionDate ? formatDateISO(new Date(completionDate)) : null)
    }

    if (observations !== undefined) {
      updateFields.push('observations = ?')
      updateValues.push(observations)
    }

    if (assignedTo !== undefined) {
      updateFields.push('assigned_to = ?')
      updateValues.push(assignedTo)
    }

    // Remover campos que não existem na tabela
    // if (templateId !== undefined) {
    //   updateFields.push('template_id = ?')
    //   updateValues.push(templateId)
    // }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhum campo para atualizar' },
        { status: 400 }
      )
    }

    // Executar atualização
    const updateQuery = `
      UPDATE service_orders 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    
    updateValues.push(id)
    await query(updateQuery, updateValues)

    // Buscar ordem atualizada
    const updatedOrder = await query(`
      SELECT 
        so.*,
        e.name as equipment_name,
        c.name as company_name,
        u1.name as created_by_name,
        u2.name as assigned_to_name,
        mt.nome as maintenance_type_name
      FROM service_orders so
      LEFT JOIN equipment e ON so.equipment_id = e.id
      LEFT JOIN companies c ON so.company_id = c.id
      LEFT JOIN users u1 ON so.created_by = u1.id
      LEFT JOIN users u2 ON so.assigned_to = u2.id
      LEFT JOIN tipos_manutencao mt ON so.maintenance_type_id = mt.id
      WHERE so.id = ?
    `, [id])

    const order = updatedOrder[0]

    // Formatar datas
    const formattedOrder = {
      ...order,
      scheduled_date: order.scheduled_date ? formatDateBR(order.scheduled_date) : null,
      completion_date: order.completion_date ? formatDateBR(order.completion_date) : null,
      created_at: formatDateBR(order.created_at),
      updated_at: formatDateBR(order.updated_at)
    }

    return NextResponse.json({
      success: true,
      data: formattedOrder,
      message: 'Ordem de serviço atualizada com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao atualizar ordem de serviço:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir ordem de serviço
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    // Verificar se a ordem existe
    const existingOrder = await query('SELECT * FROM service_orders WHERE id = ?', [id])
    
    if (existingOrder.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      )
    }

    // Excluir ordem (o histórico será excluído automaticamente por CASCADE)
    await query('DELETE FROM service_orders WHERE id = ?', [id])

    return NextResponse.json({
      success: true,
      message: 'Ordem de serviço excluída com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao excluir ordem de serviço:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}