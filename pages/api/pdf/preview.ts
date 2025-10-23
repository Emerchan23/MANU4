import { NextApiRequest, NextApiResponse } from 'next'
import PDFDocument from 'pdfkit'
import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sis_manu',
  port: parseInt(process.env.DB_PORT || '3306'),
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    const { settings, companyData, logoData, sampleData } = req.body

    // Carregar configurações do banco se não fornecidas
    let pdfSettings = settings
    let company = companyData
    let logo = logoData

    if (!pdfSettings || !company) {
      const connection = await mysql.createConnection(dbConfig)
      
      try {
        if (!pdfSettings) {
          const [settingsRows] = await connection.execute(
            'SELECT * FROM pdf_settings ORDER BY id DESC LIMIT 1'
          )
          pdfSettings = (settingsRows as any[])[0] || getDefaultSettings()
        }

        if (!company) {
          const [companyRows] = await connection.execute(
            'SELECT * FROM company_data ORDER BY id DESC LIMIT 1'
          )
          company = (companyRows as any[])[0] || getDefaultCompany()
        }

        if (!logo) {
          const [logoRows] = await connection.execute(
            'SELECT * FROM company_logos WHERE is_active = 1 ORDER BY id DESC LIMIT 1'
          )
          logo = (logoRows as any[])[0]
        }
      } finally {
        await connection.end()
      }
    }

    // Criar o PDF
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: {
        top: pdfSettings.margin_top || 20,
        bottom: pdfSettings.margin_bottom || 20,
        left: pdfSettings.margin_left || 20,
        right: pdfSettings.margin_right || 20
      }
    })

    // Buffer para armazenar o PDF
    const chunks: Buffer[] = []
    doc.on('data', chunk => chunks.push(chunk))
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'inline; filename="preview.pdf"')
      res.send(pdfBuffer)
    })

    // Desenhar cabeçalho
    if (pdfSettings.header_enabled) {
      drawHeader(doc, pdfSettings, company, logo)
    }

    // Conteúdo do documento
    drawContent(doc, sampleData, pdfSettings)

    // Rodapé
    if (pdfSettings.footer_enabled) {
      drawFooter(doc, pdfSettings)
    }

    doc.end()

  } catch (error) {
    console.error('Erro ao gerar preview:', error)
    return res.status(500).json({ 
      error: 'Erro ao gerar preview do PDF',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }
}

function drawHeader(doc: PDFKit.PDFDocument, settings: any, company: any, logo: any) {
  const pageWidth = doc.page.width
  const headerHeight = settings.header_height || 80
  
  // Fundo do cabeçalho
  doc.rect(0, 0, pageWidth, headerHeight)
     .fill(settings.header_bg_color || '#3b82f6')

  // Logo (se disponível e habilitado)
  if (settings.logo_enabled && logo) {
    try {
      const logoPath = path.join(process.cwd(), 'public', 'uploads', 'logos', logo.filename)
      if (fs.existsSync(logoPath)) {
        const logoX = settings.logo_margin_x || 10
        const logoY = settings.logo_margin_y || 10
        const logoWidth = settings.logo_width || 60
        const logoHeight = settings.logo_height || 60
        
        doc.image(logoPath, logoX, logoY, {
          width: logoWidth,
          height: logoHeight,
          fit: [logoWidth, logoHeight]
        })
      }
    } catch (error) {
      console.error('Erro ao carregar logo:', error)
    }
  }

  // Título e subtítulo
  doc.fill(settings.header_text_color || '#ffffff')
  
  // Título centralizado
  doc.fontSize(settings.header_font_size || 24)
     .text(settings.header_title || 'ORDEM DE SERVIÇO', 0, 20, {
       align: 'center',
       width: pageWidth
     })

  // Subtítulo
  if (settings.header_subtitle) {
    doc.fontSize(settings.header_subtitle_font_size || 14)
       .text(settings.header_subtitle, 0, 50, {
         align: 'center',
         width: pageWidth
       })
  }

  // Dados da empresa (lado direito)
  if (company) {
    const companyX = pageWidth - 200
    doc.fontSize(10)
       .text(company.name, companyX, 15)
       .text(`CNPJ: ${company.cnpj}`, companyX, 28)
       .text(company.phone, companyX, 41)
       .text(company.email, companyX, 54)
  }

  // Mover cursor para baixo do cabeçalho
  doc.y = headerHeight + 20
}

function drawContent(doc: PDFKit.PDFDocument, data: any, settings: any) {
  const textColor = settings.text_color || '#1f2937'
  const borderColor = settings.border_color || '#e5e7eb'
  
  doc.fill(textColor)
  
  // Número da OS e Data
  doc.fontSize(14)
     .text(`Número: ${data.numero || 'N/A'}`, { continued: true })
     .text(`Data: ${data.data || new Date().toLocaleDateString('pt-BR')}`, { align: 'right' })
  
  doc.moveDown()
  
  // Cliente
  doc.fontSize(12)
     .text(`Cliente: ${data.cliente || 'N/A'}`)
  
  doc.moveDown()
  
  // Equipamento
  doc.text(`Equipamento: ${data.equipamento || 'N/A'}`)
  
  doc.moveDown(2)
  
  // Descrição do serviço
  doc.fontSize(14)
     .text('DESCRIÇÃO DO SERVIÇO', { underline: true })
  
  doc.moveDown()
  doc.fontSize(11)
     .text(data.descricao || 'Descrição do serviço a ser realizado.')
  
  doc.moveDown(2)
  
  // Observações
  if (data.observacoes) {
    doc.fontSize(14)
       .text('OBSERVAÇÕES', { underline: true })
    
    doc.moveDown()
    doc.fontSize(11)
       .text(data.observacoes)
    
    doc.moveDown(2)
  }
  
  // Assinaturas (se habilitadas)
  if (settings.signature_enabled) {
    const pageHeight = doc.page.height
    const signatureY = pageHeight - 120
    
    doc.y = signatureY
    
    // Linha para assinatura 1
    doc.moveTo(50, signatureY)
       .lineTo(250, signatureY)
       .stroke(borderColor)
    
    doc.fontSize(10)
       .text(settings.signature_field1_label || 'Responsável pela Execução', 50, signatureY + 10)
    
    // Linha para assinatura 2
    doc.moveTo(300, signatureY)
       .lineTo(500, signatureY)
       .stroke(borderColor)
    
    doc.text(settings.signature_field2_label || 'Supervisor/Aprovador', 300, signatureY + 10)
  }
}

function drawFooter(doc: PDFKit.PDFDocument, settings: any) {
  const pageHeight = doc.page.height
  const pageWidth = doc.page.width
  const footerHeight = settings.footer_height || 40
  const footerY = pageHeight - footerHeight
  
  // Fundo do rodapé
  doc.rect(0, footerY, pageWidth, footerHeight)
     .fill(settings.footer_bg_color || '#f3f4f6')
  
  // Texto do rodapé
  doc.fill(settings.footer_text_color || '#6b7280')
     .fontSize(9)
     .text(settings.footer_text || 'Documento gerado automaticamente pelo sistema', 0, footerY + 15, {
       align: 'center',
       width: pageWidth
     })
  
  // Número da página (se habilitado)
  if (settings.show_page_numbers) {
    doc.text(`Página 1`, pageWidth - 100, footerY + 15)
  }
  
  // Data (se habilitada)
  if (settings.show_date) {
    doc.text(new Date().toLocaleDateString('pt-BR'), 50, footerY + 15)
  }
}

function getDefaultSettings() {
  return {
    header_enabled: true,
    header_title: 'ORDEM DE SERVIÇO',
    header_subtitle: 'Sistema de Manutenção',
    header_bg_color: '#3b82f6',
    header_text_color: '#ffffff',
    header_height: 80,
    header_font_size: 24,
    header_subtitle_font_size: 14,
    logo_enabled: true,
    logo_width: 60,
    logo_height: 60,
    logo_margin_x: 10,
    logo_margin_y: 10,
    primary_color: '#3b82f6',
    secondary_color: '#10b981',
    text_color: '#1f2937',
    border_color: '#e5e7eb',
    footer_enabled: true,
    footer_text: 'Documento gerado automaticamente pelo sistema',
    footer_bg_color: '#f3f4f6',
    footer_text_color: '#6b7280',
    footer_height: 40,
    show_date: true,
    show_page_numbers: true,
    margin_top: 20,
    margin_bottom: 20,
    margin_left: 20,
    margin_right: 20,
    signature_enabled: true,
    signature_field1_label: 'Responsável pela Execução',
    signature_field2_label: 'Supervisor/Aprovador'
  }
}

function getDefaultCompany() {
  return {
    name: 'Sua Empresa',
    cnpj: '00.000.000/0000-00',
    address: 'Endereço da empresa',
    phone: '(00) 0000-0000',
    email: 'contato@empresa.com'
  }
}