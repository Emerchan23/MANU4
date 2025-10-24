import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  port: parseInt(process.env.DB_PORT || '3306'),
  charset: 'utf8mb4',
  timezone: '+00:00',
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 10000,
}

// Função para obter texto do status
function getStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    'active': 'Ativo',
    'inactive': 'Inativo',
    'maintenance': 'Em Manutenção',
    'repair': 'Em Reparo',
    'out_of_service': 'Fora de Serviço'
  }
  return statusMap[status] || status || 'N/A'
}

export async function POST(request: NextRequest) {
  let connection: mysql.Connection | null = null

  try {
    const body = await request.json()
    const { equipmentId, startDate, endDate } = body

    if (!equipmentId) {
      return NextResponse.json({ error: 'ID do equipamento é obrigatório' }, { status: 400 })
    }

    console.log(`📊 Gerando PDF para equipamento ID: ${equipmentId}`)

    // Conectar ao banco de dados
    connection = await mysql.createConnection(dbConfig)

    // Buscar dados completos do equipamento incluindo setor e categoria
    const [equipmentRows] = await connection.execute(
      `SELECT 
        e.id, 
        e.name, 
        e.model, 
        e.serial_number, 
        e.manufacturer, 
        e.status,
        e.patrimony,
        e.patrimonio_number,
        e.voltage,
        e.power,
        e.acquisition_date,
        e.warranty_expiry,
        e.maintenance_frequency_days,
        e.observations,
        s.name as sector_name,
        c.name as category_name
      FROM equipment e
      LEFT JOIN sectors s ON e.sector_id = s.id
      LEFT JOIN categories c ON e.category_id = c.id
      WHERE e.id = ? LIMIT 1`,
      [equipmentId]
    )

    const equipment = Array.isArray(equipmentRows) && equipmentRows.length > 0 
      ? equipmentRows[0] as any 
      : null

    if (!equipment) {
      return NextResponse.json({ error: 'Equipamento não encontrado' }, { status: 404 })
    }

    // Buscar histórico COMPLETO de manutenções com dados da empresa
    let maintenanceQuery = `
      SELECT 
        so.id,
        so.order_number,
        so.description,
        so.status,
        so.type,
        so.priority,
        so.cost,
        so.scheduled_date,
        so.completion_date,
        so.created_at,
        so.observations,
        c.name as company_name,
        c.cnpj as company_cnpj
      FROM service_orders so
      LEFT JOIN companies c ON so.company_id = c.id
      WHERE so.equipment_id = ?`
    let queryParams: any[] = [equipmentId]

    // Adicionar filtros de data se fornecidos
    if (startDate && endDate) {
      maintenanceQuery += ' AND so.created_at BETWEEN ? AND ?'
      queryParams.push(startDate, endDate)
    }

    // REMOVER LIMITE - mostrar TODOS os serviços
    maintenanceQuery += ' ORDER BY so.created_at DESC'

    const [maintenanceRows] = await connection.execute(maintenanceQuery, queryParams)
    const maintenances = Array.isArray(maintenanceRows) ? maintenanceRows : []

    // Usar jsPDF para gerar PDF
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()

    // Configurar PDF
    doc.setFont('helvetica')
    
    // Título
    doc.setFontSize(20)
    doc.text('Relatório de Equipamento', 20, 30)
    
    // Informações COMPLETAS do equipamento
    doc.setFontSize(14)
    doc.text('Dados do Equipamento:', 20, 50)
    
    doc.setFontSize(12)
    let yPos = 65
    
    doc.text(`ID: ${equipment.id}`, 20, yPos)
    yPos += 8
    doc.text(`Nome: ${equipment.name || 'N/A'}`, 20, yPos)
    yPos += 8
    doc.text(`Patrimônio: ${equipment.patrimony || equipment.patrimonio_number || 'N/A'}`, 20, yPos)
    yPos += 8
    doc.text(`Modelo: ${equipment.model || 'N/A'}`, 20, yPos)
    yPos += 8
    doc.text(`Número de Série: ${equipment.serial_number || 'N/A'}`, 20, yPos)
    yPos += 8
    doc.text(`Fabricante: ${equipment.manufacturer || 'N/A'}`, 20, yPos)
    yPos += 8
    doc.text(`Status: ${getStatusText(equipment.status)}`, 20, yPos)
    yPos += 8
    doc.text(`Setor: ${equipment.sector_name || 'N/A'}`, 20, yPos)
    yPos += 8
    doc.text(`Categoria: ${equipment.category_name || 'N/A'}`, 20, yPos)
    yPos += 8
    doc.text(`Voltagem: ${equipment.voltage || 'N/A'}`, 20, yPos)
    yPos += 8
    doc.text(`Potência: ${equipment.power || 'N/A'}`, 20, yPos)
    yPos += 8
    
    if (equipment.acquisition_date) {
      doc.text(`Data de Aquisição: ${new Date(equipment.acquisition_date).toLocaleDateString('pt-BR')}`, 20, yPos)
      yPos += 8
    }
    
    if (equipment.warranty_expiry) {
      doc.text(`Garantia até: ${new Date(equipment.warranty_expiry).toLocaleDateString('pt-BR')}`, 20, yPos)
      yPos += 8
    }
    
    if (equipment.maintenance_frequency_days) {
      doc.text(`Frequência de Manutenção: ${equipment.maintenance_frequency_days} dias`, 20, yPos)
      yPos += 8
    }
    
    if (equipment.observations) {
      doc.text(`Observações: ${equipment.observations}`, 20, yPos)
      yPos += 8
    }
    yPos += 20
    
    // Histórico COMPLETO de manutenções
    doc.setFontSize(14)
    doc.text(`Histórico Completo de Manutenções (${maintenances.length} registros):`, 20, yPos)
    yPos += 15
    
    doc.setFontSize(10)
    if (maintenances.length > 0) {
      maintenances.forEach((maintenance: any, index: number) => {
        // Verificar se precisa de nova página
        if (yPos > 240) {
          doc.addPage()
          yPos = 30
          doc.setFontSize(14)
          doc.text('Histórico de Manutenções (continuação):', 20, yPos)
          yPos += 15
          doc.setFontSize(10)
        }
        
        // Cabeçalho do serviço
        doc.setFont('helvetica', 'bold')
        doc.text(`${index + 1}. OS #${maintenance.order_number || maintenance.id}`, 20, yPos)
        yPos += 6
        
        doc.setFont('helvetica', 'normal')
        doc.text(`Descrição: ${maintenance.description || 'N/A'}`, 25, yPos)
        yPos += 6
        
        doc.text(`Tipo: ${maintenance.type || 'N/A'} | Prioridade: ${maintenance.priority || 'N/A'}`, 25, yPos)
        yPos += 6
        
        doc.text(`Status: ${maintenance.status || 'N/A'}`, 25, yPos)
        yPos += 6
        
        if (maintenance.company_name) {
          doc.text(`Empresa: ${maintenance.company_name}${maintenance.company_cnpj ? ` (${maintenance.company_cnpj})` : ''}`, 25, yPos)
          yPos += 6
        }
        
        // Custos
        if (maintenance.cost) {
          doc.text(`Custo: R$ ${parseFloat(maintenance.cost).toFixed(2)}`, 25, yPos)
          yPos += 6
        }
        
        // Datas
        let dateText = `Criado: ${new Date(maintenance.created_at).toLocaleDateString('pt-BR')}`
        if (maintenance.scheduled_date) {
          dateText += ` | Agendado: ${new Date(maintenance.scheduled_date).toLocaleDateString('pt-BR')}`
        }
        if (maintenance.completion_date) {
          dateText += ` | Concluído: ${new Date(maintenance.completion_date).toLocaleDateString('pt-BR')}`
        }
        doc.text(dateText, 25, yPos)
        yPos += 6
        
        if (maintenance.observations) {
          doc.text(`Observações: ${maintenance.observations}`, 25, yPos)
          yPos += 6
        }
        
        yPos += 4 // Espaço entre registros
      })
      
      // Calcular valor total das manutenções
      const totalCost = maintenances.reduce((sum: number, maintenance: any) => {
        const cost = parseFloat(maintenance.cost) || 0
        return sum + cost
      }, 0)
      
      // Adicionar seção de valor total
      yPos += 10
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text(`VALOR TOTAL DE TODAS AS MANUTENÇÕES: R$ ${totalCost.toFixed(2)}`, 20, yPos)
      
    } else {
      doc.text('Nenhuma manutenção encontrada no histórico.', 20, yPos)
      yPos += 10
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('VALOR TOTAL DE TODAS AS MANUTENÇÕES: R$ 0,00', 20, yPos)
    }
    
    // Rodapé
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(`Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 280)
      doc.text(`Página ${i} de ${pageCount}`, 150, 280)
    }
    
    // Gerar PDF como buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    console.log(`✅ PDF gerado com sucesso: ${pdfBuffer.length} bytes`)

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
    
    // Implementar fallback - gerar PDF de emergência
    try {
      console.log('🚨 Gerando PDF de emergência...')
      
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      
      doc.setFont('helvetica')
      doc.setFontSize(20)
      doc.text('Relatório de Equipamento (Modo Emergência)', 20, 30)
      
      doc.setFontSize(12)
      let yPos = 50
      
      const body = await request.json().catch(() => ({}))
      const { equipmentId } = body
      
      doc.text(`ID do Equipamento: ${equipmentId || 'N/A'}`, 20, yPos)
      yPos += 15
      
      doc.text('⚠️ AVISO: Erro ao conectar com o banco de dados', 20, yPos)
      yPos += 10
      doc.text('Este relatório foi gerado em modo de emergência.', 20, yPos)
      yPos += 10
      doc.text('Dados detalhados não estão disponíveis no momento.', 20, yPos)
      yPos += 20
      
      doc.text('Detalhes do erro:', 20, yPos)
      yPos += 10
      doc.setFontSize(10)
      doc.text(error instanceof Error ? error.message : 'Erro desconhecido', 20, yPos)
      
      doc.setFontSize(8)
      doc.text(`Relatório de emergência gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 280)
      
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
      
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="relatorio-emergencia-${equipmentId || 'unknown'}.pdf"`,
          'Cache-Control': 'no-cache'
        }
      })
      
    } catch (fallbackError) {
      console.error('❌ Erro no fallback:', fallbackError)
      return NextResponse.json(
        { 
          error: 'Erro ao gerar PDF',
          details: error instanceof Error ? error.message : 'Erro desconhecido',
          fallbackError: fallbackError instanceof Error ? fallbackError.message : 'Erro no fallback'
        },
        { status: 500 }
      )
    }
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