import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database.js'
import jsPDF from 'jspdf'
import path from 'path'
import fs from 'fs'

// Configurações padrão
function getDefaultSettings() {
  return {
    header_enabled: true,
    header_title: 'Sistema de Manutenção',
    header_subtitle: 'Ordem de Serviço',
    header_bg_color: '#2563eb',
    header_text_color: '#ffffff',
    header_height: 80,
    header_font_size: 18,
    header_subtitle_font_size: 14,
    logo_enabled: true,
    logo_position: 'left',
    logo_width: 60,
    logo_height: 60,
    logo_margin_x: 20,
    logo_margin_y: 20,
    company_name: 'Empresa Exemplo',
    company_cnpj: '00.000.000/0001-00',
    company_address: 'Endereço da Empresa',
    company_phone: '(11) 0000-0000',
    company_email: 'contato@empresa.com',
    footer_enabled: true,
    footer_text: 'Documento gerado automaticamente pelo sistema',
    footer_bg_color: '#f3f4f6',
    footer_text_color: '#374151',
    footer_height: 40,
    show_date: true,
    show_page_numbers: true,
    margin_top: 20,
    margin_bottom: 20,
    margin_left: 20,
    margin_right: 20,
    primary_color: '#2563eb',
    secondary_color: '#64748b',
    text_color: '#1f2937',
    border_color: '#d1d5db',
    background_color: '#ffffff'
  }
}

function getDefaultCompany() {
  return {
    name: 'Empresa Exemplo',
    cnpj: '00.000.000/0001-00',
    address: 'Endereço da Empresa',
    phone: '(11) 0000-0000',
    email: 'contato@empresa.com'
  }
}

// Função para desenhar o cabeçalho (usando o mesmo estilo da API real)
function drawHeader(doc: jsPDF, settings: any, company: any, logo: any) {
  // Função auxiliar para converter hex para RGB
  function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [30, 64, 175]; // Azul padrão
  }

  // Função auxiliar para desenhar retângulos seguros
  function safeRect(x: number, y: number, w: number, h: number, style?: string) {
    try {
      doc.rect(x, y, w, h, style);
    } catch (error) {
      console.error('Erro ao desenhar retângulo:', error);
    }
  }

  // Função auxiliar para texto seguro
  function safeText(text: string, x: number, y: number) {
    try {
      doc.text(text, x, y);
    } catch (error) {
      console.error('Erro ao adicionar texto:', error);
    }
  }

  // Layout: Logo circular à esquerda | Nome da empresa e CNPJ centralizados | Número OS à direita
  const headerHeight = 60; // Altura aumentada para acomodar o layout
  
  // Fundo colorido do cabeçalho usando cor personalizada
  const primaryColor = settings.pdf_primary_color || settings.primary_color || '#1e40af';
  const headerRgb = hexToRgb(primaryColor);
  doc.setFillColor(headerRgb[0], headerRgb[1], headerRgb[2]);
  safeRect(0, 0, 210, headerHeight, 'F');
  
  // ===== LOGO CIRCULAR NO CANTO ESQUERDO =====
  if (logo && logo.logo_data) {
    try {
      console.log('🖼️ Adicionando logo circular...');
      
      // FORÇAR SEMPRE COMO PNG - jsPDF tem problemas com SVG
      let format = 'PNG';
      let processedImage = `data:image/png;base64,${logo.logo_data}`;
      
      // Se for SVG, tentar converter ou usar fallback
      if (logo.logo_data.includes('image/svg+xml')) {
        console.log('⚠️ SVG detectado - convertendo para PNG...');
        format = 'PNG';
        processedImage = logo.logo_data.replace('data:image/svg+xml;base64,', 'data:image/png;base64,');
      }
      
      // Criar fundo circular branco para o logo (versão limpa)
      const logoX = 15;
      const logoY = 10;
      const logoSize = 40;
      
      // Fundo circular sólido e limpo
      doc.setFillColor(255, 255, 255);
      safeRect(logoX, logoY, logoSize, logoSize, 'F');
      
      // Borda circular sólida (opcional - mais limpa)
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(1);
      safeRect(logoX, logoY, logoSize, logoSize, 'S');
      
      // Adicionar logo dentro do círculo
      doc.addImage(processedImage, format, logoX + 3, logoY + 3, logoSize - 6, logoSize - 6);
      console.log('✅ Logo circular adicionado!');
    } catch (error) {
      console.error('💥 Erro ao adicionar logo:', error);
      
      // Fallback: círculo com texto
      doc.setFillColor(255, 255, 255);
      safeRect(15, 10, 40, 40, 'F');
      doc.setDrawColor(200, 200, 200);
      safeRect(15, 10, 40, 40, 'S');
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      safeText('LOGO', 35, 32);
    }
  } else {
    // Placeholder circular para logo
    doc.setFillColor(255, 255, 255);
    safeRect(15, 10, 40, 40, 'F');
    doc.setDrawColor(200, 200, 200);
    safeRect(15, 10, 40, 40, 'S');
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(10);
    safeText('LOGO', 35, 32);
  }
  
  // ===== NOME DA EMPRESA E CNPJ CENTRALIZADOS =====
  const pageWidth = 210;
  const centerX = pageWidth / 2;
  
  // Nome da empresa (grande e destacado) - PRIORIDADE: dados da aba Empresa
  const companyName = settings.company_name || company?.name || settings.pdf_company_name || 'EMPRESA NÃO CONFIGURADA';
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  
  // Quebrar nome da empresa em linhas se necessário
  const maxCompanyWidth = 120;
  const companyLines = doc.splitTextToSize(companyName, maxCompanyWidth);
  
  // Posicionar nome da empresa
  let companyY = 20;
  companyLines.forEach((line: string) => {
    const textWidth = doc.getTextWidth(line);
    const textX = centerX - (textWidth / 2);
    safeText(line, textX, companyY);
    companyY += 5;
  });
  
  // CNPJ da empresa (abaixo do nome) - PRIORIDADE: dados da aba Empresa
  const companyCNPJ = settings.company_cnpj || company?.cnpj || '00.000.000/0000-00';
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const cnpjText = `CNPJ: ${companyCNPJ}`;
  const cnpjWidth = doc.getTextWidth(cnpjText);
  const cnpjX = centerX - (cnpjWidth / 2);
  safeText(cnpjText, cnpjX, companyY + 5);
  
  // ===== CAIXA DESTACADA PARA NÚMERO DA OS (DIREITA) =====
  const osNumber = 'OS-PREVIEW-001';
  
  // Caixa de fundo claro para o número da OS
  doc.setFillColor(240, 248, 255); // Azul muito claro
  safeRect(150, 8, 55, 44, 'F');
  
  // Borda da caixa
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  safeRect(150, 8, 55, 44, 'S');
  
  // Label "NÚMERO OS" - com mais destaque
  doc.setTextColor(40, 40, 40); // Cor mais escura para melhor contraste
  doc.setFontSize(10); // Fonte maior para mais destaque
  doc.setFont('helvetica', 'bold'); // Negrito para mais destaque
  const labelText = 'NÚMERO OS';
  const labelWidth = doc.getTextWidth(labelText);
  const labelX = 177 - (labelWidth / 2); // Centralizar o texto
  safeText(labelText, labelX, 20);
  
  // Número da OS em destaque
  doc.setTextColor(30, 30, 30); // Cor mais escura para melhor legibilidade
  doc.setFontSize(16); // Fonte um pouco maior
  doc.setFont('helvetica', 'bold');
  const osNumberText = osNumber.toString();
  const osNumberWidth = doc.getTextWidth(osNumberText);
  const osNumberX = 177 - (osNumberWidth / 2);
  safeText(osNumberText, osNumberX, 38); // Posição ajustada para dar mais espaço
}

// Função para desenhar o conteúdo
function drawContent(doc: jsPDF, sampleData: any, settings: any, startY: number = 100) {
  let currentY = startY
  
  // Título do documento
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(settings.text_color || '#000000')
  doc.setFontSize(16)
  doc.text('Preview do Documento PDF', doc.internal.pageSize.getWidth() / 2, currentY, { align: 'center' })
  
  currentY += 30
  
  // Informações do exemplo
  if (sampleData) {
    const fields = [
      { label: 'Número:', value: sampleData.numero || 'N/A' },
      { label: 'Data:', value: sampleData.data || 'N/A' },
      { label: 'Cliente:', value: sampleData.cliente || 'N/A' },
      { label: 'Equipamento:', value: sampleData.equipamento || 'N/A' },
      { label: 'Técnico:', value: sampleData.tecnico || 'N/A' }
    ]
    
    fields.forEach(field => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(settings.secondary_color || '#666666')
      doc.text(field.label, 20, currentY)
      
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(settings.text_color || '#000000')
      doc.text(field.value, 80, currentY)
      
      currentY += 15
    })
    
    // Descrição
    if (sampleData.descricao) {
      currentY += 10
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(settings.secondary_color || '#666666')
      doc.text('Descrição:', 20, currentY)
      
      currentY += 15
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(settings.text_color || '#000000')
      
      const descLines = doc.splitTextToSize(sampleData.descricao, doc.internal.pageSize.getWidth() - 40)
      doc.text(descLines, 20, currentY)
      currentY += descLines.length * 6 + 20
    }
    
    // Observações
    if (sampleData.observacoes) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(settings.secondary_color || '#666666')
      doc.text('Observações:', 20, currentY)
      
      currentY += 15
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(settings.text_color || '#000000')
      
      const obsLines = doc.splitTextToSize(sampleData.observacoes, doc.internal.pageSize.getWidth() - 40)
      doc.text(obsLines, 20, currentY)
    }
  }
}

// Função para desenhar o rodapé
function drawFooter(doc: jsPDF, settings: any) {
  const pageHeight = doc.internal.pageSize.getHeight()
  const footerHeight = settings.footer_height || 40
  const footerY = pageHeight - footerHeight
  
  // Fundo do rodapé
  if (settings.footer_bg_color) {
    doc.setFillColor(settings.footer_bg_color)
    doc.rect(0, footerY, doc.internal.pageSize.getWidth(), footerHeight, 'F')
  }
  
  // Texto do rodapé
  if (settings.footer_text) {
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(settings.footer_text_color || '#000000')
    doc.setFontSize(10)
    doc.text(settings.footer_text, doc.internal.pageSize.getWidth() / 2, footerY + 15, { align: 'center' })
  }
  
  // Data (se habilitada)
  if (settings.show_date) {
    const currentDate = new Date().toLocaleDateString('pt-BR')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(`Gerado em: ${currentDate}`, 20, footerY + 5)
  }
  
  // Número da página (se habilitado)
  if (settings.show_page_numbers) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Página 1', doc.internal.pageSize.getWidth() - 80, footerY + 5, { align: 'right' })
  }
}

// POST /api/pdf/preview - Gerar preview do PDF
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { settings, companyData, logoData, sampleData } = body

    // Carregar configurações do banco se não fornecidas
    let pdfSettings = settings
    let company = companyData
    let logo = logoData

    if (!pdfSettings || !company) {
      try {
        if (!pdfSettings) {
          const settingsRows = await query(
            'SELECT * FROM pdf_settings_enhanced WHERE is_active = TRUE ORDER BY id DESC LIMIT 1'
          )
          pdfSettings = settingsRows.length > 0 ? settingsRows[0] : getDefaultSettings()
        }

        if (!company) {
          const companyRows = await query(
            'SELECT * FROM company_data ORDER BY id DESC LIMIT 1'
          )
          company = companyRows.length > 0 ? companyRows[0] : getDefaultCompany()
        }

        if (!logo) {
          const logoRows = await query(
            'SELECT * FROM company_logos WHERE is_active = 1 ORDER BY id DESC LIMIT 1'
          )
          logo = logoRows.length > 0 ? logoRows[0] : null
        }
      } catch (dbError) {
        console.error('Erro ao carregar dados do banco:', dbError)
        // Usar configurações padrão em caso de erro
        pdfSettings = pdfSettings || getDefaultSettings()
        company = company || getDefaultCompany()
      }
    }

    // Criar documento PDF com jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    })

    // Desenhar cabeçalho
    if (pdfSettings.header_enabled) {
      drawHeader(doc, pdfSettings, company, logo)
    }

    // Desenhar conteúdo (começando após o cabeçalho)
    const headerHeight = 60 // Altura fixa do novo cabeçalho
    drawContent(doc, sampleData, pdfSettings, headerHeight + 20)

    // Rodapé
    if (pdfSettings.footer_enabled) {
      drawFooter(doc, pdfSettings)
    }

    // Converter para base64
    const pdfBase64 = doc.output('datauristring')

    return NextResponse.json({
      success: true,
      pdf: pdfBase64
    })

  } catch (error) {
    console.error('Erro ao gerar preview:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao gerar preview do PDF',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}