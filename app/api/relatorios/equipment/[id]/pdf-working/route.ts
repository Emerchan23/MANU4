import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Configuração ultra-otimizada do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  acquireTimeout: 2000,
  timeout: 3000,
  reconnect: false
}

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

  let connection = null

  try {
    console.log(`📊 PDF WORKING: Gerando relatório para equipamento ID: ${equipmentId}`)
    
    // Conectar ao banco com timeout ultra-reduzido
    connection = await mysql.createConnection(dbConfig)
    
    // Consulta SQL ultra-simples - apenas dados básicos
    const [equipmentRows] = await connection.execute(`
      SELECT id, name, model, serial_number, manufacturer, status
      FROM equipment 
      WHERE id = ? 
      LIMIT 1
    `, [equipmentId])

    if (!Array.isArray(equipmentRows) || equipmentRows.length === 0) {
      throw new Error('Equipamento não encontrado')
    }

    const equipment = equipmentRows[0] as any

    // Gerar HTML ultra-simples
    const htmlContent = generateWorkingHtml(equipment)

    // Retornar HTML diretamente para download
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="relatorio-equipamento-${equipmentId}.html"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('❌ Erro ao gerar relatório:', error)
    
    // Retornar relatório de emergência em caso de erro
    const emergencyHtml = generateEmergencyHtml(equipmentId, error.message)
    
    return new NextResponse(emergencyHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="relatorio-emergencia-${equipmentId}.html"`,
        'Cache-Control': 'no-cache'
      }
    })
  } finally {
    if (connection) {
      try {
        await connection.end()
      } catch (e) {
        console.error('Erro ao fechar conexão:', e)
      }
    }
  }
}

function generateWorkingHtml(equipment: any) {
  const currentDate = new Date().toLocaleString('pt-BR')
  
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
        .success-box {
            background: #d4edda;
            border: 1px solid #c3e6cb;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .info-box {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 20px;
        }
        .info-row {
            display: flex;
            margin-bottom: 10px;
        }
        .info-label {
            font-weight: bold;
            width: 150px;
            color: #495057;
        }
        .info-value {
            flex: 1;
        }
        .status-active { color: #28a745; }
        .status-inactive { color: #dc3545; }
        .status-maintenance { color: #ffc107; }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
            border-top: 1px solid #dee2e6;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 Relatório de Equipamento</h1>
        <p><strong>Equipamento:</strong> ${equipment.name}</p>
        <p><strong>Gerado em:</strong> ${currentDate}</p>
    </div>

    <div class="success-box">
        <h2>✅ Relatório Gerado com Sucesso!</h2>
        <p>Os dados do equipamento foram recuperados com sucesso do banco de dados.</p>
    </div>

    <div class="info-box">
        <h2>🔧 Informações do Equipamento</h2>
        <div class="info-row">
            <div class="info-label">ID:</div>
            <div class="info-value">${equipment.id}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Nome:</div>
            <div class="info-value">${equipment.name || 'N/A'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Modelo:</div>
            <div class="info-value">${equipment.model || 'N/A'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Número de Série:</div>
            <div class="info-value">${equipment.serial_number || 'N/A'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Fabricante:</div>
            <div class="info-value">${equipment.manufacturer || 'N/A'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Status:</div>
            <div class="info-value">
                <span class="status-${equipment.status}">${getStatusText(equipment.status)}</span>
            </div>
        </div>
    </div>

    <div class="info-box">
        <h2>📊 Status da Conexão</h2>
        <div class="info-row">
            <div class="info-label">Banco de Dados:</div>
            <div class="info-value" style="color: #28a745;">✅ Conectado</div>
        </div>
        <div class="info-row">
            <div class="info-label">Consulta SQL:</div>
            <div class="info-value" style="color: #28a745;">✅ Executada com sucesso</div>
        </div>
        <div class="info-row">
            <div class="info-label">Dados Recuperados:</div>
            <div class="info-value" style="color: #28a745;">✅ Sim</div>
        </div>
    </div>

    <div class="footer">
        <p>✅ Relatório gerado com dados REAIS do banco de dados</p>
        <p>Sistema de Manutenção - Data de geração: ${currentDate}</p>
    </div>
</body>
</html>
  `
}

function generateEmergencyHtml(equipmentId: number, errorMessage: string) {
  const currentDate = new Date().toLocaleString('pt-BR')
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Emergência - Equipamento ${equipmentId}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.6;
            color: #333;
        }
        .emergency-header {
            background: #dc3545;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px;
            margin-bottom: 30px;
        }
        .alert-box {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .error-box {
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 5px;
            padding: 20px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="emergency-header">
        <h1>🚨 Relatório de Emergência</h1>
        <p>Equipamento ID: ${equipmentId}</p>
    </div>

    <div class="alert-box">
        <h2>⚠️ Aviso Importante</h2>
        <p>Este é um relatório de emergência gerado devido a problemas técnicos.</p>
        <p><strong>Equipamento ID:</strong> ${equipmentId}</p>
        <p><strong>Data/Hora:</strong> ${currentDate}</p>
        <p><strong>Status:</strong> Erro na consulta ao banco de dados</p>
    </div>

    <div class="error-box">
        <h2>❌ Detalhes do Erro</h2>
        <p><strong>Mensagem:</strong> ${errorMessage}</p>
        
        <h3>Próximos Passos:</h3>
        <ul>
            <li>Verifique se o banco de dados está funcionando</li>
            <li>Confirme se o equipamento ID ${equipmentId} existe</li>
            <li>Tente novamente em alguns minutos</li>
            <li>Entre em contato com o suporte técnico se o problema persistir</li>
        </ul>
    </div>
</body>
</html>
  `
}

function getStatusText(status: string): string {
  switch (status) {
    case 'active': return 'Ativo'
    case 'inactive': return 'Inativo'
    case 'maintenance': return 'Em Manutenção'
    default: return status || 'Desconhecido'
  }
}