import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/database'

// POST - Atualizar ordem de serviço (seguindo padrão da API de setores que funciona)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('POST request recebido para ordem de serviço')
    const body = await request.json()
    console.log('Body parseado:', body)
    
    const { id } = params
    const { status, observations } = body
    
    if (!id) {
      console.log('Erro de validação: ID ausente')
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      )
    }
    
    console.log('Dados recebidos para atualizar ordem:', { id, status, observations })
    
    // Verificar se a ordem existe
    const existingOrder = await query('SELECT * FROM service_orders WHERE id = ?', [id])
    
    if (existingOrder.length === 0) {
      return NextResponse.json(
        { error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      )
    }
    
    const updateQuery = `
      UPDATE service_orders 
      SET status = ?, observations = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    
    const result = await execute(updateQuery, [
      status || existingOrder[0].status,
      observations || existingOrder[0].observations,
      id
    ])
    
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Ordem não encontrada ou não foi possível atualizar' },
        { status: 404 }
      )
    }
    
    console.log('Ordem atualizada com sucesso, ID:', id)
    
    // Buscar ordem atualizada
    const updatedOrder = await query('SELECT * FROM service_orders WHERE id = ?', [id])
    
    return NextResponse.json({
      success: true,
      data: updatedOrder[0],
      message: 'Ordem de serviço atualizada com sucesso'
    })
    
  } catch (error) {
    console.error('Erro ao atualizar ordem de serviço:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}