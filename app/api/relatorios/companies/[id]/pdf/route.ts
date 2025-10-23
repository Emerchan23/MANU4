import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Configuração do banco de dados MariaDB
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance',
  connectTimeout: 5000,
  acquireTimeout: 5000,
  timeout: 5000,
  charset: 'utf8mb4'
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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection: mysql.Connection | null = null

  try {
    console.log('🔍 Iniciando geração de PDF da empresa, ID:', params.id)
    const companyId = parseInt(params.id)
    
    if (isNaN(companyId)) {
      return NextResponse.json({ error: 'ID da empresa inválido' }, { status: 400 })
    }

    // Obter filtros de data do corpo da requisição
    const body = await request.json().catch(() => ({}))
    const { startDate, endDate } = body

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
        created_at
      FROM companies 
      WHERE id = ? LIMIT 1
    `, [companyId])
    console.log('📊 Dados da empresa encontrados:', companyRows.length > 0 ? 'Sim' : 'Não')

    const company = Array.isArray(companyRows) && companyRows.length > 0 
      ? companyRows[0] as any 
      : null

    if (!company) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
    }

    // Construir query para ordens de serviço com filtros de data
    let serviceOrdersQuery = `
      SELECT 
        so.id,
        so.order_number,
        so.description,
        so.status,
        so.actual_cost as cost,
        so.created_at,
        so.completion_date,
        e.name as equipment_name,
        e.model as equipment_model,
        s.name as sector_name,
        u.name as created_by_name
      FROM service_orders so
      LEFT JOIN equipment e ON so.equipment_id = e.id
      LEFT JOIN sectors s ON e.sector_id = s.id
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

    // Buscar ordens de serviço
    const [serviceOrdersRows] = await connection.execute(serviceOrdersQuery, queryParams)
    const serviceOrders = Array.isArray(serviceOrdersRows) ? serviceOrdersRows : []

    // Calcular estatísticas
    const totalServices = serviceOrders.length
    const totalCost = serviceOrders.reduce((sum: number, order: any) => {
      const cost = parseFloat(order.cost) || 0
      return sum + cost
    }, 0)
    const averageCost = totalServices > 0 ? totalCost / totalServices : 0

    // Agrupar por status
    const statusStats = serviceOrders.reduce((acc: any, order: any) => {
      const status = order.status || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    // Agrupar por mês para estatísticas mensais
    const monthlyStats = serviceOrders.reduce((acc: any, order: any) => {
      const date = new Date(order.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!acc[monthKey]) {
        acc[monthKey] = { count: 0, total: 0 }
      }
      
      acc[monthKey].count += 1
      acc[monthKey].total += parseFloat(order.cost) || 0
      
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
      left: 25,
      right: 25,
      top: 30,
      bottom: 30
    }
    
    const pageWidth = 210
    const pageHeight = 297
    const contentWidth = pageWidth - margins.left - margins.right
    const contentRight = pageWidth - margins.right
    const maxY = pageHeight - margins.bottom - 20

    let currentY = margins.top + 30
    let pageNumber = 1

    // Função para adicionar cabeçalho
    const addHeader = () => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.text('RELATÓRIO DE EMPRESA PRESTADORA', pageWidth / 2, margins.top + 10, { align: 'center' })
      
      doc.setLineWidth(0.5)
      doc.line(margins.left, margins.top + 15, contentRight, margins.top + 15)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
    }

    // Função para adicionar rodapé
    const addFooter = () => {
      const footerY = pageHeight - margins.bottom + 5
      doc.setLineWidth(0.3)
      doc.line(margins.left, footerY, contentRight, footerY)
      
      doc.setFontSize(8)
      doc.text(`Página ${pageNumber}`, pageWidth / 2, footerY + 8, { align: 'center' })
      doc.text(`Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`, margins.left, footerY + 8)
      doc.text('Sistema de Manutenção - Versão 1.0', contentRight, footerY + 8, { align: 'right' })
    }

    // Função para verificar quebra de página
    const checkPageBreak = (requiredSpace: number) => {
      if (currentY + requiredSpace > maxY) {
        addFooter()
        doc.addPage()
        pageNumber++
        addHeader()
        currentY = margins.top + 30
        return true
      }
      return false
    }

    // Função para adicionar texto com quebra automática
    const addTextWithWrap = (label: string, value: string): number => {
      const fullText = `${label}: ${value}`
      const textLines = doc.splitTextToSize(fullText, contentWidth)
      
      const requiredSpace = Array.isArray(textLines) ? textLines.length * 6 : 6
      checkPageBreak(requiredSpace)
      
      if (Array.isArray(textLines)) {
        textLines.forEach((line: string, index: number) => {
          doc.text(line, margins.left, currentY + (index * 6))
        })
        currentY += textLines.length * 6
      } else {
        doc.text(textLines, margins.left, currentY)
        currentY += 6
      }
      
      return currentY
    }

    // Adicionar cabeçalho da primeira página
    addHeader()
    
    // Seção de dados da empresa
    checkPageBreak(15)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('DADOS DA EMPRESA:', margins.left, currentY)
    currentY += 10
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    addTextWithWrap('Nome', company.name || 'N/A')
    addTextWithWrap('CNPJ', company.cnpj || 'N/A')
    addTextWithWrap('Pessoa de Contato', company.contact_person || 'N/A')
    addTextWithWrap('Telefone', company.phone || 'N/A')
    addTextWithWrap('E-mail', company.email || 'N/A')
    addTextWithWrap('Endereço', company.address || 'N/A')
    addTextWithWrap('Data de Cadastro', formatDate(company.created_at))
    
    currentY += 10

    // Seção de resumo financeiro
    checkPageBreak(25)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('RESUMO FINANCEIRO:', margins.left, currentY)
    currentY += 10
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    if (startDate || endDate) {
      const periodText = `Período: ${startDate ? formatDate(startDate) : 'Início'} até ${endDate ? formatDate(endDate) : 'Hoje'}`
      addTextWithWrap('', periodText)
      currentY += 5
    }
    
    addTextWithWrap('Total de Serviços', totalServices.toString())
    addTextWithWrap('Valor Total', formatCurrency(totalCost))
    addTextWithWrap('Valor Médio por Serviço', formatCurrency(averageCost))
    
    currentY += 10

    // Seção de estatísticas por status
    if (Object.keys(statusStats).length > 0) {
      checkPageBreak(20)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('DISTRIBUIÇÃO POR STATUS:', margins.left, currentY)
      currentY += 10
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      
      Object.entries(statusStats).forEach(([status, count]) => {
        addTextWithWrap(getStatusText(status), `${count} serviços`)
      })
      
      currentY += 10
    }

    // Seção de estatísticas mensais
    if (Object.keys(monthlyStats).length > 0) {
      checkPageBreak(20)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('ESTATÍSTICAS MENSAIS:', margins.left, currentY)
      currentY += 10
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      
      const sortedMonths = Object.keys(monthlyStats).sort()
      sortedMonths.forEach(month => {
        const stats = monthlyStats[month]
        const [year, monthNum] = month.split('-')
        const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('pt-BR', { 
          year: 'numeric', 
          month: 'long' 
        })
        
        addTextWithWrap(monthName, `${stats.count} serviços - ${formatCurrency(stats.total)}`)
      })
      
      currentY += 10
    }

    // Seção de ordens de serviço
    if (serviceOrders.length > 0) {
      checkPageBreak(20)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('ORDENS DE SERVIÇO:', margins.left, currentY)
      currentY += 10
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      
      serviceOrders.forEach((order: any, index: number) => {
        checkPageBreak(25)
        
        doc.setFont('helvetica', 'bold')
        doc.text(`${index + 1}. OS #${order.order_number || order.id}`, margins.left, currentY)
        currentY += 6
        
        doc.setFont('helvetica', 'normal')
        
        const orderInfo = [
          `Equipamento: ${order.equipment_name || 'N/A'} (${order.equipment_model || 'N/A'})`,
          `Setor: ${order.sector_name || 'N/A'}`,
          `Status: ${getStatusText(order.status)}`,
          `Custo: ${formatCurrency(parseFloat(order.cost) || 0)}`,
          `Data de Criação: ${formatDate(order.created_at)}`,
          `Data de Conclusão: ${formatDate(order.completion_date)}`,
          `Criado por: ${order.created_by_name || 'N/A'}`
        ]
        
        orderInfo.forEach(info => {
          const lines = doc.splitTextToSize(info, contentWidth - 10)
          if (Array.isArray(lines)) {
            lines.forEach((line: string, lineIndex: number) => {
              doc.text(line, margins.left + 5, currentY + (lineIndex * 5))
            })
            currentY += lines.length * 5
          } else {
            doc.text(lines, margins.left + 5, currentY)
            currentY += 5
          }
        })
        
        if (order.description) {
          const descLines = doc.splitTextToSize(`Descrição: ${order.description}`, contentWidth - 10)
          if (Array.isArray(descLines)) {
            descLines.forEach((line: string, lineIndex: number) => {
              doc.text(line, margins.left + 5, currentY + (lineIndex * 5))
            })
            currentY += descLines.length * 5
          } else {
            doc.text(descLines, margins.left + 5, currentY)
            currentY += 5
          }
        }
        
        currentY += 8
      })
    } else {
      checkPageBreak(15)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('ORDENS DE SERVIÇO:', margins.left, currentY)
      currentY += 10
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text('Nenhuma ordem de serviço encontrada para o período selecionado.', margins.left, currentY)
    }

    // Adicionar rodapé da última página
    addFooter()

    // Gerar o PDF como buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Retornar o PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-empresa-${company.name.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('❌ Erro ao gerar PDF da empresa:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')
    return NextResponse.json(
      { error: 'Erro interno do servidor ao gerar PDF', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}