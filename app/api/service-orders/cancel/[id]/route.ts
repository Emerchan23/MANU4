import { NextRequest, NextResponse } from 'next/server'
import { query, execute } from '@/lib/database'

// POST - Cancelar ordem de serviço (usando POST para evitar problemas com PUT)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log('🔄 API /api/service-orders/cancel/[id] - Cancelando ordem:', id)
    
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
    
    const { status = 'CANCELADA', observations } = body
    
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
      message: 'Ordem de serviço cancelada com sucesso'
    })
    
  } catch (error) {
    console.error('❌ Erro ao cancelar ordem de serviço:', error)
    console.error('❌ Stack trace:', error.stack)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor ao cancelar ordem de serviço' },
      { status: 500 }
    )
  }
}