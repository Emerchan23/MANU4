import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Configuração do banco de dados MariaDB
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

// Função para formatar moeda
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// Função para formatar data
function formatDate(dateString: string): string {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('pt-BR')
}

// Função para obter texto do status
function getStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    'pending': 'Pendente',
    'in_progress': 'Em Andamento',
    'completed': 'Concluído',
    'cancelled': 'Cancelado',
    'on_hold': 'Em Espera'
  }
  return statusMap[status] || status || 'N/A'
}

// Função para obter texto do tipo de manutenção
function getMaintenanceTypeText(type: string): string {
  const typeMap: { [key: string]: string } = {
    'preventive': 'Preventiva',
    'corrective': 'Corretiva',
    'emergency': 'Emergencial',
    'calibration': 'Calibração',
    'inspection': 'Inspeção'
  }
  return typeMap[type] || type || 'N/A'
}

export async function POST(request: NextRequest) {
  let connection: mysql.Connection | null = null

  try {
    console.log('🔍 Iniciando geração de PDF da empresa...')
    
    // Obter dados do corpo da requisição
    const body = await request.json()
    const { companyId, startDate, endDate } = body
    
    if (!companyId) {
      return NextResponse.json({ error: 'ID da empresa é obrigatório' }, { status: 400 })
    }

    console.log('📊 Parâmetros recebidos:', { companyId, startDate, endDate })

    // Conectar ao banco de dados
    console.log('🔗 Conectando ao banco de dados...')
    connection = await mysql.createConnection(dbConfig)
    console.log('✅ Conexão com banco estabelecida')

    // Buscar dados da empresa
    console.log('🔍 Buscando dados da empresa ID:', companyId)
    const [companyRows] = await connection.execute(`
      SELECT 
        id,
        name,
        cnpj,
        contact_person,
        phone,
        email,
        address,
        created_at,
        is_active
      FROM companies 
      WHERE id = ? LIMIT 1
    `, [companyId])

    const company = Array.isArray(companyRows) && companyRows.length > 0 
      ? companyRows[0] as any 
      : null

    if (!company) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    console.log('✅ Empresa encontrada:', company.name)

    // Construir query para ordens de serviço com filtros de data
    let serviceOrdersQuery = `
      SELECT 
        so.id,
        so.order_number,
        so.description,
        so.status,
        so.type,
        so.cost,
        so.actual_cost,
        so.estimated_cost,
        so.created_at,
        so.scheduled_date,
        so.completion_date,
        so.observations,
        e.name as equipment_name,
        e.model as equipment_model,
        e.serial_number as equipment_serial,
        e.patrimonio as equipment_patrimonio,
        s.name as sector_name,
        ss.name as subsector_name,
        u.name as created_by_name
      FROM service_orders so
      LEFT JOIN equipment e ON so.equipment_id = e.id
      LEFT JOIN sectors s ON e.sector_id = s.id
      LEFT JOIN subsectors ss ON e.subsector_id = ss.id
      LEFT JOIN users u ON so.created_by = u.id
      WHERE so.company_id = ?
    `
    
    const queryParams: any[] = [companyId]
    
    if (startDate) {
      serviceOrdersQuery += ` AND DATE(so.created_at) >= ?`
      queryParams.push(startDate)
    }
    
    if (endDate) {
      serviceOrdersQuery += ` AND DATE(so.created_at) <= ?`
      queryParams.push(endDate)
    }
    
    serviceOrdersQuery += ` ORDER BY so.created_at DESC`

    console.log('🔍 Executando query de ordens de serviço...')
    const [serviceOrdersRows] = await connection.execute(serviceOrdersQuery, queryParams)
    const serviceOrders = Array.isArray(serviceOrdersRows) ? serviceOrdersRows : []

    console.log('📋 Ordens de serviço encontradas:', serviceOrders.length)

    // Calcular estatísticas
    const totalServices = serviceOrders.length
    const totalCost = serviceOrders.reduce((sum: number, order: any) => {
      // Usar actual_cost se disponível, senão cost, senão estimated_cost
      const cost = parseFloat(order.actual_cost) || parseFloat(order.cost) || parseFloat(order.estimated_cost) || 0
      return sum + cost
    }, 0)
    const averageCost = totalServices > 0 ? totalCost / totalServices : 0

    console.log('💰 Estatísticas calculadas:', { totalServices, totalCost, averageCost })

    // Agrupar por status
    const statusStats = serviceOrders.reduce((acc: any, order: any) => {
      const status = order.status || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    // Agrupar por tipo de manutenção
    const typeStats = serviceOrders.reduce((acc: any, order: any) => {
      const type = order.type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    // Usar jsPDF para gerar PDF
    console.log('📄 Importando jsPDF...')
    const { jsPDF } = await import('jspdf')
    console.log('✅ jsPDF importado com sucesso')
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      floatPrecision: 16
    })

    // Definir margens
    const margins = {
      left: 20,
      right: 20,
      top: 25,
      bottom: 25
    }
    
    const pageWidth = 210
    const pageHeight = 297
    const contentWidth = pageWidth - margins.left - margins.right
    const contentRight = pageWidth - margins.right
    const maxY = pageHeight - margins.bottom - 15

    let currentY = margins.top + 25
    let pageNumber = 1

    // Função para adicionar cabeçalho
    const addHeader = () => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(16)
      doc.text('RELATÓRIO DE EMPRESA PRESTADORA DE SERVIÇOS', pageWidth / 2, margins.top + 8, { align: 'center' })
      
      doc.setLineWidth(0.5)
      doc.line(margins.left, margins.top + 12, contentRight, margins.top + 12)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
    }

    // Função para adicionar rodapé
    const addFooter = () => {
      const footerY = pageHeight - margins.bottom + 5
      doc.setLineWidth(0.3)
      doc.line(margins.left, footerY, contentRight, footerY)
      
      doc.setFontSize(8)
      doc.text(`Página ${pageNumber}`, pageWidth / 2, footerY + 6, { align: 'center' })
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margins.left, footerY + 6)
      doc.text('Sistema de Manutenção v1.0', contentRight, footerY + 6, { align: 'right' })
    }

    // Função para verificar quebra de página
    const checkPageBreak = (requiredSpace: number) => {
      if (currentY + requiredSpace > maxY) {
        addFooter()
        doc.addPage()
        pageNumber++
        addHeader()
        currentY = margins.top + 25
        return true
      }
      return false
    }

    // Adicionar cabeçalho da primeira página
    addHeader()
    
    // Seção de dados da empresa
    checkPageBreak(20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('DADOS DA EMPRESA PRESTADORA:', margins.left, currentY)
    currentY += 8
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    
    doc.text(`Nome: ${company.name || 'N/A'}`, margins.left, currentY)
    currentY += 5
    doc.text(`CNPJ: ${company.cnpj || 'N/A'}`, margins.left, currentY)
    currentY += 5
    doc.text(`Pessoa de Contato: ${company.contact_person || 'N/A'}`, margins.left, currentY)
    currentY += 5
    doc.text(`Telefone: ${company.phone || 'N/A'}`, margins.left, currentY)
    currentY += 5
    doc.text(`E-mail: ${company.email || 'N/A'}`, margins.left, currentY)
    currentY += 5
    doc.text(`Endereço: ${company.address || 'N/A'}`, margins.left, currentY)
    currentY += 5
    doc.text(`Data de Cadastro: ${formatDate(company.created_at)}`, margins.left, currentY)
    currentY += 5
    doc.text(`Status: ${company.is_active ? 'Ativa' : 'Inativa'}`, margins.left, currentY)
    currentY += 10

    // Seção de resumo financeiro
    checkPageBreak(20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('RESUMO FINANCEIRO:', margins.left, currentY)
    currentY += 8
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    
    if (startDate || endDate) {
      const periodText = `Período: ${startDate ? formatDate(startDate) : 'Início'} até ${endDate ? formatDate(endDate) : 'Hoje'}`
      doc.text(periodText, margins.left, currentY)
      currentY += 8
    }
    
    doc.text(`Total de Serviços Realizados: ${totalServices}`, margins.left, currentY)
    currentY += 5
    doc.text(`Valor Total Faturado: ${formatCurrency(totalCost)}`, margins.left, currentY)
    currentY += 5
    doc.text(`Valor Médio por Serviço: ${formatCurrency(averageCost)}`, margins.left, currentY)
    currentY += 10

    // Seção de estatísticas por status
    if (Object.keys(statusStats).length > 0) {
      checkPageBreak(15)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('DISTRIBUIÇÃO POR STATUS:', margins.left, currentY)
      currentY += 8
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      
      Object.entries(statusStats).forEach(([status, count]) => {
        doc.text(`${getStatusText(status)}: ${count} serviços`, margins.left, currentY)
        currentY += 5
      })
      
      currentY += 5
    }

    // Seção de estatísticas por tipo
    if (Object.keys(typeStats).length > 0) {
      checkPageBreak(15)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('DISTRIBUIÇÃO POR TIPO DE MANUTENÇÃO:', margins.left, currentY)
      currentY += 8
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      
      Object.entries(typeStats).forEach(([type, count]) => {
        doc.text(`${getMaintenanceTypeText(type)}: ${count} serviços`, margins.left, currentY)
        currentY += 5
      })
      
      currentY += 5
    }

    // Seção de valor total destacado
    checkPageBreak(15)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('VALOR TOTAL DE TODAS AS MANUTENÇÕES:', margins.left, currentY)
    currentY += 8
    doc.setFontSize(16)
    doc.text(formatCurrency(totalCost), margins.left, currentY)
    currentY += 15

    // Seção de ordens de serviço detalhadas
    if (serviceOrders.length > 0) {
      checkPageBreak(20)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('DETALHAMENTO DAS ORDENS DE SERVIÇO:', margins.left, currentY)
      currentY += 8
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      
      serviceOrders.forEach((order: any, index: number) => {
        checkPageBreak(30)
        
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.text(`${index + 1}. OS #${order.order_number || order.id}`, margins.left, currentY)
        currentY += 6
        
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        
        doc.text(`Equipamento: ${order.equipment_name || 'N/A'} (${order.equipment_model || 'N/A'})`, margins.left + 5, currentY)
        currentY += 4
        doc.text(`Patrimônio: ${order.equipment_patrimonio || 'N/A'}`, margins.left + 5, currentY)
        currentY += 4
        doc.text(`Setor: ${order.sector_name || 'N/A'}${order.subsector_name ? ` / ${order.subsector_name}` : ''}`, margins.left + 5, currentY)
        currentY += 4
        doc.text(`Tipo: ${getMaintenanceTypeText(order.type)}`, margins.left + 5, currentY)
        currentY += 4
        doc.text(`Status: ${getStatusText(order.status)}`, margins.left + 5, currentY)
        currentY += 4
        
        doc.setFont('helvetica', 'bold')
        const orderValue = parseFloat(order.actual_cost) || parseFloat(order.cost) || parseFloat(order.estimated_cost) || 0
        doc.text(`Valor: ${formatCurrency(orderValue)}`, margins.left + 5, currentY)
        doc.setFont('helvetica', 'normal')
        currentY += 4
        
        doc.text(`Data de Criação: ${formatDate(order.created_at)}`, margins.left + 5, currentY)
        currentY += 4
        doc.text(`Data Agendada: ${formatDate(order.scheduled_date)}`, margins.left + 5, currentY)
        currentY += 4
        doc.text(`Data de Conclusão: ${formatDate(order.completion_date)}`, margins.left + 5, currentY)
        currentY += 4
        doc.text(`Criado por: ${order.created_by_name || 'N/A'}`, margins.left + 5, currentY)
        currentY += 4
        
        if (order.description) {
          const descLines = doc.splitTextToSize(`Descrição: ${order.description}`, contentWidth - 10)
          if (Array.isArray(descLines)) {
            descLines.forEach((line: string, lineIndex: number) => {
              doc.text(line, margins.left + 5, currentY + (lineIndex * 4))
            })
            currentY += descLines.length * 4
          } else {
            doc.text(descLines, margins.left + 5, currentY)
            currentY += 4
          }
        }
        
        if (order.observations) {
          const obsLines = doc.splitTextToSize(`Observações: ${order.observations}`, contentWidth - 10)
          if (Array.isArray(obsLines)) {
            obsLines.forEach((line: string, lineIndex: number) => {
              doc.text(line, margins.left + 5, currentY + (lineIndex * 4))
            })
            currentY += obsLines.length * 4
          } else {
            doc.text(obsLines, margins.left + 5, currentY)
            currentY += 4
          }
        }
        
        currentY += 6
      })
    } else {
      checkPageBreak(15)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('ORDENS DE SERVIÇO:', margins.left, currentY)
      currentY += 8
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text('Nenhuma ordem de serviço encontrada para o período selecionado.', margins.left, currentY)
      currentY += 10
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('VALOR TOTAL DE TODAS AS MANUTENÇÕES:', margins.left, currentY)
      currentY += 8
      doc.setFontSize(16)
      doc.text('R$ 0,00', margins.left, currentY)
    }

    // Adicionar rodapé da última página
    addFooter()

    console.log('✅ PDF gerado com sucesso')

    // Gerar o PDF como buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Retornar o PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-empresa-${company.name.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache'
      },
    })

  } catch (error) {
    console.error('❌ Erro ao gerar PDF da empresa:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')
    
    // Gerar PDF de emergência em caso de erro
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      
      doc.setFontSize(16)
      doc.text('🚨 Relatório de Emergência - Empresa', 20, 30)
      
      doc.setFontSize(12)
      doc.text('Erro ao conectar com o banco de dados.', 20, 50)
      doc.text('Tente novamente em alguns minutos.', 20, 70)
      doc.text(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 20, 90)
      
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
      
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="relatorio-emergencia-empresa.pdf"`,
          'Cache-Control': 'no-cache'
        }
      })
    } catch (pdfError) {
      return NextResponse.json({ 
        error: 'Erro ao gerar relatório PDF',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }, { status: 500 })
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