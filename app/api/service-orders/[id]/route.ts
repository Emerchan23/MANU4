import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/database'

// Utility functions for date formatting
function formatDateBR(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR')
}

function formatDateISO(dateString) {
  if (!dateString) return null
  const date = new Date(dateString)
  return date.toISOString().split('T')[0]
}

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

// PUT - Atualizar ordem de serviço (usando request body)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 PUT request recebido para ordem de serviço')
    
    const { id } = params
    
    if (!id) {
      console.log('❌ Erro de validação: ID ausente')
      return NextResponse.json(
        { success: false, error: 'ID é obrigatório' },
        { status: 400 }
      )
    }
    
    // Verificar se a ordem existe primeiro
    const existingOrder = await query('SELECT * FROM service_orders WHERE id = ?', [id])
    
    if (existingOrder.length === 0) {
      console.log('❌ Ordem de serviço não encontrada:', id)
      return NextResponse.json(
        { success: false, error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      )
    }
    
    console.log('✅ Ordem encontrada:', existingOrder[0])
    
    // Ler o body da requisição
    const body = await request.json()
    console.log('📊 Body recebido:', body)
    
    const { status, observations } = body
    
    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status é obrigatório' },
        { status: 400 }
      )
    }
    
    console.log('📝 Dados para atualização:', { id, status, observations })
    
    // Executar atualização usando execute() - mesmo padrão das APIs que funcionam
    const updateQuery = `
      UPDATE service_orders 
      SET status = ?, observations = ?, updated_at = NOW()
      WHERE id = ?
    `
    
    console.log('📊 Query de atualização:', updateQuery)
    console.log('📊 Parâmetros:', [status, observations || null, id])
    
    const result = await execute(updateQuery, [status, observations || null, id])
    console.log('✅ Resultado da atualização:', result)
    
    if (result.affectedRows === 0) {
      console.log('❌ Nenhuma linha foi afetada')
      return NextResponse.json(
        { success: false, error: 'Nenhuma alteração foi feita' },
        { status: 400 }
      )
    }
    
    // Buscar ordem atualizada
    const updatedOrder = await query('SELECT * FROM service_orders WHERE id = ?', [id])
    console.log('✅ Ordem atualizada:', updatedOrder[0])
    
    return NextResponse.json({
      success: true,
      data: updatedOrder[0],
      message: 'Ordem de serviço atualizada com sucesso'
    })
    
  } catch (error) {
    console.error('❌ Erro ao atualizar ordem de serviço:', error)
    console.error('❌ Stack trace:', error.stack)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor ao atualizar ordem de serviço' },
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

    // Verificar se a ordem pode ser excluída (não está concluída)
    const order = existingOrder[0]
    if (order.status === 'CONCLUIDA') {
      return NextResponse.json(
        { success: false, error: 'Não é possível excluir uma ordem de serviço concluída' },
        { status: 400 }
      )
    }

    // Excluir histórico relacionado primeiro
    await query('DELETE FROM maintenance_history WHERE service_order_id = ?', [id])

    // Excluir a ordem
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