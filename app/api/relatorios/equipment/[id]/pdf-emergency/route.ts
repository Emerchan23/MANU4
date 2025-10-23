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
    console.log(`🚨 EMERGÊNCIA: Gerando relatório ultra-básico para equipamento ID: ${equipmentId}`)
    
    // Conectar ao banco de dados
    connection = await getConnection()
    console.log('✅ Conexão com banco estabelecida')
    
    // Consulta ultra-simples para obter dados básicos do equipamento
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
      LIMIT 1
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
    
    // Fechar conexão imediatamente
    await connection.end()
    console.log('🔌 Conexão com banco fechada')
    
    // Gerar HTML ultra-simples
    console.log('📄 Gerando HTML básico...')
    const html = generateEmergencyHtmlReport(equipment)
    
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="relatorio-emergencia-${equipment.id}.html"`
      }
    })
    
  } catch (error) {
    console.error('❌ Erro ao gerar relatório:', error)
    
    try {
      // Tentar fechar conexão se ainda estiver aberta
      if (connection && typeof connection.end === 'function') {
        await connection.end()
      }
    } catch (closeError) {
      console.error('❌ Erro ao fechar conexão:', closeError)
    }
    
    // Retornar HTML de erro
    const errorHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Erro no Relatório</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            padding: 40px; 
            text-align: center; 
            color: #721c24; 
            background-color: #f8d7da; 
        }
        .error-container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
            border: 1px solid #f5c6cb; 
            border-radius: 5px; 
        }
    </style>
</head>
<body>
    <div class="error-container">
        <h1>❌ Erro ao Gerar Relatório</h1>
        <p><strong>Erro:</strong> ${error.message}</p>
        <p>Tente novamente em alguns minutos ou entre em contato com o suporte técnico.</p>
        <hr>
        <p><small>Sistema de Manutenção Hospitalar</small></p>
    </div>
</body>
</html>`
    
    return new NextResponse(errorHtml, {
      status: 500,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    })
  }
}

function generateEmergencyHtmlReport(equipment) {
  const currentDate = new Date().toLocaleDateString('pt-BR')
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Equipamento - ${equipment.name}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .info-box {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
        }
        .label {
            font-weight: bold;
            color: #007bff;
        }
        .status {
            padding: 5px 10px;
            border-radius: 3px;
            color: white;
            font-weight: bold;
        }
        .status.ativo { background-color: #28a745; }
        .status.inativo { background-color: #dc3545; }
        .status.manutencao { background-color: #ffc107; color: #000; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Relatório de Equipamento</h1>
        <h2>${equipment.name}</h2>
        <p>Gerado em: ${currentDate}</p>
    </div>
    
    <div class="info-box">
        <p><span class="label">ID:</span> ${equipment.id}</p>
        <p><span class="label">Código:</span> ${equipment.code || 'N/A'}</p>
        <p><span class="label">Modelo:</span> ${equipment.model || 'N/A'}</p>
        <p><span class="label">Fabricante:</span> ${equipment.manufacturer || 'N/A'}</p>
        <p><span class="label">Localização:</span> ${equipment.location || 'N/A'}</p>
        <p><span class="label">Status:</span> 
            <span class="status ${equipment.status?.toLowerCase() || 'inativo'}">
                ${equipment.status || 'Desconhecido'}
            </span>
        </p>
    </div>
    
    <div class="info-box">
        <h3>Observações</h3>
        <p>Este é um relatório de emergência com informações básicas.</p>
        <p>Para relatório completo, aguarde a resolução dos problemas técnicos.</p>
    </div>
    
    <div style="text-align: center; margin-top: 40px; font-size: 12px; color: #666;">
        <p>Sistema de Manutenção Hospitalar - Relatório Emergencial</p>
    </div>
</body>
</html>`
}