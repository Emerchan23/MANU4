import { NextRequest, NextResponse } from 'next/server'
import { getConnection } from '@/lib/database'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const equipmentId = parseInt(params.id)

  if (isNaN(equipmentId)) {
    return NextResponse.json(
      { error: 'ID do equipamento inválido' },
      { status: 400 }
    )
  }

  let connection
  try {
    console.log(`🔍 Testando endpoint para equipamento ID: ${equipmentId}`)
    
    connection = await getConnection()
    console.log('✅ Conexão com banco estabelecida')
    
    // Buscar apenas dados básicos do equipamento
    const [equipmentRows] = await connection.execute(`
      SELECT 
        e.id, e.name, e.serial_number, e.code, e.model, 
        e.manufacturer, e.status
      FROM equipment e
      WHERE e.id = ?
    `, [equipmentId])

    console.log(`📊 Consulta executada, ${equipmentRows?.length || 0} resultados`)

    if (!equipmentRows || equipmentRows.length === 0) {
      return NextResponse.json(
        { error: 'Equipamento não encontrado' },
        { status: 404 }
      )
    }

    const equipment = equipmentRows[0]
    console.log('✅ Equipamento encontrado:', equipment.name)

    return NextResponse.json({
      success: true,
      message: 'Endpoint funcionando corretamente',
      equipment: {
        id: equipment.id,
        name: equipment.name,
        serial_number: equipment.serial_number,
        code: equipment.code,
        model: equipment.model,
        manufacturer: equipment.manufacturer,
        status: equipment.status
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erro no endpoint de teste:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error.message 
      },
      { status: 500 }
    )
  } finally {
    // Garantir que a conexão seja fechada
    if (connection) {
      try {
        await connection.end()
        console.log('🔓 Conexão fechada')
      } catch (err) {
        console.log('⚠️ Erro ao fechar conexão:', err)
      }
    }
  }
}