import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/database'

// POST - Testar atualização de ordem de serviço (copiando exatamente o padrão da API de setores)
export async function POST(request: NextRequest) {
  try {
    console.log('POST request recebido')
    const body = await request.json()
    console.log('Body parseado:', body)
    
    const { id, status, observations } = body
    
    if (!id) {
      console.log('Erro de validação:', { id })
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      )
    }
    
    console.log('Dados recebidos para atualizar ordem:', { id, status, observations })
    
    const updateQuery = `
      UPDATE service_orders 
      SET status = ?, observations = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    
    const result = await execute(updateQuery, [
      status,
      observations || null,
      id
    ])
    
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Ordem não encontrada' },
        { status: 404 }
      )
    }
    
    console.log('Ordem atualizada com sucesso, ID:', id)
    
    const updatedOrder = {
      id,
      status,
      observations,
      updated_at: new Date().toISOString()
    }
    
    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Ordem atualizada com sucesso'
    })
    
  } catch (error) {
    console.error('Erro ao atualizar ordem:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}