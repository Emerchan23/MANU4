import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Configuração otimizada do banco de dados
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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let connection: mysql.Connection | null = null

  try {
    const equipmentId = parseInt(params.id)
    
    if (isNaN(equipmentId)) {
      return NextResponse.json({ error: 'ID do equipamento inválido' }, { status: 400 })
    }

    // Conectar ao banco de dados
    connection = await mysql.createConnection(dbConfig)

    // Buscar dados completos do equipamento com setor e subsetor
    const [equipmentRows] = await connection.execute(`
      SELECT 
        e.id, 
        e.name, 
        e.model, 
        e.serial_number, 
        e.manufacturer, 
        e.status,
        e.voltage,
        e.patrimonio_number,
        s.name as sector_name,
        sub.name as subsector_name
      FROM equipment e
      LEFT JOIN sectors s ON e.sector_id = s.id
      LEFT JOIN subsectors sub ON e.subsector_id = sub.id
      WHERE e.id = ? LIMIT 1
    `, [equipmentId])

    const equipment = Array.isArray(equipmentRows) && equipmentRows.length > 0 
      ? equipmentRows[0] as any 
      : null

    if (!equipment) {
      return NextResponse.json({ error: 'Equipamento não encontrado' }, { status: 404 })
    }

    // Buscar todas as manutenções com números de OS e valores
    const [maintenanceRows] = await connection.execute(`
      SELECT 
        so.id,
        so.order_number,
        so.description,
        so.status,
        so.cost,
        so.created_at,
        so.completion_date
      FROM service_orders so
      WHERE so.equipment_id = ? 
      ORDER BY so.created_at DESC
    `, [equipmentId])

    const maintenances = Array.isArray(maintenanceRows) ? maintenanceRows : []

    // Calcular valor total das manutenções
    const totalCost = maintenances.reduce((sum: number, maintenance: any) => {
      const cost = parseFloat(maintenance.cost) || 0
      return sum + cost
    }, 0)

    // Usar jsPDF para gerar PDF com configurações melhoradas
    const { jsPDF } = await import('jspdf')
    
    // Configurar PDF com opções mais robustas
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
      floatPrecision: 16
    })

    // Definir margens profissionais A4
    const margins = {
      left: 25,    // 25mm margem esquerda
      right: 25,   // 25mm margem direita  
      top: 30,     // 30mm margem superior
      bottom: 30   // 30mm margem inferior
    }
    
    // Calcular área útil do conteúdo
    const pageWidth = 210  // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const contentWidth = pageWidth - margins.left - margins.right  // 160mm
    const contentRight = pageWidth - margins.right  // 185mm
    const maxY = pageHeight - margins.bottom - 20 // Margem inferior segura

    // Controle de paginação
    let currentY = margins.top + 30
    let pageNumber = 1

    // Função para adicionar cabeçalho
    const addHeader = () => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.text('RELATORIO DE EQUIPAMENTO', pageWidth / 2, margins.top + 10, { align: 'center' })
      
      // Linha separadora
      doc.setLineWidth(0.5)
      doc.line(margins.left, margins.top + 15, contentRight, margins.top + 15)
      
      // Reset para fonte normal
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
    }

    // Função para adicionar rodapé com numeração
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

    // Configurar fonte padrão
    doc.setFont('helvetica', 'normal')
    
    // Adicionar cabeçalho da primeira página
    addHeader()
    
    // Seção de dados básicos
    checkPageBreak(15) // Verificar espaço para o título da seção
    doc.setFont('helvetica', 'bold')
    doc.text('DADOS DO EQUIPAMENTO:', margins.left, currentY)
    currentY += 8
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    // Função auxiliar para adicionar texto com quebra automática e controle de página
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

    // Usar texto simples sem caracteres especiais
    const equipmentName = (equipment.name || 'N/A').replace(/[^\w\s-]/g, '')
    const equipmentModel = (equipment.model || 'N/A').replace(/[^\w\s-]/g, '')
    const equipmentSerial = (equipment.serial_number || 'N/A').replace(/[^\w\s-]/g, '')
    const equipmentManufacturer = (equipment.manufacturer || 'N/A').replace(/[^\w\s-]/g, '')
    const equipmentVoltage = (equipment.voltage || 'N/A').replace(/[^\w\s-]/g, '')
    const equipmentPatrimonio = (equipment.patrimonio_number || 'N/A').replace(/[^\w\s-]/g, '')
    const equipmentSector = (equipment.sector_name || 'N/A').replace(/[^\w\s-]/g, '')
    const equipmentSubsector = (equipment.subsector_name || 'N/A').replace(/[^\w\s-]/g, '')
    
    addTextWithWrap('ID', equipment.id.toString())
    addTextWithWrap('Nome', equipmentName)
    addTextWithWrap('Modelo', equipmentModel)
    addTextWithWrap('Numero de Serie', equipmentSerial)
    addTextWithWrap('Fabricante', equipmentManufacturer)
    addTextWithWrap('Status', getStatusText(equipment.status))
    addTextWithWrap('Voltagem', equipmentVoltage)
    addTextWithWrap('Numero Patrimonio', equipmentPatrimonio)
    addTextWithWrap('Setor', equipmentSector)
    addTextWithWrap('Subsetor', equipmentSubsector)
    currentY += 15
    
    // Seção de manutenções
    checkPageBreak(15) // Verificar espaço para o título da seção
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('HISTORICO DE MANUTENCOES:', margins.left, currentY)
    currentY += 8
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    
    if (maintenances.length > 0) {
      maintenances.forEach((maintenance: any, index: number) => {
        const description = (maintenance.description || 'Sem descricao').replace(/[^\w\s-]/g, '')
        const status = (maintenance.status || 'N/A').replace(/[^\w\s-]/g, '')
        const orderNumber = (maintenance.order_number || 'N/A').replace(/[^\w\s-]/g, '')
        const cost = parseFloat(maintenance.cost) || 0
        const date = new Date(maintenance.created_at).toLocaleDateString('pt-BR')
        
        // Verificar espaço necessário para toda a manutenção (aproximadamente 25mm)
        checkPageBreak(25)
        
        // Número da OS
        doc.text(`${index + 1}. OS #${orderNumber}`, margins.left, currentY)
        currentY += 5
        
        // Descrição com quebra automática
        const descriptionText = `   Descricao: ${description}`
        const descriptionLines = doc.splitTextToSize(descriptionText, contentWidth - 5)
        const descriptionSpace = Array.isArray(descriptionLines) ? descriptionLines.length * 5 : 5
        
        if (Array.isArray(descriptionLines)) {
          descriptionLines.forEach((line: string, lineIndex: number) => {
            doc.text(line, margins.left + 5, currentY + (lineIndex * 5))
          })
          currentY += descriptionLines.length * 5
        } else {
          doc.text(descriptionLines, margins.left + 5, currentY)
          currentY += 5
        }
        
        // Status e Data com quebra automática
        const statusText = `   Status: ${status} - Data: ${date}`
        const statusLines = doc.splitTextToSize(statusText, contentWidth - 5)
        
        if (Array.isArray(statusLines)) {
          statusLines.forEach((line: string, lineIndex: number) => {
            doc.text(line, margins.left + 5, currentY + (lineIndex * 5))
          })
          currentY += statusLines.length * 5
        } else {
          doc.text(statusLines, margins.left + 5, currentY)
          currentY += 5
        }
        
        // Valor
        doc.text(`   Valor: R$ ${cost.toFixed(2).replace('.', ',')}`, margins.left + 5, currentY)
        currentY += 8
      })
      
      // Adicionar resumo financeiro
      currentY += 10
      checkPageBreak(25) // Verificar espaço para o resumo financeiro
      doc.setFont('helvetica', 'bold')
      doc.text('RESUMO FINANCEIRO:', margins.left, currentY)
      currentY += 8
      
      doc.setFont('helvetica', 'normal')
      doc.text(`Total de manutencoes: ${maintenances.length}`, margins.left, currentY)
      currentY += 6
      doc.text(`Valor total gasto: R$ ${totalCost.toFixed(2).replace('.', ',')}`, margins.left, currentY)
      currentY += 6
      if (maintenances.length > 0) {
        const averageCost = totalCost / maintenances.length
        doc.text(`Valor medio por manutencao: R$ ${averageCost.toFixed(2).replace('.', ',')}`, margins.left, currentY)
        currentY += 6
      }
    } else {
      doc.text('Nenhuma manutencao encontrada no historico.', margins.left, currentY)
      currentY += 10
    }
    
    // Adicionar informações adicionais
    currentY += 20
    checkPageBreak(25) // Verificar espaço para informações adicionais
    doc.setFont('helvetica', 'bold')
    doc.text('INFORMACOES ADICIONAIS:', margins.left, currentY)
    currentY += 8
    
    doc.setFont('helvetica', 'normal')
    
    // Função para adicionar informação com controle de página
    const addInfo = (text: string) => {
      const infoLines = doc.splitTextToSize(text, contentWidth)
      const requiredSpace = Array.isArray(infoLines) ? infoLines.length * 6 : 6
      checkPageBreak(requiredSpace)
      
      if (Array.isArray(infoLines)) {
        infoLines.forEach((line: string, index: number) => {
          doc.text(line, margins.left, currentY + (index * 6))
        })
        currentY += infoLines.length * 6
      } else {
        doc.text(infoLines, margins.left, currentY)
        currentY += 6
      }
    }
    
    // Informações adicionais
    addInfo('- Este relatorio foi gerado automaticamente pelo sistema')
    addInfo('- Para mais informacoes, consulte o sistema de manutencao')
    addInfo('- Mantenha este documento para seus registros')
    
    // Adicionar rodapé na última página
    addFooter()
    
    // Gerar PDF como buffer com validação
    let pdfBuffer: Buffer
    try {
      const arrayBuffer = doc.output('arraybuffer')
      pdfBuffer = Buffer.from(arrayBuffer)
      
      // Validar tamanho mínimo do PDF
      if (pdfBuffer.length < 1000) {
        throw new Error('PDF gerado muito pequeno, possível corrupção')
      }
      
      console.log(`✅ PDF gerado com sucesso: ${pdfBuffer.length} bytes`)
    } catch (pdfError) {
      console.error('❌ Erro ao gerar PDF:', pdfError)
      throw new Error(`Falha na geração do PDF: ${pdfError.message}`)
    }

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
    console.error('Erro ao gerar relatório PDF:', error)
    
    // Em caso de erro, gerar PDF de emergência com jsPDF
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      
      doc.setFont('helvetica')
      doc.setFontSize(16)
      doc.text('🚨 Relatório de Emergência', 20, 30)
      
      doc.setFontSize(12)
      doc.text('Erro ao conectar com o banco de dados.', 20, 50)
      doc.text('Tente novamente em alguns minutos.', 20, 70)
      doc.text(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 20, 90)
      
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
      
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="relatorio-emergencia.pdf"`,
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
    if (connection) {
      try {
        await connection.end()
      } catch (e) {
        console.error('Erro ao fechar conexão:', e)
      }
    }
  }
}