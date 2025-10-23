import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import puppeteer from 'puppeteer'

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
  let browser = null

  try {
    console.log(`📊 PDF REAL: Gerando PDF com dados reais para equipamento ID: ${equipmentId}`)
    
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
    
    // Buscar últimas 5 manutenções (consulta simples e rápida)
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
      LIMIT 5
    `, [equipmentId])
    
    // Gerar HTML com dados reais
    const html = generatePDFHtml(equipment, maintenanceRows)
    
    // Usar Puppeteer para gerar PDF
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    })
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-${equipment.name.replace(/[^a-zA-Z0-9]/g, '_')}-${equipmentId}.pdf"`
      }
    })
    
  } catch (error) {
    console.error('❌ ERRO:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro ao gerar PDF',
        details: error.message,
        equipmentId: equipmentId
      },
      { status: 500 }
    )
  } finally {
    // Fechar conexão se foi criada
    if (connection) {
      try {
        await connection.end()
      } catch (closeError) {
        console.error('❌ Erro ao fechar conexão:', closeError)
      }
    }
    
    // Fechar browser se foi criado
    if (browser) {
      try {
        await browser.close()
      } catch (closeError) {
        console.error('❌ Erro ao fechar browser:', closeError)
      }
    }
  }
}

function generatePDFHtml(equipment: any, maintenances: any[]) {
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
        @page {
            margin: 20mm 15mm;
            size: A4;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            line-height: 1.4;
            color: #333;
            font-size: 12px;
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 15px;
            margin-bottom: 25px;
        }
        
        .header h1 {
            color: #2563eb;
            font-size: 24px;
            margin: 0 0 5px 0;
            font-weight: bold;
        }
        
        .header h2 {
            color: #1e40af;
            font-size: 18px;
            margin: 0 0 10px 0;
            font-weight: normal;
        }
        
        .header p {
            color: #6b7280;
            font-size: 11px;
            margin: 0;
        }
        
        .info-section {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            page-break-inside: avoid;
        }
        
        .info-section h3 {
            color: #1e40af;
            font-size: 14px;
            margin: 0 0 12px 0;
            font-weight: bold;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 5px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }
        
        .info-item {
            margin-bottom: 8px;
        }
        
        .label {
            font-weight: bold;
            color: #374151;
            display: inline-block;
            min-width: 120px;
        }
        
        .value {
            color: #1f2937;
        }
        
        .maintenance-item {
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 10px;
            border-left: 4px solid #3b82f6;
        }
        
        .maintenance-item:last-child {
            margin-bottom: 0;
        }
        
        .status-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .status-ativo {
            background: #dcfce7;
            color: #166534;
        }
        
        .status-inativo {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10px;
            color: #6b7280;
            padding: 10px;
            border-top: 1px solid #e5e7eb;
            background: white;
        }
        
        .no-data {
            text-align: center;
            color: #6b7280;
            font-style: italic;
            padding: 20px;
        }
        
        @media print {
            .info-section {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 Relatório de Equipamento</h1>
        <h2>${equipment.name}</h2>
        <p>Gerado em: ${currentDate} às ${currentTime}</p>
    </div>
    
    <div class="info-section">
        <h3>📊 Informações do Equipamento</h3>
        <div class="info-grid">
            <div class="info-item">
                <span class="label">ID:</span>
                <span class="value">${equipment.id}</span>
            </div>
            <div class="info-item">
                <span class="label">Nome:</span>
                <span class="value">${equipment.name}</span>
            </div>
            <div class="info-item">
                <span class="label">Modelo:</span>
                <span class="value">${equipment.model || 'Não informado'}</span>
            </div>
            <div class="info-item">
                <span class="label">Número de Série:</span>
                <span class="value">${equipment.serial_number || 'Não informado'}</span>
            </div>
            <div class="info-item">
                <span class="label">Fabricante:</span>
                <span class="value">${equipment.manufacturer || 'Não informado'}</span>
            </div>
            <div class="info-item">
                <span class="label">Status:</span>
                <span class="status-badge status-${equipment.status || 'ativo'}">${equipment.status || 'Não informado'}</span>
            </div>
            <div class="info-item">
                <span class="label">Setor:</span>
                <span class="value">${equipment.sector_name || 'Não informado'}</span>
            </div>
            <div class="info-item">
                <span class="label">Categoria:</span>
                <span class="value">${equipment.category_name || 'Não informado'}</span>
            </div>
            <div class="info-item">
                <span class="label">Localização:</span>
                <span class="value">${equipment.location || 'Não informado'}</span>
            </div>
            <div class="info-item">
                <span class="label">Voltagem:</span>
                <span class="value">${equipment.voltage || 'Não informado'}</span>
            </div>
        </div>
    </div>
    
    ${equipment.observations ? `
    <div class="info-section">
        <h3>📝 Observações</h3>
        <p>${equipment.observations}</p>
    </div>
    ` : ''}
    
    <div class="info-section">
        <h3>🔧 Histórico de Manutenções (Últimas 5)</h3>
        ${maintenances.length > 0 ? 
          maintenances.map(maintenance => `
            <div class="maintenance-item">
                <div class="info-item">
                    <span class="label">ID:</span>
                    <span class="value">${maintenance.id}</span>
                </div>
                <div class="info-item">
                    <span class="label">Descrição:</span>
                    <span class="value">${maintenance.description || 'Sem descrição'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Status:</span>
                    <span class="value">${maintenance.status || 'Não informado'}</span>
                </div>
                <div class="info-item">
                    <span class="label">Data de Criação:</span>
                    <span class="value">${new Date(maintenance.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                ${maintenance.scheduled_date ? `
                <div class="info-item">
                    <span class="label">Data Agendada:</span>
                    <span class="value">${new Date(maintenance.scheduled_date).toLocaleDateString('pt-BR')}</span>
                </div>
                ` : ''}
            </div>
          `).join('')
          : '<div class="no-data">Nenhuma manutenção encontrada no histórico.</div>'
        }
    </div>
    
    <div class="footer">
        <p>Sistema de Manutenção Hospitalar - Relatório gerado automaticamente</p>
        <p>© ${new Date().getFullYear()} - Todos os direitos reservados</p>
    </div>
</body>
</html>`
}