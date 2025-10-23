import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Configuração do banco de dados
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'sistema_manutencao',
  connectTimeout: 5000,
  acquireTimeout: 5000,
  timeout: 5000,
  charset: 'utf8mb4'
}

// Função para obter texto do status
function getStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    'active': 'Ativo',
    'inactive': 'Inativo',
    'maintenance': 'Em Manutencao',
    'repair': 'Em Reparo',
    'out_of_service': 'Fora de Servico'
  }
  return statusMap[status] || status || 'N/A'
}

// Função para gerar HTML que será convertido em PDF pelo navegador
function generateHTMLReport(equipment: any, maintenances: any[]): string {
  const equipmentName = (equipment.name || 'N/A').replace(/[<>&"']/g, ' ')
  const equipmentModel = (equipment.model || 'N/A').replace(/[<>&"']/g, ' ')
  const equipmentSerial = (equipment.serial_number || 'N/A').replace(/[<>&"']/g, ' ')
  const equipmentManufacturer = (equipment.manufacturer || 'N/A').replace(/[<>&"']/g, ' ')

  let maintenanceHTML = ''
  if (maintenances.length > 0) {
    maintenances.forEach((maintenance: any, index: number) => {
      const description = (maintenance.description || 'Sem descricao').replace(/[<>&"']/g, ' ')
      const status = (maintenance.status || 'N/A').replace(/[<>&"']/g, ' ')
      const date = new Date(maintenance.created_at).toLocaleDateString('pt-BR')
      
      maintenanceHTML += `
        <div class="maintenance-item">
          <h4>${index + 1}. Manutenção ID: ${maintenance.id}</h4>
          <p><strong>Descrição:</strong> ${description}</p>
          <p><strong>Status:</strong> ${status}</p>
          <p><strong>Data:</strong> ${date}</p>
        </div>
      `
    })
  } else {
    maintenanceHTML = '<p>Nenhuma manutenção encontrada no histórico.</p>'
  }

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Equipamento ${equipment.id}</title>
    <style>
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
        
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 20px;
            color: #333;
        }
        
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #2c3e50;
            margin: 0;
            font-size: 24px;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section h2 {
            color: #34495e;
            border-bottom: 1px solid #bdc3c7;
            padding-bottom: 5px;
            font-size: 18px;
        }
        
        .equipment-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #3498db;
        }
        
        .equipment-info p {
            margin: 8px 0;
        }
        
        .maintenance-item {
            background-color: #fff;
            border: 1px solid #e9ecef;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 15px;
        }
        
        .maintenance-item h4 {
            color: #2980b9;
            margin: 0 0 10px 0;
        }
        
        .maintenance-item p {
            margin: 5px 0;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #bdc3c7;
            font-size: 12px;
            color: #7f8c8d;
            text-align: center;
        }
        
        .download-btn {
            background-color: #3498db;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 20px 0;
        }
        
        .download-btn:hover {
            background-color: #2980b9;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>RELATÓRIO DE EQUIPAMENTO</h1>
        <p>Sistema de Manutenção</p>
    </div>

    <div class="section">
        <h2>Dados do Equipamento</h2>
        <div class="equipment-info">
            <p><strong>ID:</strong> ${equipment.id}</p>
            <p><strong>Nome:</strong> ${equipmentName}</p>
            <p><strong>Modelo:</strong> ${equipmentModel}</p>
            <p><strong>Número de Série:</strong> ${equipmentSerial}</p>
            <p><strong>Fabricante:</strong> ${equipmentManufacturer}</p>
            <p><strong>Status:</strong> ${getStatusText(equipment.status)}</p>
        </div>
    </div>

    <div class="section">
        <h2>Histórico de Manutenções</h2>
        ${maintenanceHTML}
    </div>

    <div class="section no-print">
        <button class="download-btn" onclick="window.print()">Imprimir / Salvar como PDF</button>
        <p><em>Use Ctrl+P ou clique no botão acima para salvar como PDF</em></p>
    </div>

    <div class="footer">
        <p>Relatório gerado em: ${new Date().toLocaleString('pt-BR')}</p>
        <p>Sistema de Manutenção - Versão 1.0</p>
    </div>

    <script>
        // Auto-print quando acessado via API
        if (window.location.pathname.includes('/api/')) {
            setTimeout(() => {
                window.print();
            }, 1000);
        }
    </script>
</body>
</html>
  `
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection: mysql.Connection | null = null

  try {
    const equipmentId = parseInt(params.id)
    
    if (isNaN(equipmentId)) {
      return NextResponse.json({ error: 'ID do equipamento invalido' }, { status: 400 })
    }

    console.log(`📊 PDF HTML: Gerando relatorio para equipamento ID: ${equipmentId}`)

    // Conectar ao banco de dados
    connection = await mysql.createConnection(dbConfig)

    // Buscar dados básicos do equipamento
    const [equipmentRows] = await connection.execute(
      'SELECT id, name, model, serial_number, manufacturer, status FROM equipment WHERE id = ? LIMIT 1',
      [equipmentId]
    )

    const equipment = Array.isArray(equipmentRows) && equipmentRows.length > 0 
      ? equipmentRows[0] as any 
      : null

    if (!equipment) {
      return NextResponse.json({ error: 'Equipamento nao encontrado' }, { status: 404 })
    }

    // Buscar últimas 3 manutenções
    const [maintenanceRows] = await connection.execute(
      'SELECT id, description, status, created_at FROM service_orders WHERE equipment_id = ? ORDER BY created_at DESC LIMIT 3',
      [equipmentId]
    )

    const maintenances = Array.isArray(maintenanceRows) ? maintenanceRows : []

    // Gerar HTML do relatório
    const htmlContent = generateHTMLReport(equipment, maintenances)

    console.log(`✅ HTML Report gerado: ${htmlContent.length} caracteres`)

    // Retornar HTML que pode ser convertido em PDF pelo navegador
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    })

  } catch (error) {
    console.error('❌ Erro ao gerar relatorio HTML:', error)
    
    return NextResponse.json({ 
      error: 'Erro ao gerar relatorio HTML',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      equipmentId: parseInt(params.id)
    }, { status: 500 })

  } finally {
    if (connection) {
      try {
        await connection.end()
      } catch (e) {
        console.error('Erro ao fechar conexao:', e)
      }
    }
  }
}