import { NextRequest, NextResponse } from 'next/server'
import { getConnection } from '@/lib/database.js'

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

  let connection;
  
  try {
    console.log(`🔍 Gerando relatório mínimo para equipamento ID: ${equipmentId}`)
    
    // Conectar ao banco de dados
    connection = await getConnection()
    console.log('✅ Conexão com banco estabelecida')

    // Consulta mínima apenas do equipamento
    const equipmentQuery = `
      SELECT 
        e.id,
        e.name,
        e.code,
        e.model,
        e.manufacturer,
        e.status,
        e.location
      FROM equipment e
      WHERE e.id = ?
    `
    
    console.log('📋 Executando consulta do equipamento...')
    const [equipmentRows] = await connection.execute(equipmentQuery, [equipmentId])
    
    if (!equipmentRows || equipmentRows.length === 0) {
      console.log('❌ Equipamento não encontrado')
      await connection.end()
      return NextResponse.json(
        { error: 'Equipamento não encontrado' },
        { status: 404 }
      )
    }
    
    const equipment = equipmentRows[0]
    console.log('✅ Dados do equipamento obtidos:', equipment.name)
    
    // Fechar conexão
    await connection.end()
    console.log('🔌 Conexão com banco fechada')
    
    // Gerar relatório HTML mínimo
    console.log('📄 Gerando HTML do relatório mínimo...')
    return generateMinimalHtmlReport(equipment)
    
  } catch (error) {
    console.error('❌ Erro ao gerar relatório:', error)
    
    try {
      if (connection && typeof connection.end === 'function') {
        await connection.end()
      }
    } catch (closeError) {
      console.error('❌ Erro ao fechar conexão:', closeError)
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor ao gerar relatório' },
      { status: 500 }
    )
  }
}

function generateMinimalHtmlReport(equipment) {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório - ${equipment.name}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #007bff;
            margin: 0;
            font-size: 24px;
        }
        .info-item {
            margin-bottom: 15px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 4px;
        }
        .info-label {
            font-weight: bold;
            color: #555;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .info-value {
            font-size: 16px;
            color: #333;
        }
        .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            background: #e8f5e8;
            color: #2e7d32;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Relatório de Equipamento</h1>
            <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
        </div>
        
        <div class="info-item">
            <div class="info-label">Nome</div>
            <div class="info-value">${equipment.name || 'N/A'}</div>
        </div>
        
        <div class="info-item">
            <div class="info-label">Código</div>
            <div class="info-value">${equipment.code || 'N/A'}</div>
        </div>
        
        <div class="info-item">
            <div class="info-label">Modelo</div>
            <div class="info-value">${equipment.model || 'N/A'}</div>
        </div>
        
        <div class="info-item">
            <div class="info-label">Fabricante</div>
            <div class="info-value">${equipment.manufacturer || 'N/A'}</div>
        </div>
        
        <div class="info-item">
            <div class="info-label">Status</div>
            <div class="info-value">
                <span class="status-badge">${equipment.status || 'N/A'}</span>
            </div>
        </div>
        
        <div class="info-item">
            <div class="info-label">Localização</div>
            <div class="info-value">${equipment.location || 'N/A'}</div>
        </div>
        
        <div class="footer">
            <p>Relatório mínimo gerado pelo Sistema de Manutenção</p>
        </div>
    </div>
</body>
</html>
  `
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}