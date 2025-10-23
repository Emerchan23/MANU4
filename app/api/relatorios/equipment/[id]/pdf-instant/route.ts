import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  charset: 'utf8mb4',
  timezone: '+00:00',
  acquireTimeout: 5000,
  timeout: 8000,
  reconnect: true
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
    console.log(`📊 REAL: Gerando relatório com dados reais para equipamento ID: ${equipmentId}`)
    
    // Conectar ao banco com timeout otimizado
    connection = await mysql.createConnection(dbConfig)
    
    // Buscar dados do equipamento com consulta otimizada
    const [equipmentRows] = await connection.execute(`
      SELECT 
        e.id,
        e.name,
        e.model,
        e.serial_number,
        e.manufacturer,
        e.status,
        e.location,
        e.voltage,
        e.observations,
        s.name as sector_name,
        c.name as category_name
      FROM equipment e
      LEFT JOIN sectors s ON e.sector_id = s.id
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.id = ?
      LIMIT 1
    `, [equipmentId])

    if (equipmentRows.length === 0) {
      throw new Error(`Equipamento com ID ${equipmentId} não encontrado`)
    }

    const equipment = equipmentRows[0]
    
    // Buscar últimas 3 manutenções (consulta simples e rápida)
    const [maintenanceRows] = await connection.execute(`
      SELECT 
        id,
        description,
        status,
        created_at,
        scheduled_date
      FROM maintenance_schedules
      WHERE equipment_id = ?
      ORDER BY created_at DESC
      LIMIT 3
    `, [equipmentId])
    
    // Gerar HTML com dados reais
    const html = generateRealHtmlReport(equipment, maintenanceRows)
    
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="relatorio-${equipment.name.replace(/[^a-zA-Z0-9]/g, '_')}-${equipmentId}.html"`
      }
    })
    
  } catch (error) {
    console.error('❌ ERRO:', error)
    
    // HTML de erro com informações úteis
    const errorHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Erro no Relatório</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      .error { color: red; background: #ffe6e6; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Erro ao Gerar Relatório</h1>
    <div class="error">
      <strong>Erro:</strong> ${error.message}<br>
      <strong>Equipamento ID:</strong> ${equipmentId}<br>
      <strong>Timestamp:</strong> ${new Date().toLocaleString('pt-BR')}
    </div>
</body>
</html>`
    
    return new NextResponse(errorHtml, {
      status: 500,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    })
  } finally {
    // Fechar conexão se foi criada
    if (connection) {
      try {
        await connection.end()
      } catch (closeError) {
        console.error('❌ Erro ao fechar conexão:', closeError)
      }
    }
  }
}

function generateRealHtmlReport(equipment: any, maintenances: any[]) {
  const currentDate = new Date().toLocaleDateString('pt-BR')
  const currentTime = new Date().toLocaleTimeString('pt-BR')
  
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
            border-bottom: 2px solid #28a745;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .info-box {
            background: #e8f5e8;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            border-left: 4px solid #28a745;
        }
        .label {
            font-weight: bold;
            color: #28a745;
        }
        .alert {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 Relatório de Equipamento</h1>
        <h2>${equipment.name}</h2>
        <p>Gerado em: ${currentDate} às ${currentTime}</p>
    </div>
    
    <div class="info-box">
        <h3>📊 Informações do Equipamento</h3>
        <p><span class="label">ID:</span> ${equipment.id}</p>
        <p><span class="label">Nome:</span> ${equipment.name}</p>
        <p><span class="label">Modelo:</span> ${equipment.model || 'Não informado'}</p>
        <p><span class="label">Número de Série:</span> ${equipment.serial_number || 'Não informado'}</p>
        <p><span class="label">Fabricante:</span> ${equipment.manufacturer || 'Não informado'}</p>
        <p><span class="label">Status:</span> ${equipment.status || 'Não informado'}</p>
        <p><span class="label">Setor:</span> ${equipment.sector_name || 'Não informado'}</p>
        <p><span class="label">Categoria:</span> ${equipment.category_name || 'Não informado'}</p>
        <p><span class="label">Localização:</span> ${equipment.location || 'Não informado'}</p>
        <p><span class="label">Voltagem:</span> ${equipment.voltage || 'Não informado'}</p>
    </div>
    
    ${equipment.observations ? `
    <div class="info-box">
        <h3>📝 Observações</h3>
        <p>${equipment.observations}</p>
    </div>
    ` : ''}
    
    <div class="info-box">
        <h3>🔧 Histórico de Manutenções (Últimas 3)</h3>
        ${maintenances.length > 0 ? 
          maintenances.map(maintenance => `
            <div style="border-left: 3px solid #007bff; padding-left: 10px; margin: 10px 0;">
              <p><span class="label">ID:</span> ${maintenance.id}</p>
              <p><span class="label">Descrição:</span> ${maintenance.description || 'Sem descrição'}</p>
              <p><span class="label">Status:</span> ${maintenance.status || 'Não informado'}</p>
              <p><span class="label">Data de Criação:</span> ${new Date(maintenance.created_at).toLocaleDateString('pt-BR')}</p>
              ${maintenance.scheduled_date ? `<p><span class="label">Data Agendada:</span> ${new Date(maintenance.scheduled_date).toLocaleDateString('pt-BR')}</p>` : ''}
            </div>
          `).join('')
          : '<p>Nenhuma manutenção encontrada no histórico.</p>'
        }
    </div>
    </div>
    
    <div style="text-align: center; margin-top: 40px; font-size: 12px; color: #666;">
        <p>Sistema de Manutenção Hospitalar - Relatório Instantâneo</p>
        <p>Gerado automaticamente em modo de emergência</p>
    </div>
</body>
</html>`
}