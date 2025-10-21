import { NextRequest, NextResponse } from 'next/server';
import { createConnection } from '../../../../../lib/db';

// Função para converter hex para RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

// Interface para configurações PDF
interface PDFSettings {
  pdf_header_enabled?: boolean;
  pdf_header_text?: string;
  pdf_footer_enabled?: boolean;
  pdf_footer_text?: string;
  pdf_logo_enabled?: boolean;
  pdf_company_name?: string;
  pdf_company_address?: string;
  pdf_show_date?: boolean;
  pdf_show_page_numbers?: boolean;
  pdf_margin_top?: number;
  pdf_margin_bottom?: number;
  pdf_margin_left?: number;
  pdf_margin_right?: number;
  pdf_primary_color?: string;
  pdf_secondary_color?: string;
  pdf_text_color?: string;
  pdf_background_color?: string;
  pdf_signature_enabled?: boolean;
  pdf_signature_field1_text?: string;
  pdf_signature_field2_text?: string;
}

// Função para carregar configurações PDF do banco
async function loadPDFSettings(connection: any): Promise<PDFSettings> {
  try {
    const [settings] = await connection.execute(`
      SELECT setting_key, setting_value 
      FROM system_settings 
      WHERE setting_key LIKE 'pdf_%'
    `);

    const pdfSettings: PDFSettings = {};
    
    // Configurações padrão
    const defaults: PDFSettings = {
      pdf_header_enabled: true,
      pdf_header_text: 'ORDEM DE SERVIÇO',
      pdf_footer_enabled: true,
      pdf_footer_text: 'Documento gerado automaticamente pelo sistema',
      pdf_logo_enabled: false,
      pdf_company_name: 'MANUTENÇÃO INDUSTRIAL LTDA',
      pdf_company_address: 'Rua das Indústrias, 1000 - Distrito Industrial - São Paulo/SP - CEP: 01234-567',
      pdf_show_date: true,
      pdf_show_page_numbers: true,
      pdf_margin_top: 20,
      pdf_margin_bottom: 20,
      pdf_margin_left: 15,
      pdf_margin_right: 15,
      pdf_primary_color: '#1e40af',
      pdf_secondary_color: '#3b82f6',
      pdf_text_color: '#1f2937',
      pdf_background_color: '#ffffff',
      pdf_signature_enabled: true,
      pdf_signature_field1_text: 'Responsável pela Execução',
      pdf_signature_field2_text: 'Supervisor/Aprovador'
    };

    // Aplicar configurações padrão
    Object.assign(pdfSettings, defaults);

    // Sobrescrever com configurações do banco
    if (Array.isArray(settings)) {
      settings.forEach((setting: any) => {
        try {
          let value = setting.setting_value;
          
          // Tentar fazer parse JSON para valores complexos
          try {
            value = JSON.parse(value);
          } catch {
            // Se não for JSON, manter como string
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else if (!isNaN(Number(value)) && value !== '') value = Number(value);
          }
          
          pdfSettings[setting.setting_key as keyof PDFSettings] = value;
        } catch (error) {
          console.error(`Erro ao processar configuração ${setting.setting_key}:`, error);
        }
      });
    }

    return pdfSettings;
  } catch (error) {
    console.error('Erro ao carregar configurações PDF:', error);
    // Retornar configurações padrão em caso de erro
    return {
      pdf_header_enabled: true,
      pdf_header_text: 'ORDEM DE SERVIÇO',
      pdf_footer_enabled: true,
      pdf_footer_text: 'Documento gerado automaticamente pelo sistema',
      pdf_logo_enabled: false,
      pdf_company_name: 'MANUTENÇÃO INDUSTRIAL LTDA',
      pdf_company_address: 'Rua das Indústrias, 1000 - Distrito Industrial - São Paulo/SP - CEP: 01234-567',
      pdf_show_date: true,
      pdf_show_page_numbers: true,
      pdf_margin_top: 20,
      pdf_margin_bottom: 20,
      pdf_margin_left: 15,
      pdf_margin_right: 15,
      pdf_primary_color: '#1e40af',
      pdf_secondary_color: '#3b82f6',
      pdf_text_color: '#1f2937',
      pdf_background_color: '#ffffff',
      pdf_signature_enabled: true,
      pdf_signature_field1_text: 'Responsável pela Execução',
      pdf_signature_field2_text: 'Supervisor/Aprovador'
    };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log('🔄 Iniciando geração de PDF para ordem:', id);

    if (!id) {
      console.log('❌ ID da ordem não fornecido');
      return NextResponse.json(
        { error: 'ID da ordem de serviço é obrigatório' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    console.log('🔌 Conectando ao banco de dados...');
    const connection = await createConnection();
    console.log('✅ Conexão com banco estabelecida');

    try {
      // Carregar configurações PDF personalizadas
      console.log('⚙️ Carregando configurações PDF...');
      const pdfSettings = await loadPDFSettings(connection);
      console.log('✅ Configurações PDF carregadas:', pdfSettings);

      // Buscar dados da ordem de serviço
      console.log('🔍 Buscando dados da ordem de serviço...');
      const [rows] = await connection.execute(`
        SELECT 
          so.*,
          e.name as equipment_name,
          e.model as equipment_model,
          e.serial_number as equipment_serial,
          emp.name as company_name,
          emp.cnpj as company_cnpj,
          emp.address as company_address,
          u.name as assigned_to_name
        FROM service_orders so
        LEFT JOIN equipment e ON so.equipment_id = e.id
        LEFT JOIN companies emp ON so.company_id = emp.id
        LEFT JOIN users u ON so.assigned_to = u.id
        WHERE so.id = ?
      `, [id]);

      if (!Array.isArray(rows) || rows.length === 0) {
        console.log('❌ Ordem de serviço não encontrada para ID:', id);
        return NextResponse.json(
          { error: 'Ordem de serviço não encontrada' },
          { status: 404 }
        );
      }

      const order = rows[0] as any;
      console.log('✅ Ordem encontrada:', order.id, order.order_number);

      // Criar PDF usando jsPDF
      console.log('📄 Criando documento PDF...');
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      console.log('✅ Documento PDF criado');
      
      // Configurar fonte padrão
      doc.setFont('helvetica');
      
      // CORES PERSONALIZÁVEIS BASEADAS NAS CONFIGURAÇÕES
      const COLORS = {
        BLUE_HEADER: pdfSettings.pdf_primary_color || '#1e40af',      // Cor primária personalizada
        BLUE_ACCENT: pdfSettings.pdf_secondary_color || '#3b82f6',    // Cor secundária personalizada
        GRAY_LIGHT: '#f8f9fa',       // Fundo cinza claro das seções
        GRAY_BORDER: '#e5e7eb',      // Bordas sutis
        TEXT_DARK: pdfSettings.pdf_text_color || '#1f2937',           // Cor do texto personalizada
        TEXT_MEDIUM: '#6b7280',      // Texto médio
        WHITE: pdfSettings.pdf_background_color || '#ffffff'          // Cor de fundo personalizada
      };

      // Função para desenhar retângulos com segurança
      const safeRect = (x: number, y: number, width: number, height: number, style?: string) => {
        try {
          doc.rect(x, y, width, height, style);
        } catch (error) {
          console.log('Fallback para desenho manual:', error);
          if (style === 'F') {
            const currentFillColor = doc.getFillColor();
            doc.setDrawColor(currentFillColor);
            doc.setLineWidth(0.1);
            for (let i = 0; i < height; i += 0.5) {
              doc.line(x, y + i, x + width, y + i);
            }
          } else {
            doc.line(x, y, x + width, y);
            doc.line(x + width, y, x + width, y + height);
            doc.line(x + width, y + height, x, y + height);
            doc.line(x, y + height, x, y);
          }
        }
      };

      // Função para texto com segurança
      const safeText = (text: string, x: number, y: number, options?: any) => {
        try {
          if (options) {
            doc.text(text, x, y, options);
          } else {
            doc.text(text, x, y);
          }
        } catch (error) {
          console.log('Erro no texto:', error);
          doc.text(String(text || ''), Number(x) || 0, Number(y) || 0);
        }
      };

      let yPos = 0;

      // Carregar logo personalizado se habilitado
      let logoImage = null;
      if (pdfSettings.pdf_logo_enabled) {
        try {
          console.log('🔍 Buscando logo no banco de dados...');
          const logoQuery = await connection.execute(
            'SELECT * FROM logo_uploads WHERE is_active = TRUE ORDER BY uploaded_at DESC LIMIT 1'
          );
          
          console.log('📊 Resultado da query:', logoQuery[0]);
          
          if (logoQuery[0].length > 0) {
            const logo = logoQuery[0][0];
            console.log('🖼️ Logo encontrado:', logo);
            
            const fs = require('fs');
            const path = require('path');
            const logoPath = path.join(process.cwd(), 'public', logo.file_path);
            
            console.log('📁 Caminho do logo:', logoPath);
            console.log('✅ Arquivo existe?', fs.existsSync(logoPath));
            
            if (fs.existsSync(logoPath)) {
              const imageBuffer = fs.readFileSync(logoPath);
              const base64Image = imageBuffer.toString('base64');
              
              // Detectar tipo MIME corretamente incluindo SVG
              let mimeType = 'image/png'; // padrão
              if (logo.file_path.endsWith('.png')) {
                mimeType = 'image/png';
              } else if (logo.file_path.endsWith('.jpg') || logo.file_path.endsWith('.jpeg')) {
                mimeType = 'image/jpeg';
              } else if (logo.file_path.endsWith('.svg')) {
                mimeType = 'image/svg+xml';
              }
              
              logoImage = `data:${mimeType};base64,${base64Image}`;
              console.log('🎯 Logo carregado com sucesso! Tipo:', mimeType);
            } else {
              console.error('❌ Arquivo de logo não encontrado:', logoPath);
            }
          } else {
            console.log('⚠️ Nenhum logo ativo encontrado no banco');
          }
        } catch (error) {
          console.error('💥 Erro ao carregar logo:', error);
        }
      } else {
        console.log('🚫 Logo desabilitado nas configurações');
      }

      // ===== CABEÇALHO PERSONALIZADO COM LAYOUT DE 3 COLUNAS =====
      // Sempre mostrar cabeçalho (removendo condição)
      {
        const headerHeight = 50; // Altura otimizada do cabeçalho
        
        // Fundo azul do cabeçalho
        const blueRgb = hexToRgb(COLORS.BLUE_HEADER);
        doc.setFillColor(blueRgb[0], blueRgb[1], blueRgb[2]);
        safeRect(0, 0, 210, headerHeight, 'F');
        
        // ===== COLUNA 1: LOGO (LADO ESQUERDO) =====
        if (logoImage) {
          try {
            console.log('🖼️ Tentando adicionar logo ao PDF...');
            console.log('📊 Dados do logo:', {
              tamanho: logoImage.length,
              tipo: logoImage.substring(0, 50),
              isSVG: logoImage.includes('image/svg+xml'),
              isPNG: logoImage.includes('image/png'),
              isJPEG: logoImage.includes('image/jpeg')
            });
            
            // FORÇAR SEMPRE COMO PNG - jsPDF tem problemas com SVG
            let format = 'PNG';
            let processedImage = logoImage;
            
            // Se for SVG, tentar converter ou usar fallback
            if (logoImage.includes('image/svg+xml')) {
              console.log('⚠️ SVG detectado - jsPDF pode ter problemas');
              console.log('🔄 Tentando forçar como PNG...');
              format = 'PNG';
              // Remover o tipo SVG e forçar PNG
              processedImage = logoImage.replace('data:image/svg+xml;base64,', 'data:image/png;base64,');
            }
            
            // Logo posicionado no canto superior esquerdo com tamanho maior
            doc.addImage(processedImage, format, 10, 10, 30, 30); // Logo 30x30px
            console.log('✅ Logo adicionado com sucesso ao PDF!');
          } catch (error) {
            console.error('💥 Erro ao adicionar logo ao PDF:', error);
            console.error('📊 Detalhes do erro:', error.message);
            
            // Fallback: tentar diferentes formatos
            try {
              console.log('🔄 Tentando fallback como PNG...');
              const pngImage = logoImage.replace(/data:image\/[^;]+;base64,/, 'data:image/png;base64,');
              doc.addImage(pngImage, 'PNG', 10, 10, 30, 30);
              console.log('✅ Logo adicionado com fallback PNG!');
            } catch (fallbackError) {
              console.error('💥 Falha total ao adicionar logo:', fallbackError);
              
              // Último recurso: desenhar um placeholder
              console.log('🎨 Desenhando placeholder do logo...');
              doc.setFillColor(255, 255, 255);
              doc.setDrawColor(200, 200, 200);
              safeRect(10, 10, 30, 30, 'FD');
              doc.setTextColor(100, 100, 100);
              doc.setFontSize(8);
              safeText('LOGO', 25, 27);
            }
          }
        } else {
          console.log('⚠️ logoImage está null - desenhando placeholder');
          // Desenhar placeholder quando não há logo
          doc.setFillColor(240, 240, 240);
          doc.setDrawColor(200, 200, 200);
          safeRect(10, 10, 30, 30, 'FD');
          doc.setTextColor(150, 150, 150);
          doc.setFontSize(8);
          safeText('LOGO', 25, 27);
        }
        
        // ===== COLUNA 2: NOME DA EMPRESA (CENTRO) =====
        const pageWidth = 210; // Largura da página A4
        const centerX = pageWidth / 2; // Centro da página
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        
        // Nome da empresa centralizado
        const companyName = pdfSettings.pdf_company_name || 'FUNDO MUN SAUDE DE CHAPADÃO DO CÉU';
        
        // Quebrar o nome da empresa em linhas se necessário
        const maxWidth = 120; // Largura máxima para o texto centralizado
        const companyNameLines = doc.splitTextToSize(companyName, maxWidth);
        
        // Calcular posição Y inicial baseada no número de linhas
        const lineHeight = 5;
        const totalTextHeight = companyNameLines.length * lineHeight;
        let startY = (headerHeight / 2) - (totalTextHeight / 2) + 10;
        
        // Desenhar cada linha centralizada
        companyNameLines.forEach((line: string) => {
          const textWidth = doc.getTextWidth(line);
          const textX = centerX - (textWidth / 2);
          safeText(line, textX, startY);
          startY += lineHeight;
        });
        
        // ===== COLUNA 3: NÚMERO DA OS (LADO DIREITO) =====
        const osNumber = order.order_number || `OS-${String(order.id).padStart(3, '0')}/2025`;
        
        // Caixa branca para o número da OS
        doc.setFillColor(255, 255, 255);
        safeRect(160, 10, 45, 25, 'F');
        
        // Borda sutil na caixa
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        safeRect(160, 10, 45, 25, 'S');
        
        // Label "NÚMERO OS"
        doc.setTextColor(blueRgb[0], blueRgb[1], blueRgb[2]);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        safeText('NÚMERO OS', 162, 18);
        
        // Número da OS em destaque
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        safeText(osNumber, 162, 28);
        
        yPos = headerHeight + 15;
      }

      // ===== SEÇÃO DADOS DA EMPRESA =====
      const blueRgb = hexToRgb(COLORS.BLUE_HEADER);
      doc.setTextColor(blueRgb[0], blueRgb[1], blueRgb[2]);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      safeText('DADOS DA EMPRESA', 15, yPos);
      
      // Linha divisória simples
      const borderRgb = hexToRgb(COLORS.GRAY_BORDER);
      doc.setDrawColor(borderRgb[0], borderRgb[1], borderRgb[2]);
      doc.setLineWidth(0.5);
      doc.line(15, yPos + 2, 195, yPos + 2);
      
      yPos += 10;
      
      // Dados da empresa sem retângulos - usando configurações personalizadas
      const textDarkRgb = hexToRgb(COLORS.TEXT_DARK);
      doc.setTextColor(textDarkRgb[0], textDarkRgb[1], textDarkRgb[2]);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      
      safeText('Razão Social:', 15, yPos);
      doc.setFont('helvetica', 'normal');
      safeText(order.company_name || pdfSettings.pdf_company_name || 'MANUTENÇÃO INDUSTRIAL LTDA', 50, yPos);
      
      yPos += 6;
      doc.setFont('helvetica', 'bold');
      safeText('CNPJ:', 15, yPos);
      doc.setFont('helvetica', 'normal');
      safeText(order.company_cnpj || '12.345.678/0001-90', 35, yPos);
      
      yPos += 6;
      doc.setFont('helvetica', 'bold');
      safeText('Endereço:', 15, yPos);
      doc.setFont('helvetica', 'normal');
      safeText(order.company_address || pdfSettings.pdf_company_address || 'Rua das Indústrias, 1000 - Distrito Industrial - São Paulo/SP - CEP: 01234-567', 45, yPos);
      
      yPos += 15;

      // ===== SEÇÃO EQUIPAMENTO =====
      doc.setTextColor(blueRgb[0], blueRgb[1], blueRgb[2]);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      safeText('EQUIPAMENTO', 15, yPos);
      
      // Linha divisória simples
      doc.setDrawColor(borderRgb[0], borderRgb[1], borderRgb[2]);
      doc.setLineWidth(0.5);
      doc.line(15, yPos + 2, 195, yPos + 2);
      
      yPos += 12;
      
      // Layout limpo em grid sem retângulos - apenas texto bem organizado
      doc.setTextColor(textDarkRgb[0], textDarkRgb[1], textDarkRgb[2]);
      doc.setFontSize(9);
      
      // Primeira linha: Nome do Equipamento | Nº Patrimônio
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100); // Cor mais suave para labels
      safeText('NOME DO EQUIPAMENTO', 15, yPos);
      safeText('Nº PATRIMÔNIO', 110, yPos);
      
      yPos += 4;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textDarkRgb[0], textDarkRgb[1], textDarkRgb[2]);
      safeText(order.equipment_name || 'Compressor de Ar Industrial', 15, yPos);
      safeText(order.equipment_patrimonio || 'PAT.2023-0456', 110, yPos);
      
      yPos += 10;
      
      // Segunda linha: Setor | Subsetor
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      safeText('SETOR', 15, yPos);
      safeText('SUBSETOR', 110, yPos);
      
      yPos += 4;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textDarkRgb[0], textDarkRgb[1], textDarkRgb[2]);
      safeText(order.sector_name || 'Produção', 15, yPos);
      safeText(order.subsector_name || 'Linha de Montagem A', 110, yPos);
      
      yPos += 15;

      // ===== SEÇÃO DETALHES DA ORDEM DE SERVIÇO =====
      doc.setTextColor(blueRgb[0], blueRgb[1], blueRgb[2]);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      safeText('DETALHES DA ORDEM DE SERVIÇO', 15, yPos);
      
      // Linha divisória simples
      doc.setDrawColor(borderRgb[0], borderRgb[1], borderRgb[2]);
      doc.setLineWidth(0.5);
      doc.line(15, yPos + 2, 195, yPos + 2);
      
      yPos += 12;
      
      // Layout limpo em grid - 3 colunas organizadas
      doc.setTextColor(100, 100, 100); // Cor suave para labels
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      
      safeText('TIPO DE MANUTENÇÃO', 15, yPos);
      safeText('DATA AGENDAMENTO', 75, yPos);
      safeText('CUSTO ESTIMADO', 135, yPos);
      
      yPos += 4;
      
      // Valores das colunas
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textDarkRgb[0], textDarkRgb[1], textDarkRgb[2]);
      
      const maintenanceType = order.type || 'Preventiva';
      const scheduledDate = order.scheduled_date ? new Date(order.scheduled_date).toLocaleDateString('pt-BR') : '15/01/2024';
      const estimatedCost = order.cost ? `R$ ${Number(order.cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 1.850,00';
      
      safeText(maintenanceType, 15, yPos);
      safeText(scheduledDate, 75, yPos);
      safeText(estimatedCost, 135, yPos);
      
      yPos += 12;
      
      // Campo Responsável
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      safeText('RESPONSÁVEL', 15, yPos);
      
      yPos += 4;
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textDarkRgb[0], textDarkRgb[1], textDarkRgb[2]);
      safeText(order.assigned_to_name || 'João Silva Santos', 15, yPos);
      
      yPos += 12;
      
      // Descrição do Serviço
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      safeText('DESCRIÇÃO DO SERVIÇO', 15, yPos);
      
      yPos += 4;
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textDarkRgb[0], textDarkRgb[1], textDarkRgb[2]);
      const description = order.description || 'Realizar manutenção preventiva completa do compressor de ar, incluindo verificação de pressão, lubrificação de componentes móveis, inspeção de correias e filtros, verificação do sistema elétrico e teste de funcionamento conforme manual do fabricante.';
      
      // Quebrar texto em linhas com espaçamento otimizado
      const lines = doc.splitTextToSize(description, 170);
      let lineY = yPos;
      for (let i = 0; i < lines.length && i < 4; i++) {
        safeText(lines[i], 15, lineY);
        lineY += 4.5;
      }
      
      yPos = lineY + 8;
      
      // Observações
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      safeText('OBSERVAÇÕES', 15, yPos);
      
      yPos += 4;
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textDarkRgb[0], textDarkRgb[1], textDarkRgb[2]);
      const observations = order.observations || 'Equipamento crítico para a linha de produção. Agendar manutenção preferencialmente no período noturno ou fim de semana para não impactar a produção.';
      
      const obsLines = doc.splitTextToSize(observations, 170);
      lineY = yPos;
      for (let i = 0; i < obsLines.length && i < 3; i++) {
        safeText(obsLines[i], 15, lineY);
        lineY += 4.5;
      }
      
      yPos = lineY + 15;

      // ===== RODAPÉ COM ASSINATURAS PERSONALIZÁVEIS =====
      // Verificar se deve mostrar campos de assinatura
      if (pdfSettings.pdf_signature_enabled) {
        // Linha separadora elegante
        doc.setDrawColor(borderRgb[0], borderRgb[1], borderRgb[2]);
        doc.setLineWidth(0.5);
        doc.line(15, yPos - 5, 195, yPos - 5);
        
        yPos += 10;
        
        const signatureWidth = 80;
        const spacing = 100; // Espaçamento entre os campos
        
        // Primeira assinatura (personalizável)
        doc.setTextColor(textDarkRgb[0], textDarkRgb[1], textDarkRgb[2]);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        const field1Text = pdfSettings.pdf_signature_field1_text || 'Responsável pela Execução';
        safeText(field1Text, 15, yPos);
        
        // Segunda assinatura (personalizável)
        const field2Text = pdfSettings.pdf_signature_field2_text || 'Supervisor/Aprovador';
        safeText(field2Text, 15 + spacing, yPos);
        
        yPos += 15;
        
        // Linhas para assinatura - design mais limpo
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(0.3);
        doc.line(15, yPos, 15 + signatureWidth, yPos);
        doc.line(15 + spacing, yPos, 15 + spacing + signatureWidth, yPos);
        
        yPos += 8;
        
        // Texto "Assinatura e Data" - mais discreto
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(120, 120, 120);
        safeText('Assinatura e Data', 15, yPos);
        safeText('Assinatura e Data', 15 + spacing, yPos);
      }

      // Adicionar rodapé personalizado se habilitado
      if (pdfSettings.pdf_footer_enabled) {
        const pageHeight = 297; // A4 height in mm
        const footerY = pageHeight - 15;
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        
        // Texto do rodapé centralizado
        const footerText = pdfSettings.pdf_footer_text || 'Documento gerado automaticamente pelo sistema';
        const textWidth = doc.getTextWidth(footerText);
        const centerX = (210 - textWidth) / 2;
        safeText(footerText, centerX, footerY);
        
        // Data de geração se habilitada
        if (pdfSettings.pdf_show_date) {
          const currentDate = new Date().toLocaleDateString('pt-BR');
          safeText(`Gerado em: ${currentDate}`, 15, footerY);
        }
        
        // Número da página se habilitado
        if (pdfSettings.pdf_show_page_numbers) {
          safeText('Página 1 de 1', 170, footerY);
        }
      }

      // Gerar o PDF
      console.log('🎯 Gerando buffer do PDF...');
      const pdfBuffer = doc.output('arraybuffer');
      const osNumber = order.order_number || `${String(order.id).padStart(5, '0')}/2024`;
      const filename = `OS-${osNumber}.pdf`;
      console.log('✅ PDF gerado com sucesso:', filename, 'Tamanho:', pdfBuffer.byteLength, 'bytes');

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': pdfBuffer.byteLength.toString(),
        },
      });

    } finally {
      await connection.end();
    }

  } catch (error) {
    console.error('💥 ERRO CRÍTICO ao gerar PDF:', error);
    console.error('Stack trace:', error.stack);
    console.error('ID da ordem:', params.id);
    return NextResponse.json(
      { error: 'Erro interno do servidor ao gerar PDF', details: error.message },
      { status: 500 }
    );
  }
}