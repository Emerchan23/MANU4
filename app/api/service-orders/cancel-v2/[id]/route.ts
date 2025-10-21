import { NextRequest, NextResponse } from 'next/server'
import { execute } from '@/lib/database'

// POST - Cancelar ordem de serviço (abordagem alternativa sem await request.json())
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 POST request recebido para cancelar ordem de serviço')
    
    const { id } = params
    
    if (!id) {
      console.log('❌ Erro de validação: ID ausente')
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      )
    }
    
    console.log('📋 ID da ordem a ser cancelada:', id)
    
    // Abordagem alternativa: usar ReadableStream para ler o body
    let bodyData = {}
    
    try {
      const reader = request.body?.getReader()
      if (reader) {
        const chunks = []
        let done = false
        
        while (!done) {
          const { value, done: readerDone } = await reader.read()
          done = readerDone
          if (value) {
            chunks.push(value)
          }
        }
        
        if (chunks.length > 0) {
          const bodyText = new TextDecoder().decode(
            new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []))
          )
          
          if (bodyText.trim()) {
            bodyData = JSON.parse(bodyText)
            console.log('✅ Body parseado via ReadableStream:', bodyData)
          }
        }
      }
    } catch (parseError) {
      console.log('⚠️ Erro ao parsear body, usando valores padrão:', parseError)
      // Continuar com valores padrão
    }
    
    const status = bodyData.status || 'CANCELADA'
    const observations = bodyData.observations || 'Cancelada via API'
    
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