import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { query } from './database.js'
import { formatCurrency } from './currency'
import { formatDateBR } from './date-utils-br'

export interface PDFTemplate {
  id: number
  name: string
  type: 'service-order' | 'preventive-maintenance' | 'reports' | 'global'
  headerConfig: {
    showLogo: boolean
    logoPosition: 'left' | 'center' | 'right'
    title: string
    subtitle?: string
    showDate: boolean
    backgroundColor?: string
    textColor?: string
  }
  footerConfig: {
    showPageNumbers: boolean
    leftText?: string
    centerText?: string
    rightText?: string
    backgroundColor?: string
    textColor?: string
  }
  logoConfig?: {
    logoId: number
    width: number
    height: number
    position: 'left' | 'center' | 'right'
  }
}

export interface PDFData {
  title: string
  subtitle?: string
  data: any[]
  summary?: Record<string, any>
  filters?: Record<string, any>
}

export class PDFGenerator {
  private pdf: jsPDF
  private template: PDFTemplate | null = null
  private logoImage: string | null = null
  private customSettings: any = null

  constructor() {
    // Inicializar com margens padrão, serão sobrescritas pelas configurações personalizadas
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })
  }

  // Aplicar margens personalizadas
  private applyCustomMargins(): void {
    if (this.customSettings) {
      const marginTop = this.customSettings.pdf_margin_top || 20
      const marginBottom = this.customSettings.pdf_margin_bottom || 20
      const marginLeft = this.customSettings.pdf_margin_left || 15
      const marginRight = this.customSettings.pdf_margin_right || 15
      
      // Definir margens no PDF
      this.pdf.setProperties({
        title: 'Documento PDF',
        subject: 'Gerado pelo Sistema de Manutenção',
        creator: 'Sistema de Manutenção'
      })
    }
  }

  // Carregar configurações personalizadas do sistema
  async loadCustomSettings(): Promise<void> {
    try {
      console.log('🔍 Carregando configurações personalizadas do PDF...')
      const settings = await query(
        `SELECT setting_key, setting_value 
         FROM system_settings 
         WHERE setting_key LIKE 'pdf_%'`
      )
      
      console.log('📊 Configurações encontradas no banco:', settings)
      
      this.customSettings = {}
      settings.forEach((setting: any) => {
        try {
          this.customSettings[setting.setting_key] = JSON.parse(setting.setting_value)
        } catch {
          this.customSettings[setting.setting_key] = setting.setting_value
        }
      })
      
      console.log('⚙️ Configurações processadas:', this.customSettings)
      
      // Carregar logo personalizado se habilitado
      if (this.customSettings.pdf_logo_enabled) {
        console.log('🖼️ Logo personalizado habilitado, carregando...')
        await this.loadCustomLogo()
      } else {
        console.log('❌ Logo personalizado não habilitado')
      }
    } catch (error) {
      console.error('❌ Erro ao carregar configurações personalizadas:', error)
    }
  }

  // Carregar logo personalizado
  private async loadCustomLogo(): Promise<void> {
    try {
      const logos = await query(
        'SELECT * FROM logo_uploads WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 1'
      )
      
      if (logos.length > 0) {
        const logo = logos[0]
        // Converter imagem para base64
        const fs = require('fs')
        const path = require('path')
        const logoPath = path.join(process.cwd(), 'public', logo.file_path)
        
        if (fs.existsSync(logoPath)) {
          const imageBuffer = fs.readFileSync(logoPath)
          const base64Image = imageBuffer.toString('base64')
          const mimeType = logo.file_path.endsWith('.png') ? 'image/png' : 'image/jpeg'
          this.logoImage = `data:${mimeType};base64,${base64Image}`
        }
      }
    } catch (error) {
      console.error('Erro ao carregar logo personalizado:', error)
    }
  }

  // Carregar template do banco de dados
  async loadTemplate(type: string): Promise<void> {
    try {
      const templates = await query(
        'SELECT * FROM pdf_templates WHERE type = ? AND is_default = TRUE AND is_active = TRUE LIMIT 1',
        [type]
      )
      
      if (templates.length > 0) {
        const template = templates[0]
        this.template = {
          id: template.id,
          name: template.name,
          type: template.type,
          headerConfig: JSON.parse(template.header_config),
          footerConfig: JSON.parse(template.footer_config),
          logoConfig: template.logo_config ? JSON.parse(template.logo_config) : undefined
        }
        
        // Carregar logo se configurado
        if (this.template.logoConfig) {
          await this.loadLogo(this.template.logoConfig.logoId)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar template:', error)
    }
  }

  // Carregar logo do banco de dados
  private async loadLogo(logoId: number): Promise<void> {
    try {
      const logos = await query(
        'SELECT file_path FROM logo_uploads WHERE id = ? AND is_active = TRUE',
        [logoId]
      )
      
      if (logos.length > 0) {
        // Converter imagem para base64
        const fs = require('fs')
        const path = require('path')
        const logoPath = path.join(process.cwd(), 'public', logos[0].file_path)
        
        if (fs.existsSync(logoPath)) {
          const imageBuffer = fs.readFileSync(logoPath)
          const base64Image = imageBuffer.toString('base64')
          const mimeType = logos[0].file_path.endsWith('.png') ? 'image/png' : 'image/jpeg'
          this.logoImage = `data:${mimeType};base64,${base64Image}`
        }
      }
    } catch (error) {
      console.error('Erro ao carregar logo:', error)
    }
  }

  // Adicionar cabeçalho personalizado
  private addCustomHeader(): void {
    console.log('🎯 Verificando se deve adicionar cabeçalho personalizado...')
    console.log('📋 Configurações customSettings:', this.customSettings)
    
    if (!this.customSettings?.pdf_header_enabled) {
      console.log('❌ Cabeçalho personalizado não habilitado')
      return
    }

    console.log('✅ Adicionando cabeçalho personalizado...')
    const pageWidth = this.pdf.internal.pageSize.getWidth()
    const marginLeft = this.customSettings.pdf_margin_left || 15
    const marginRight = this.customSettings.pdf_margin_right || 15
    const marginTop = this.customSettings.pdf_margin_top || 20
    
    let yPosition = marginTop
    
    // Logo personalizado
    if (this.customSettings.pdf_logo_enabled && this.logoImage) {
      this.pdf.addImage(
        this.logoImage,
        'PNG',
        marginLeft,
        5,
        30, // largura padrão
        20  // altura padrão
      )
    }
    
    // Título do cabeçalho
    this.pdf.setFontSize(16)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setTextColor('#000000')
    
    let titleX = marginLeft
    if (this.customSettings.pdf_logo_enabled && this.logoImage) {
      titleX = marginLeft + 35 // espaço para o logo
    }
    
    const headerText = this.customSettings.pdf_header_text || 'Sistema de Manutenção'
    this.pdf.text(headerText, titleX, yPosition)
    
    // Nome da empresa
    if (this.customSettings.pdf_company_name) {
      this.pdf.setFontSize(12)
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.text(this.customSettings.pdf_company_name, titleX, yPosition + 6)
    }
    
    // Endereço da empresa
    if (this.customSettings.pdf_company_address) {
      this.pdf.setFontSize(10)
      this.pdf.text(this.customSettings.pdf_company_address, titleX, yPosition + 12)
    }
    
    // Data
    if (this.customSettings.pdf_show_date) {
      const currentDate = new Date().toLocaleDateString('pt-BR')
      this.pdf.setFontSize(10)
      this.pdf.text(`Data: ${currentDate}`, pageWidth - marginRight - 50, yPosition)
    }
    
    // Linha separadora
    this.pdf.setDrawColor(200, 200, 200)
    this.pdf.line(marginLeft, yPosition + 18, pageWidth - marginRight, yPosition + 18)
  }

  // Adicionar cabeçalho (método original mantido para compatibilidade)
  private addHeader(): void {
    // Se temos configurações personalizadas, usar elas
    if (this.customSettings) {
      this.addCustomHeader()
      return
    }

    // Caso contrário, usar template padrão
    if (!this.template?.headerConfig) return

    const { headerConfig } = this.template
    const pageWidth = this.pdf.internal.pageSize.getWidth()
    
    // Background do cabeçalho
    if (headerConfig.backgroundColor) {
      this.pdf.setFillColor(headerConfig.backgroundColor)
      this.pdf.rect(0, 0, pageWidth, 30, 'F')
    }
    
    // Cor do texto
    this.pdf.setTextColor(headerConfig.textColor || '#000000')
    
    let yPosition = 15
    
    // Logo
    if (headerConfig.showLogo && this.logoImage && this.template.logoConfig) {
      const logoConfig = this.template.logoConfig
      let xPosition = 10
      
      if (logoConfig.position === 'center') {
        xPosition = (pageWidth - logoConfig.width) / 2
      } else if (logoConfig.position === 'right') {
        xPosition = pageWidth - logoConfig.width - 10
      }
      
      this.pdf.addImage(
        this.logoImage,
        'PNG',
        xPosition,
        5,
        logoConfig.width,
        logoConfig.height
      )
    }
    
    // Título
    this.pdf.setFontSize(16)
    this.pdf.setFont('helvetica', 'bold')
    
    let titleX = 10
    if (headerConfig.showLogo && this.template.logoConfig?.position === 'left') {
      titleX = 10 + this.template.logoConfig.width + 10
    }
    
    this.pdf.text(headerConfig.title, titleX, yPosition)
    
    // Subtítulo
    if (headerConfig.subtitle) {
      this.pdf.setFontSize(12)
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.text(headerConfig.subtitle, titleX, yPosition + 6)
    }
    
    // Data
    if (headerConfig.showDate) {
      const currentDate = new Date().toLocaleDateString('pt-BR')
      this.pdf.setFontSize(10)
      this.pdf.text(`Data: ${currentDate}`, pageWidth - 50, yPosition)
    }
    
    // Linha separadora
    this.pdf.setDrawColor(200, 200, 200)
    this.pdf.line(10, 32, pageWidth - 10, 32)
  }

  // Adicionar rodapé personalizado
  private addCustomFooter(pageNumber: number, totalPages: number): void {
    console.log('🎯 Verificando se deve adicionar rodapé personalizado...')
    console.log('📋 Configurações customSettings:', this.customSettings)
    
    if (!this.customSettings?.pdf_footer_enabled) {
      console.log('❌ Rodapé personalizado não habilitado')
      return
    }

    console.log('✅ Adicionando rodapé personalizado...')
    const pageWidth = this.pdf.internal.pageSize.getWidth()
    const pageHeight = this.pdf.internal.pageSize.getHeight()
    const marginLeft = this.customSettings.pdf_margin_left || 15
    const marginRight = this.customSettings.pdf_margin_right || 15
    const marginBottom = this.customSettings.pdf_margin_bottom || 20
    const footerY = pageHeight - marginBottom + 5
    
    // Linha separadora
    this.pdf.setDrawColor(200, 200, 200)
    this.pdf.line(marginLeft, pageHeight - marginBottom, pageWidth - marginRight, pageHeight - marginBottom)
    
    // Cor do texto
    this.pdf.setTextColor('#666666')
    this.pdf.setFontSize(8)
    this.pdf.setFont('helvetica', 'normal')
    
    // Texto do rodapé
    const footerText = this.customSettings.pdf_footer_text || ''
    if (footerText) {
      this.pdf.text(footerText, marginLeft, footerY)
    }
    
    // Numeração de páginas
    if (this.customSettings.pdf_show_page_numbers) {
      const pageText = `Página ${pageNumber} de ${totalPages}`
      const textWidth = this.pdf.getTextWidth(pageText)
      this.pdf.text(pageText, pageWidth - marginRight - textWidth, footerY)
    }
  }

  // Adicionar rodapé (método original mantido para compatibilidade)
  private addFooter(pageNumber: number, totalPages: number): void {
    // Se temos configurações personalizadas, usar elas
    if (this.customSettings) {
      this.addCustomFooter(pageNumber, totalPages)
      return
    }

    // Caso contrário, usar template padrão
    if (!this.template?.footerConfig) return

    const { footerConfig } = this.template
    const pageWidth = this.pdf.internal.pageSize.getWidth()
    const pageHeight = this.pdf.internal.pageSize.getHeight()
    const footerY = pageHeight - 15
    
    // Background do rodapé
    if (footerConfig.backgroundColor) {
      this.pdf.setFillColor(footerConfig.backgroundColor)
      this.pdf.rect(0, pageHeight - 20, pageWidth, 20, 'F')
    }
    
    // Linha separadora
    this.pdf.setDrawColor(200, 200, 200)
    this.pdf.line(10, pageHeight - 20, pageWidth - 10, pageHeight - 20)
    
    // Cor do texto
    this.pdf.setTextColor(footerConfig.textColor || '#666666')
    this.pdf.setFontSize(8)
    this.pdf.setFont('helvetica', 'normal')
    
    // Texto esquerdo
    if (footerConfig.leftText) {
      this.pdf.text(footerConfig.leftText, 10, footerY)
    }
    
    // Texto central
    if (footerConfig.centerText) {
      const textWidth = this.pdf.getTextWidth(footerConfig.centerText)
      this.pdf.text(footerConfig.centerText, (pageWidth - textWidth) / 2, footerY)
    }
    
    // Texto direito / Numeração de páginas
    let rightText = footerConfig.rightText || ''
    if (footerConfig.showPageNumbers) {
      rightText = rightText ? `${rightText} | Página ${pageNumber} de ${totalPages}` : `Página ${pageNumber} de ${totalPages}`
    }
    
    if (rightText) {
      const textWidth = this.pdf.getTextWidth(rightText)
      this.pdf.text(rightText, pageWidth - textWidth - 10, footerY)
    }
  }

  // Gerar PDF de relatórios
  async generateReportPDF(data: PDFData): Promise<Uint8Array> {
    // Carregar configurações personalizadas primeiro
    await this.loadCustomSettings()
    await this.loadTemplate('reports')
    
    // Aplicar margens personalizadas
    this.applyCustomMargins()
    
    // Adicionar cabeçalho personalizado ou padrão
    this.addHeader()
    
    const marginTop = this.customSettings?.pdf_margin_top || 20
    const marginLeft = this.customSettings?.pdf_margin_left || 15
    
    // Ajustar posição inicial baseado no cabeçalho personalizado
    let yPosition = this.customSettings?.pdf_header_enabled ? marginTop + 40 : marginTop + 25
    
    // Título do relatório
    this.pdf.setFontSize(14)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setTextColor('#000000')
    this.pdf.text(data.title, marginLeft, yPosition)
    yPosition += 10
    
    // Subtítulo
    if (data.subtitle) {
      this.pdf.setFontSize(10)
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.setTextColor('#666666')
      this.pdf.text(data.subtitle, marginLeft, yPosition)
      yPosition += 8
    }
    
    // Filtros aplicados
    if (data.filters) {
      this.pdf.setFontSize(9)
      this.pdf.setTextColor('#888888')
      Object.entries(data.filters).forEach(([key, value]) => {
        this.pdf.text(`${key}: ${value}`, marginLeft, yPosition)
        yPosition += 5
      })
      yPosition += 5
    }
    
    // Resumo
    if (data.summary) {
      this.pdf.setFontSize(12)
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.setTextColor('#000000')
      this.pdf.text('Resumo:', marginLeft, yPosition)
      yPosition += 8
      
      this.pdf.setFontSize(10)
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.setTextColor('#333333')
      Object.entries(data.summary).forEach(([key, value]) => {
        this.pdf.text(`• ${key}: ${value}`, marginLeft + 5, yPosition)
        yPosition += 6
      })
      yPosition += 10
    }
    
    // Adicionar dados em tabela
    if (data.data && data.data.length > 0) {
      this.addDataTable(data.data, yPosition)
    }
    
    // Adicionar rodapé personalizado ou padrão
    this.addFooter(1, 1)

    return new Uint8Array(this.pdf.output('arraybuffer'))
  }

  // Gerar PDF de ordem de serviço
  async generateServiceOrderPDF(data: any): Promise<Uint8Array> {
    try {
      console.log('Iniciando geração de PDF para ordem de serviço:', data.order_number)
      
      // Carregar configurações personalizadas primeiro
      await this.loadCustomSettings()
      await this.loadTemplate('service-order')

      // Aplicar margens personalizadas
      this.applyCustomMargins()

      const marginTop = this.customSettings?.pdf_margin_top || 15
      const marginLeft = this.customSettings?.pdf_margin_left || 15
      const marginRight = this.customSettings?.pdf_margin_right || 15
      const pageWidth = this.pdf.internal.pageSize.getWidth()
      
      let yPosition = marginTop

      // CABEÇALHO PRINCIPAL COM NÚMERO DA OS EM DESTAQUE
      this.addProfessionalHeader(data, yPosition)
      yPosition += 35

      // SEÇÃO DADOS DA EMPRESA
      yPosition = this.addCompanySection(data, yPosition, marginLeft, pageWidth - marginRight)
      yPosition += 10

      // SEÇÃO EQUIPAMENTO
      yPosition = this.addEquipmentSection(data, yPosition, marginLeft, pageWidth - marginRight)
      yPosition += 10

      // SEÇÃO DETALHES DA ORDEM DE SERVIÇO
      yPosition = this.addServiceOrderDetailsSection(data, yPosition, marginLeft, pageWidth - marginRight)
      yPosition += 10

      // SEÇÃO DESCRIÇÃO DO SERVIÇO
      yPosition = this.addDescriptionSection(data, yPosition, marginLeft, pageWidth - marginRight)
      yPosition += 10

      // SEÇÃO OBSERVAÇÕES
      if (data.observations && data.observations !== 'N/A') {
        yPosition = this.addObservationsSection(data, yPosition, marginLeft, pageWidth - marginRight)
        yPosition += 10
      }

      // CAMPOS DE ASSINATURA
      this.addSignatureFields(yPosition, marginLeft, pageWidth - marginRight)

      // Adicionar rodapé personalizado ou padrão
      this.addFooter(1, 1)

      console.log('PDF gerado com sucesso')
      return new Uint8Array(this.pdf.output('arraybuffer'))
    } catch (error) {
      console.error('Erro ao gerar PDF da ordem de serviço:', error)
      throw new Error(`Erro ao gerar PDF: ${error.message}`)
    }
  }

  // Adicionar cabeçalho profissional com número da OS em destaque
  private addProfessionalHeader(data: any, yPosition: number): void {
    const pageWidth = this.pdf.internal.pageSize.getWidth()
    const marginLeft = 15
    
    // Título principal
    this.pdf.setFontSize(16)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setTextColor(25, 25, 112) // Azul escuro
    this.pdf.text('ORDEM DE SERVIÇO', marginLeft, yPosition)
    
    // Subtítulo
    this.pdf.setFontSize(10)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.setTextColor(100, 100, 100)
    this.pdf.text('Documento de Manutenção', marginLeft, yPosition + 6)
    
    // Número da OS em destaque (canto superior direito)
    const osNumber = data.order_number || 'N/A'
    this.pdf.setFillColor(25, 25, 112) // Azul escuro
    this.pdf.rect(pageWidth - 65, yPosition - 8, 50, 20, 'F')
    
    this.pdf.setFontSize(8)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setTextColor(255, 255, 255) // Branco
    this.pdf.text('NÚMERO OS', pageWidth - 60, yPosition - 2)
    
    this.pdf.setFontSize(12)
    this.pdf.text(osNumber, pageWidth - 60, yPosition + 6)
    
    // Resetar cor do texto
    this.pdf.setTextColor(0, 0, 0)
  }

  // Adicionar seção de dados da empresa
  private addCompanySection(data: any, yPosition: number, marginLeft: number, pageWidth: number): number {
    const sectionWidth = pageWidth - marginLeft
    
    // Cabeçalho da seção com fundo cinza
    this.pdf.setFillColor(240, 240, 240)
    this.pdf.rect(marginLeft, yPosition, sectionWidth, 8, 'F')
    
    this.pdf.setFontSize(11)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setTextColor(0, 0, 0)
    this.pdf.text('DADOS DA EMPRESA', marginLeft + 3, yPosition + 5)
    yPosition += 12
    
    // Conteúdo da seção
    this.pdf.setFontSize(9)
    this.pdf.setFont('helvetica', 'normal')
    
    const companyName = data.company_name || 'Empresa não informada'
    const companyCnpj = data.company_cnpj || 'CNPJ não informado'
    const companyAddress = data.company_address || 'Endereço não informado'
    
    this.pdf.text(`Razão Social: ${companyName}`, marginLeft + 3, yPosition)
    yPosition += 5
    this.pdf.text(`CNPJ: ${companyCnpj}`, marginLeft + 3, yPosition)
    yPosition += 5
    this.pdf.text(`Endereço: ${companyAddress}`, marginLeft + 3, yPosition)
    yPosition += 8
    
    return yPosition
  }

  // Adicionar seção de equipamento organizada em colunas
  private addEquipmentSection(data: any, yPosition: number, marginLeft: number, pageWidth: number): number {
    const sectionWidth = pageWidth - marginLeft
    
    // Cabeçalho da seção
    this.pdf.setFillColor(245, 245, 245)
    this.pdf.rect(marginLeft, yPosition, sectionWidth, 8, 'F')
    
    this.pdf.setFontSize(11)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setTextColor(0, 0, 0)
    this.pdf.text('EQUIPAMENTO', marginLeft + 3, yPosition + 5)
    yPosition += 12
    
    // Organizar em duas colunas
    const colWidth = sectionWidth / 2
    
    // Coluna 1
    this.pdf.setFillColor(250, 250, 250)
    this.pdf.rect(marginLeft, yPosition, colWidth - 2, 25, 'F')
    
    this.pdf.setFontSize(8)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('NOME DO EQUIPAMENTO', marginLeft + 3, yPosition + 4)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.text(data.equipment_name || 'Compressor de Ar Industrial', marginLeft + 3, yPosition + 8)
    
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('SETOR', marginLeft + 3, yPosition + 15)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.text(data.sector_name || 'Produção', marginLeft + 3, yPosition + 19)
    
    // Coluna 2
    this.pdf.setFillColor(250, 250, 250)
    this.pdf.rect(marginLeft + colWidth, yPosition, colWidth - 2, 25, 'F')
    
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('Nº PATRIMÔNIO', marginLeft + colWidth + 3, yPosition + 4)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.text(data.equipment_patrimonio || 'PAT-2023-0456', marginLeft + colWidth + 3, yPosition + 8)
    
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('SUBSETOR', marginLeft + colWidth + 3, yPosition + 15)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.text(data.subsector_name || 'Linha de Montagem A', marginLeft + colWidth + 3, yPosition + 19)
    
    yPosition += 30
    return yPosition
  }

  // Adicionar seção de detalhes da ordem de serviço
  private addServiceOrderDetailsSection(data: any, yPosition: number, marginLeft: number, pageWidth: number): number {
    const sectionWidth = pageWidth - marginLeft
    
    // Cabeçalho da seção
    this.pdf.setFillColor(245, 245, 245)
    this.pdf.rect(marginLeft, yPosition, sectionWidth, 8, 'F')
    
    this.pdf.setFontSize(11)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setTextColor(0, 0, 0)
    this.pdf.text('DETALHES DA ORDEM DE SERVIÇO', marginLeft + 3, yPosition + 5)
    yPosition += 12
    
    // Organizar em três colunas
    const colWidth = sectionWidth / 3
    
    // Coluna 1 - Tipo de Manutenção
    this.pdf.setFillColor(250, 250, 250)
    this.pdf.rect(marginLeft, yPosition, colWidth - 2, 15, 'F')
    
    this.pdf.setFontSize(8)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('TIPO DE MANUTENÇÃO', marginLeft + 3, yPosition + 4)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.text(data.type || 'Preventiva', marginLeft + 3, yPosition + 8)
    
    // Coluna 2 - Data Agendamento
    this.pdf.setFillColor(250, 250, 250)
    this.pdf.rect(marginLeft + colWidth, yPosition, colWidth - 2, 15, 'F')
    
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('DATA AGENDAMENTO', marginLeft + colWidth + 3, yPosition + 4)
    this.pdf.setFont('helvetica', 'normal')
    const scheduledDate = data.scheduled_date ? formatDateBR(data.scheduled_date) : '15/01/2024'
    this.pdf.text(scheduledDate, marginLeft + colWidth + 3, yPosition + 8)
    
    // Coluna 3 - Custo Estimado
    this.pdf.setFillColor(250, 250, 250)
    this.pdf.rect(marginLeft + (colWidth * 2), yPosition, colWidth - 2, 15, 'F')
    
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('CUSTO ESTIMADO', marginLeft + (colWidth * 2) + 3, yPosition + 4)
    this.pdf.setFont('helvetica', 'normal')
    const estimatedCost = data.estimated_cost ? formatCurrency(parseFloat(data.estimated_cost)) : 'R$ 1.850,00'
    this.pdf.text(estimatedCost, marginLeft + (colWidth * 2) + 3, yPosition + 8)
    
    yPosition += 20
    
    // Responsável
    this.pdf.setFillColor(250, 250, 250)
    this.pdf.rect(marginLeft, yPosition, sectionWidth, 10, 'F')
    
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('RESPONSÁVEL PELO ACOMPANHAMENTO DO SERVIÇO', marginLeft + 3, yPosition + 4)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.text(data.assigned_to || 'João Silva Santos', marginLeft + 3, yPosition + 8)
    
    yPosition += 15
    return yPosition
  }

  // Adicionar seção de descrição do serviço
  private addDescriptionSection(data: any, yPosition: number, marginLeft: number, pageWidth: number): number {
    const sectionWidth = pageWidth - marginLeft
    
    // Cabeçalho da seção
    this.pdf.setFillColor(245, 245, 245)
    this.pdf.rect(marginLeft, yPosition, sectionWidth, 8, 'F')
    
    this.pdf.setFontSize(11)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setTextColor(0, 0, 0)
    this.pdf.text('DESCRIÇÃO DO SERVIÇO', marginLeft + 3, yPosition + 5)
    yPosition += 12
    
    // Conteúdo da descrição
    this.pdf.setFillColor(250, 250, 250)
    const descriptionHeight = 25
    this.pdf.rect(marginLeft, yPosition, sectionWidth, descriptionHeight, 'F')
    
    this.pdf.setFontSize(9)
    this.pdf.setFont('helvetica', 'normal')
    const description = data.description || 'Realizar manutenção preventiva completa do compressor de ar, incluindo verificação de pressão, lubrificação de componentes móveis, inspeção de correias e filtros, verificação do sistema elétrico e teste de funcionamento conforme manual do fabricante.'
    const descriptionLines = this.pdf.splitTextToSize(description, sectionWidth - 6)
    this.pdf.text(descriptionLines, marginLeft + 3, yPosition + 5)
    
    yPosition += descriptionHeight + 5
    return yPosition
  }

  // Adicionar seção de observações
  private addObservationsSection(data: any, yPosition: number, marginLeft: number, pageWidth: number): number {
    const sectionWidth = pageWidth - marginLeft
    
    // Cabeçalho da seção
    this.pdf.setFillColor(245, 245, 245)
    this.pdf.rect(marginLeft, yPosition, sectionWidth, 8, 'F')
    
    this.pdf.setFontSize(11)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setTextColor(0, 0, 0)
    this.pdf.text('OBSERVAÇÕES', marginLeft + 3, yPosition + 5)
    yPosition += 12
    
    // Conteúdo das observações
    this.pdf.setFillColor(250, 250, 250)
    const observationsHeight = 20
    this.pdf.rect(marginLeft, yPosition, sectionWidth, observationsHeight, 'F')
    
    this.pdf.setFontSize(9)
    this.pdf.setFont('helvetica', 'normal')
    const observations = data.observations || 'Equipamento crítico para a linha de produção. Agendar manutenção preferencialmente no período noturno ou fim de semana para não impactar a produção.'
    const observationsLines = this.pdf.splitTextToSize(observations, sectionWidth - 6)
    this.pdf.text(observationsLines, marginLeft + 3, yPosition + 5)
    
    yPosition += observationsHeight + 5
    return yPosition
  }

  // Adicionar campos de assinatura
  private addSignatureFields(yPosition: number, marginLeft: number, pageWidth: number): void {
    const sectionWidth = pageWidth - marginLeft
    const colWidth = sectionWidth / 2
    
    // Verificar se precisa de nova página
    if (yPosition > 220) {
      this.pdf.addPage()
      yPosition = 30
    }
    
    // Linha separadora
    this.pdf.setLineWidth(0.5)
    this.pdf.setDrawColor(0, 0, 0)
    this.pdf.line(marginLeft, yPosition, pageWidth, yPosition)
    yPosition += 15
    
    // Campo 1 - Responsável pela Execução
    this.pdf.setFontSize(10)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.text('Responsável pela Execução', marginLeft + (colWidth / 2) - 25, yPosition)
    
    // Campo 2 - Supervisor/Aprovador
    this.pdf.text('Supervisor/Aprovador', marginLeft + colWidth + (colWidth / 2) - 25, yPosition)
    
    yPosition += 10
    
    // Linhas para assinatura
    this.pdf.setLineWidth(0.3)
    this.pdf.line(marginLeft + 10, yPosition, marginLeft + colWidth - 10, yPosition)
    this.pdf.line(marginLeft + colWidth + 10, yPosition, pageWidth - 10, yPosition)
    
    yPosition += 5
    
    // Texto "Assinatura e Data"
    this.pdf.setFontSize(8)
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.text('Assinatura e Data', marginLeft + (colWidth / 2) - 15, yPosition)
    this.pdf.text('Assinatura e Data', marginLeft + colWidth + (colWidth / 2) - 15, yPosition)
  }

  // Adicionar tabela de dados
  private addDataTable(data: any[], startY: number): void {
    if (!data.length) return
    
    const pageWidth = this.pdf.internal.pageSize.getWidth()
    const tableWidth = pageWidth - 20
    const headers = Object.keys(data[0])
    const colWidth = tableWidth / headers.length
    
    let yPosition = startY
    
    // Cabeçalho da tabela
    this.pdf.setFillColor(240, 240, 240)
    this.pdf.rect(10, yPosition - 5, tableWidth, 8, 'F')
    
    this.pdf.setFontSize(9)
    this.pdf.setFont('helvetica', 'bold')
    this.pdf.setTextColor('#000000')
    
    headers.forEach((header, index) => {
      this.pdf.text(header, 12 + (index * colWidth), yPosition)
    })
    
    yPosition += 10
    
    // Dados da tabela
    this.pdf.setFont('helvetica', 'normal')
    this.pdf.setFontSize(8)
    
    data.forEach((row, rowIndex) => {
      if (yPosition > 250) { // Nova página se necessário
        this.pdf.addPage()
        this.addHeader()
        yPosition = 45
      }
      
      // Linha alternada
      if (rowIndex % 2 === 0) {
        this.pdf.setFillColor(250, 250, 250)
        this.pdf.rect(10, yPosition - 3, tableWidth, 6, 'F')
      }
      
      headers.forEach((header, index) => {
        const value = String(row[header] || '')
        const truncatedValue = value.length > 20 ? value.substring(0, 17) + '...' : value
        this.pdf.text(truncatedValue, 12 + (index * colWidth), yPosition)
      })
      
      yPosition += 6
    })
  }

  // Salvar PDF
  save(filename: string): void {
    this.pdf.save(filename)
  }

  // Obter PDF como blob
  getBlob(): Blob {
    return this.pdf.output('blob')
  }

  // Gerar PDF de manutenção preventiva individual
  async generatePreventiveMaintenancePDF(data: any): Promise<Uint8Array> {
    try {
      console.log('Iniciando geração de PDF para manutenção preventiva:', data.id)
      
      // Carregar configurações personalizadas primeiro
      await this.loadCustomSettings()
      await this.loadTemplate('preventive-maintenance')

      // Aplicar margens personalizadas
      this.applyCustomMargins()

      // Adicionar cabeçalho personalizado ou padrão
      this.addHeader()

      const marginTop = this.customSettings?.pdf_margin_top || 20
      const marginLeft = this.customSettings?.pdf_margin_left || 15
      
      // Ajustar posição inicial baseado no cabeçalho personalizado
      let yPosition = this.customSettings?.pdf_header_enabled ? marginTop + 40 : marginTop + 25

      // Título
      this.pdf.setFontSize(18)
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.setTextColor('#000000')
      this.pdf.text(`Ordem de Serviço - Manutenção Preventiva`, marginLeft, yPosition)
      yPosition += 15

      // Informações do equipamento
      this.pdf.setFontSize(12)
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text('Informações do Equipamento:', marginLeft, yPosition)
      yPosition += 8

      this.pdf.setFontSize(10)
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.text(`Equipamento: ${data.equipmentName || data.equipment_name || 'N/A'}`, marginLeft, yPosition)
      yPosition += 5
      this.pdf.text(`Código/Patrimônio: ${data.equipmentCode || data.equipment_code || 'N/A'}`, marginLeft, yPosition)
      yPosition += 5
      this.pdf.text(`Setor: ${data.sectorName || data.sector_name || 'N/A'}`, marginLeft, yPosition)
      yPosition += 10

      // Informações da manutenção
      this.pdf.setFontSize(12)
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text('Informações da Manutenção:', marginLeft, yPosition)
      yPosition += 8

      this.pdf.setFontSize(10)
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.text(`Plano: ${data.planName || data.plan_name || 'N/A'}`, marginLeft, yPosition)
      yPosition += 5
      this.pdf.text(`Tipo: ${data.maintenanceType || data.type || 'N/A'}`, marginLeft, yPosition)
      yPosition += 5
      this.pdf.text(`Prioridade: ${data.priority || 'N/A'}`, marginLeft, yPosition)
      yPosition += 5
      this.pdf.text(`Status: ${data.status || 'N/A'}`, marginLeft, yPosition)
      yPosition += 5
      this.pdf.text(`Frequência: ${data.frequency || 'N/A'}`, marginLeft, yPosition)
      yPosition += 5
      // Formatar data agendada no padrão brasileiro
      const scheduledDate = data.scheduledDate || data.nextDueDate || data.scheduled_date || data.next_due_date
      const formattedScheduledDate = scheduledDate ? formatDateBR(scheduledDate) : 'N/A'
      this.pdf.text(`Data Agendada: ${formattedScheduledDate}`, marginLeft, yPosition)
      yPosition += 5

      this.pdf.text(`Duração Estimada: ${data.estimatedDuration || data.estimated_duration || 'N/A'} min`, marginLeft, yPosition)
      yPosition += 5

      // Formatar custo estimado no padrão brasileiro (R$)
      const estimatedCost = data.estimatedCost || data.estimated_cost
      const formattedCost = estimatedCost ? formatCurrency(parseFloat(estimatedCost)) : 'R$ 0,00'
      this.pdf.text(`Custo Estimado: ${formattedCost}`, marginLeft, yPosition)
      yPosition += 10

      // Descrição
      this.pdf.setFontSize(12)
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text('Descrição:', marginLeft, yPosition)
      yPosition += 8

      this.pdf.setFontSize(10)
      this.pdf.setFont('helvetica', 'normal')
      const description = data.description || 'Sem descrição'
      const descriptionLines = this.pdf.splitTextToSize(description, 180)
      this.pdf.text(descriptionLines, marginLeft, yPosition)
      yPosition += descriptionLines.length * 5 + 10

      // Responsáveis
      this.pdf.setFontSize(12)
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text('Responsáveis:', marginLeft, yPosition)
      yPosition += 8

      this.pdf.setFontSize(10)
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.text(`Técnico Atribuído: ${data.assignedTechnicianName || data.assigned_technician_name || 'Não atribuído'}`, marginLeft, yPosition)
      yPosition += 5
      this.pdf.text(`Empresa: ${data.assignedCompanyName || data.assigned_company_name || 'Não atribuído'}`, marginLeft, yPosition)
      yPosition += 10

      // Observações
      if (data.notes) {
        this.pdf.setFontSize(12)
        this.pdf.setFont('helvetica', 'bold')
        this.pdf.text('Observações:', marginLeft, yPosition)
        yPosition += 8

        this.pdf.setFontSize(10)
        this.pdf.setFont('helvetica', 'normal')
        const notesLines = this.pdf.splitTextToSize(data.notes, 180)
        this.pdf.text(notesLines, marginLeft, yPosition)
        yPosition += notesLines.length * 5 + 10
      }

      // Assinaturas
      yPosition += 20
      this.pdf.setFontSize(10)
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.text('_________________________________', marginLeft, yPosition)
      yPosition += 5
      this.pdf.text('Técnico Responsável', marginLeft, yPosition)
      
      this.pdf.text('_________________________________', 110, yPosition - 5)
      this.pdf.text('Supervisor', 110, yPosition)

      // Adicionar rodapé personalizado ou padrão
      this.addFooter(1, 1)

      console.log('PDF de manutenção preventiva gerado com sucesso')
      return new Uint8Array(this.pdf.output('arraybuffer'))
    } catch (error) {
      console.error('Erro ao gerar PDF da manutenção preventiva:', error)
      throw new Error(`Erro ao gerar PDF: ${error.message}`)
    }
  }

  // Obter PDF como array buffer
  getArrayBuffer(): Uint8Array {
    return new Uint8Array(this.pdf.output('arraybuffer'))
  }

  // Gerar PDF de preview com configurações personalizadas
  async generatePreviewPDF(data: any): Promise<Uint8Array> {
    try {
      console.log('🎨 Gerando PDF de preview com configurações personalizadas...')
      
      // Carregar configurações personalizadas
      await this.loadCustomSettings()
      
      // Aplicar margens personalizadas
      this.applyCustomMargins()
      
      // Dados de exemplo para o preview
      const previewData = {
        order_number: 'OS-PREVIEW-001',
        equipment: {
          name: 'Equipamento de Exemplo',
          model: 'Modelo XYZ-123',
          serial_number: 'SN123456789',
          location: 'Setor A - Sala 101',
          sector: 'Manutenção',
          subsector: 'Equipamentos Médicos'
        },
        company: {
          name: 'Empresa Exemplo Ltda',
          contact: 'João Silva',
          phone: '(11) 99999-9999',
          email: 'contato@exemplo.com'
        },
        description: 'Este é um exemplo de descrição de ordem de serviço para demonstrar como o PDF ficará com as configurações personalizadas aplicadas.',
        priority: 'ALTA',
        status: 'ABERTA',
        requested_date: new Date().toISOString().split('T')[0],
        scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        cost: 1500.00,
        type: 'PREVENTIVA',
        observations: 'Observações de exemplo para demonstrar o layout do PDF personalizado.',
        created_by_name: 'Usuário Exemplo',
        assigned_to_name: 'Técnico Exemplo'
      }
      
      console.log('📋 Dados de exemplo preparados para preview')
      
      // Gerar PDF usando a mesma estrutura da ordem de serviço
      return await this.generateServiceOrderPDF(previewData)
      
    } catch (error) {
      console.error('❌ Erro ao gerar PDF de preview:', error)
      throw new Error(`Erro ao gerar preview do PDF: ${error.message}`)
    }
  }

  // Gerar PDF de agendamento de manutenção
  async generateMaintenanceSchedulePDF(data: any): Promise<Uint8Array> {
    try {
      console.log('Iniciando geração de PDF para agendamento de manutenção:', data.id)

      // Carregar configurações personalizadas primeiro
      await this.loadCustomSettings()
      await this.loadTemplate('preventive-maintenance')

      // Aplicar margens personalizadas
      this.applyCustomMargins()

      // Adicionar cabeçalho personalizado ou padrão
      this.addHeader()

      const marginTop = this.customSettings?.pdf_margin_top || 20
      const marginLeft = this.customSettings?.pdf_margin_left || 15

      // Ajustar posição inicial baseado no cabeçalho personalizado
      let yPosition = this.customSettings?.pdf_header_enabled ? marginTop + 40 : marginTop + 25

      // Título
      this.pdf.setFontSize(18)
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.setTextColor('#000000')
      this.pdf.text(`Agendamento de Manutenção`, marginLeft, yPosition)
      yPosition += 15

      // Informações do equipamento
      this.pdf.setFontSize(12)
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text('Informações do Equipamento:', marginLeft, yPosition)
      yPosition += 8

      this.pdf.setFontSize(10)
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.text(`Equipamento: ${data.equipment_name || 'N/A'}`, marginLeft, yPosition)
      yPosition += 5
      this.pdf.text(`Código/Patrimônio: ${data.equipment_code || 'N/A'}`, marginLeft, yPosition)
      yPosition += 5
      if (data.sector_name) {
        this.pdf.text(`Setor: ${data.sector_name}`, marginLeft, yPosition)
        yPosition += 5
      }
      yPosition += 5

      // Informações do agendamento
      this.pdf.setFontSize(12)
      this.pdf.setFont('helvetica', 'bold')
      this.pdf.text('Informações do Agendamento:', marginLeft, yPosition)
      yPosition += 8

      this.pdf.setFontSize(10)
      this.pdf.setFont('helvetica', 'normal')

      if (data.maintenance_plan_name) {
        this.pdf.text(`Plano de Manutenção: ${data.maintenance_plan_name}`, marginLeft, yPosition)
        yPosition += 5
      }

      this.pdf.text(`Prioridade: ${data.priority || 'N/A'}`, marginLeft, yPosition)
      yPosition += 5
      this.pdf.text(`Status: ${data.status || 'N/A'}`, marginLeft, yPosition)
      yPosition += 5

      // Formatar data agendada no padrão brasileiro
      const scheduledDate = data.scheduled_date
      const formattedScheduledDate = scheduledDate ? formatDateBR(scheduledDate) : 'N/A'
      this.pdf.text(`Data Agendada: ${formattedScheduledDate}`, marginLeft, yPosition)
      yPosition += 5

      if (data.estimated_duration) {
        this.pdf.text(`Duração Estimada: ${data.estimated_duration} min`, marginLeft, yPosition)
        yPosition += 5
      }
      yPosition += 5

      // Descrição
      if (data.description) {
        this.pdf.setFontSize(12)
        this.pdf.setFont('helvetica', 'bold')
        this.pdf.text('Descrição:', marginLeft, yPosition)
        yPosition += 8

        this.pdf.setFontSize(10)
        this.pdf.setFont('helvetica', 'normal')
        const description = data.description
        const descriptionLines = this.pdf.splitTextToSize(description, 180)
        this.pdf.text(descriptionLines, marginLeft, yPosition)
        yPosition += descriptionLines.length * 5 + 10
      }

      // Responsável
      if (data.user_name) {
        this.pdf.setFontSize(12)
        this.pdf.setFont('helvetica', 'bold')
        this.pdf.text('Responsável:', marginLeft, yPosition)
        yPosition += 8

        this.pdf.setFontSize(10)
        this.pdf.setFont('helvetica', 'normal')
        this.pdf.text(`Técnico Atribuído: ${data.user_name}`, marginLeft, yPosition)
        yPosition += 10
      }

      // Assinaturas
      yPosition += 20
      this.pdf.setFontSize(10)
      this.pdf.setFont('helvetica', 'normal')
      this.pdf.text('_________________________________', marginLeft, yPosition)
      yPosition += 5
      this.pdf.text('Técnico Responsável', marginLeft, yPosition)

      this.pdf.text('_________________________________', 110, yPosition - 5)
      this.pdf.text('Supervisor', 110, yPosition)

      // Adicionar rodapé personalizado ou padrão
      this.addFooter(1, 1)

      console.log('PDF de agendamento de manutenção gerado com sucesso')
      return new Uint8Array(this.pdf.output('arraybuffer'))
    } catch (error) {
      console.error('Erro ao gerar PDF do agendamento de manutenção:', error)
      throw new Error(`Erro ao gerar PDF: ${error.message}`)
    }
  }
}