import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/database'

// POST - Cancelar ordem de serviço (sem usar request body - apenas query params)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 POST request recebido para cancelar ordem de serviço v3')
    
    const { id } = params
    const { searchParams } = new URL(request.url)
    
    if (!id) {
      console.log('❌ Erro de validação: ID ausente')
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      )
    }
    
    // Obter dados dos query parameters em vez do body
    const status = searchParams.get('status') || 'CANCELADA'
    const observations = searchParams.get('observations') || 'Cancelada via API v3'
    
    console.log('📝 Dados para atualização:', { id, status, observations })
    
    // Atualizar ordem de serviço
    const updateQuery = `
      UPDATE service_orders 
      SET status = ?, observations = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    
    const result = await execute(updateQuery, [status, observations, id])
    
    console.log('✅ Resultado da atualização:', result)
    
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'Ordem não encontrada ou não foi possível atualizar' },
        { status: 404 }
      )
    }
    
    console.log('✅ Ordem cancelada com sucesso, ID:', id)
    
    return NextResponse.json({
      success: true,
      message: 'Ordem de serviço cancelada com sucesso',
      data: {
        id,
        status,
        observations,
        updated_at: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('❌ Erro ao cancelar ordem de serviço:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}