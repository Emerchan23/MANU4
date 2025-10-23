import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Configuração otimizada do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  charset: 'utf8mb4',
  acquireTimeout: 3000,
  timeout: 5000,
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
    console.log(`📊 PDF OTIMIZADO: Gerando relatório para equipamento ID: ${equipmentId}`)
    
    // Conectar ao banco com timeout reduzido
    connection = await mysql.createConnection(dbConfig)
    
    // Consulta SQL simples e otimizada - apenas dados essenciais
    const [equipmentRows] = await connection.execute(`
      SELECT 
        id,
        name,
        model,
        serial_number,
        manufacturer,
        status,
        patrimonio_number as patrimonio,
        observations
      FROM equipment 
      WHERE id = ? 
      LIMIT 1
    `, [equipmentId])

    if (!Array.isArray(equipmentRows) || equipmentRows.length === 0) {
      return NextResponse.json(
        { error: 'Equipamento não encontrado' },
        { status: 404 }
      )
    }

    const equipment = equipmentRows[0] as any

    // Buscar últimas 3 manutenções (usando service_orders como tabela correta)
    const [maintenanceRows] = await connection.execute(`
      SELECT 
        id,
        description,
        status,
        created_at
      FROM service_orders 
      WHERE equipment_id = ? 
      ORDER BY created_at DESC 
      LIMIT 3
    `, [equipmentId])

    const maintenances = Array.isArray(maintenanceRows) ? maintenanceRows : []

    // Gerar HTML simples e leve
    const htmlContent = generateSimpleHtml(equipment, maintenances)

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
    const emergencyHtml = generateEmergencyHtml(equipmentId)
    
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

function generateSimpleHtml(equipment: any, maintenances: any[]) {
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
        .maintenance-section {
            margin-top: 30px;
        }
        .maintenance-item {
            background: #fff;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 10px;
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
            <div class="info-label">Patrimônio:</div>
            <div class="info-value">${equipment.patrimonio || 'N/A'}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Status:</div>
            <div class="info-value">
                <span class="status-${equipment.status}">${getStatusText(equipment.status)}</span>
            </div>
        </div>
        <div class="info-row">
            <div class="info-label">Observações:</div>
            <div class="info-value">${equipment.observations || 'Nenhuma observação'}</div>
        </div>
    </div>

    <div class="maintenance-section">
        <h2>🔨 Histórico de Manutenções</h2>
        ${maintenances.length > 0 ? 
          maintenances.map(maintenance => `
            <div class="maintenance-item">
                <div class="info-row">
                    <div class="info-label">ID:</div>
                    <div class="info-value">${maintenance.id}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Descrição:</div>
                    <div class="info-value">${maintenance.description || 'N/A'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Status:</div>
                    <div class="info-value">${maintenance.status || 'N/A'}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Data:</div>
                    <div class="info-value">${new Date(maintenance.created_at).toLocaleString('pt-BR')}</div>
                </div>
            </div>
          `).join('') 
          : '<p>Nenhuma manutenção encontrada no histórico.</p>'
        }
    </div>

    <div class="footer">
        <p>Relatório gerado automaticamente pelo Sistema de Manutenção</p>
        <p>Data de geração: ${currentDate}</p>
    </div>
</body>
</html>
  `
}

function generateEmergencyHtml(equipmentId: number) {
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
    </style>
</head>
<body>
    <div class="emergency-header">
        <h1>🚨 Relatório de Emergência</h1>
        <p>Equipamento ID: ${equipmentId}</p>
    </div>

    <div class="alert-box">
        <h2>⚠️ Aviso Importante</h2>
        <p>Este é um relatório de emergência gerado devido a problemas técnicos temporários.</p>
        <p><strong>Equipamento ID:</strong> ${equipmentId}</p>
        <p><strong>Data/Hora:</strong> ${currentDate}</p>
        <p><strong>Status:</strong> Dados não disponíveis temporariamente</p>
        
        <h3>Próximos Passos:</h3>
        <ul>
            <li>Verifique a conectividade com o banco de dados</li>
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