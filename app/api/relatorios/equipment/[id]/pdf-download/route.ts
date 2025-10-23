import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Configuração otimizada do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
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
  let browser = null

  try {
    console.log(`📊 PDF DOWNLOAD: Gerando PDF para equipamento ID: ${equipmentId}`)
    
    // Conectar ao banco
    connection = await mysql.createConnection(dbConfig)
    
    // Consulta SQL simples e otimizada
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
      throw new Error('Equipamento não encontrado')
    }

    const equipment = equipmentRows[0] as any

    // Buscar últimas 3 manutenções (usando service_orders como tabela principal)
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

    // Usar jsPDF para gerar PDF
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()

    // Configurar PDF
    doc.setFont('helvetica')
    
    // Título
    doc.setFontSize(20)
    doc.text('Relatório de Equipamento', 20, 30)
    
    // Informações do equipamento
    doc.setFontSize(12)
    let yPos = 50
    
    doc.text(`ID: ${equipment.id}`, 20, yPos)
    yPos += 10
    doc.text(`Nome: ${equipment.name || 'N/A'}`, 20, yPos)
    yPos += 10
    doc.text(`Modelo: ${equipment.model || 'N/A'}`, 20, yPos)
    yPos += 10
    doc.text(`Número de Série: ${equipment.serial_number || 'N/A'}`, 20, yPos)
    yPos += 10
    doc.text(`Fabricante: ${equipment.manufacturer || 'N/A'}`, 20, yPos)
    yPos += 10
    doc.text(`Status: ${getStatusText(equipment.status)}`, 20, yPos)
    yPos += 20
    
    // Histórico de manutenções
    doc.setFontSize(14)
    doc.text('Histórico de Manutenções:', 20, yPos)
    yPos += 15
    
    doc.setFontSize(10)
    if (maintenances.length > 0) {
      maintenances.forEach((maintenance, index) => {
        doc.text(`${index + 1}. ID: ${maintenance.id} - ${maintenance.description || 'N/A'}`, 20, yPos)
        yPos += 8
        doc.text(`   Status: ${maintenance.status || 'N/A'} - Data: ${new Date(maintenance.created_at).toLocaleDateString('pt-BR')}`, 20, yPos)
        yPos += 12
      })
    } else {
      doc.text('Nenhuma manutenção encontrada no histórico.', 20, yPos)
    }
    
    // Rodapé
    yPos = 280
    doc.setFontSize(8)
    doc.text(`Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, yPos)
    
    // Gerar PDF como buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Retornar PDF para download
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-equipamento-${equipmentId}.pdf"`,
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error)
    
    // Implementar fallback robusto - gerar PDF de emergência sem dados de manutenção
    try {
      console.log('🚨 Gerando PDF de emergência sem dados de manutenção...')
      
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      
      // Configurar PDF de emergência
      doc.setFont('helvetica')
      
      // Título
      doc.setFontSize(20)
      doc.text('Relatório de Equipamento (Modo Emergência)', 20, 30)
      
      // Informações básicas
      doc.setFontSize(12)
      let yPos = 50
      
      doc.text(`ID do Equipamento: ${equipmentId}`, 20, yPos)
      yPos += 15
      
      doc.text('⚠️ AVISO: Erro ao conectar com o banco de dados', 20, yPos)
      yPos += 10
      doc.text('Este relatório foi gerado em modo de emergência.', 20, yPos)
      yPos += 10
      doc.text('Dados de manutenção não estão disponíveis no momento.', 20, yPos)
      yPos += 20
      
      doc.text('Detalhes do erro:', 20, yPos)
      yPos += 10
      doc.setFontSize(10)
      doc.text(error.message || 'Erro desconhecido', 20, yPos)
      
      // Rodapé
      yPos = 280
      doc.setFontSize(8)
      doc.text(`Relatório de emergência gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, yPos)
      
      // Gerar PDF como buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

      // Retornar PDF de emergência
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="relatorio-emergencia-equipamento-${equipmentId}.pdf"`,
          'Cache-Control': 'no-cache'
        }
      })
      
    } catch (fallbackError) {
      console.error('❌ Erro no fallback:', fallbackError)
      
      return NextResponse.json(
        { 
          error: 'Erro crítico ao gerar PDF',
          originalError: error.message,
          fallbackError: fallbackError.message,
          equipmentId: equipmentId
        },
        { status: 500 }
      )
    }
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

function generatePDFHtml(equipment: any, maintenances: any[]) {
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
            margin: 0;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #007bff;
            margin: 0;
            font-size: 28px;
        }
        .success-box {
            background: #d4edda;
            border: 2px solid #c3e6cb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
            text-align: center;
        }
        .info-section {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 25px;
        }
        .info-section h2 {
            color: #495057;
            margin-top: 0;
            border-bottom: 2px solid #dee2e6;
            padding-bottom: 10px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 15px;
        }
        .info-item {
            display: flex;
            flex-direction: column;
        }
        .info-label {
            font-weight: bold;
            color: #495057;
            margin-bottom: 5px;
        }
        .info-value {
            background: white;
            padding: 8px 12px;
            border: 1px solid #dee2e6;
            border-radius: 4px;
        }
        .status-active { 
            color: #28a745; 
            font-weight: bold;
        }
        .status-inactive { 
            color: #dc3545; 
            font-weight: bold;
        }
        .status-maintenance { 
            color: #ffc107; 
            font-weight: bold;
        }
        .maintenance-item {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 15px;
        }
        .maintenance-header {
            font-weight: bold;
            color: #007bff;
            margin-bottom: 10px;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
            border-top: 2px solid #dee2e6;
            padding-top: 20px;
        }
        .no-maintenance {
            text-align: center;
            color: #6c757d;
            font-style: italic;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 Relatório de Equipamento</h1>
        <p style="font-size: 18px; margin: 10px 0;"><strong>${equipment.name}</strong></p>
        <p style="margin: 5px 0;">Gerado em: ${currentDate}</p>
    </div>

    <div class="success-box">
        <h2 style="color: #155724; margin: 0;">✅ Relatório Gerado com Sucesso!</h2>
        <p style="margin: 10px 0 0 0;">Dados recuperados em tempo real do banco de dados</p>
    </div>

    <div class="info-section">
        <h2>🔧 Informações do Equipamento</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">ID do Equipamento:</div>
                <div class="info-value">${equipment.id}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Nome:</div>
                <div class="info-value">${equipment.name || 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Modelo:</div>
                <div class="info-value">${equipment.model || 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Número de Série:</div>
                <div class="info-value">${equipment.serial_number || 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Fabricante:</div>
                <div class="info-value">${equipment.manufacturer || 'N/A'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Status:</div>
                <div class="info-value">
                    <span class="status-${equipment.status}">${getStatusText(equipment.status)}</span>
                </div>
            </div>
        </div>
        
        ${equipment.patrimonio ? `
        <div style="margin-top: 15px;">
            <div class="info-label">Patrimônio:</div>
            <div class="info-value">${equipment.patrimonio}</div>
        </div>
        ` : ''}
        
        ${equipment.observations ? `
        <div style="margin-top: 15px;">
            <div class="info-label">Observações:</div>
            <div class="info-value">${equipment.observations}</div>
        </div>
        ` : ''}
    </div>

    <div class="info-section">
        <h2>🔨 Histórico de Manutenções (Últimas 3)</h2>
        ${maintenances.length > 0 ? 
          maintenances.map(maintenance => `
            <div class="maintenance-item">
                <div class="maintenance-header">Manutenção #${maintenance.id}</div>
                <div style="margin-bottom: 8px;"><strong>Descrição:</strong> ${maintenance.description || 'N/A'}</div>
                <div style="margin-bottom: 8px;"><strong>Status:</strong> ${maintenance.status || 'N/A'}</div>
                <div><strong>Data:</strong> ${new Date(maintenance.created_at).toLocaleString('pt-BR')}</div>
            </div>
          `).join('') 
          : '<div class="no-maintenance">Nenhuma manutenção encontrada no histórico.</div>'
        }
    </div>

    <div class="info-section">
        <h2>📊 Status da Geração</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Banco de Dados:</div>
                <div class="info-value" style="color: #28a745;">✅ Conectado</div>
            </div>
            <div class="info-item">
                <div class="info-label">Consulta SQL:</div>
                <div class="info-value" style="color: #28a745;">✅ Executada</div>
            </div>
            <div class="info-item">
                <div class="info-label">Dados Recuperados:</div>
                <div class="info-value" style="color: #28a745;">✅ Sim</div>
            </div>
            <div class="info-item">
                <div class="info-label">PDF Gerado:</div>
                <div class="info-value" style="color: #28a745;">✅ Sucesso</div>
            </div>
        </div>
    </div>

    <div class="footer">
        <p><strong>✅ Relatório gerado com dados REAIS do banco de dados</strong></p>
        <p>Sistema de Manutenção Hospitalar</p>
        <p>Data de geração: ${currentDate}</p>
        <p>Equipamento ID: ${equipment.id} | Nome: ${equipment.name}</p>
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
    case 'ativo': return 'Ativo'
    case 'inativo': return 'Inativo'
    case 'manutencao': return 'Em Manutenção'
    default: return status || 'Desconhecido'
  }
}