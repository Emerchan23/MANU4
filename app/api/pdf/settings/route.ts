import { NextRequest, NextResponse } from 'next/server'
import { query } from '../../../../lib/database.js'

// GET /api/pdf/settings - Buscar configurações PDF
export async function GET(request: NextRequest) {
  try {
    // Buscar configurações da nova tabela
    const settings = await query(
      'SELECT * FROM pdf_settings_enhanced WHERE is_active = TRUE ORDER BY id DESC LIMIT 1'
    )
    
    if (settings.length === 0) {
      // Se não há configurações, criar uma padrão
      await query(`
        INSERT INTO pdf_settings_enhanced (
          header_title, header_subtitle, company_name, 
          company_cnpj, company_address
        ) VALUES (?, ?, ?, ?, ?)
      `, [
        'ORDEM DE SERVIÇO',
        'Sistema de Manutenção',
        'FUNDO MUNICIPAL DE SAÚDE DE CHAPADÃO DO CÉU',
        '07.729.810/0001-22',
        'Chapadão do Céu - GO'
      ])
      
      // Buscar novamente
      const newSettings = await query(
        'SELECT * FROM pdf_settings_enhanced WHERE is_active = TRUE ORDER BY id DESC LIMIT 1'
      )
      
      return NextResponse.json({
        success: true,
        settings: newSettings[0] || {}
      })
    }
    
    return NextResponse.json({
      success: true,
      settings: settings[0]
    })
  } catch (error) {
    console.error('Erro ao buscar configurações PDF:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/pdf/settings - Salvar configurações PDF
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { settings } = body
    
    if (!settings) {
      return NextResponse.json(
        { error: 'Configurações não fornecidas' },
        { status: 400 }
      )
    }
    
    // Verificar se já existe uma configuração ativa
    const existingSettings = await query(
      'SELECT id FROM pdf_settings_enhanced WHERE is_active = TRUE LIMIT 1'
    )
    
    if (existingSettings.length > 0) {
      // Atualizar configuração existente
      const updateFields = []
      const updateValues = []
      
      // Mapear campos permitidos
      const allowedFields = [
        'header_enabled', 'header_title', 'header_subtitle', 'header_bg_color',
        'header_text_color', 'header_height', 'header_font_size', 'header_subtitle_font_size',
        'logo_enabled', 'logo_position', 'logo_width', 'logo_height', 
        'logo_margin_x', 'logo_margin_y',
        'company_name', 'company_cnpj', 'company_address', 'company_phone', 'company_email',
        'footer_enabled', 'footer_text', 'footer_bg_color', 'footer_text_color', 'footer_height',
        'show_date', 'show_page_numbers', 'margin_top', 'margin_bottom', 
        'margin_left', 'margin_right',
        'primary_color', 'secondary_color', 'text_color', 'border_color', 'background_color',
        'signature_enabled', 'signature_field1_label', 'signature_field2_label'
      ]
      
      allowedFields.forEach(field => {
        if (settings.hasOwnProperty(field)) {
          updateFields.push(`${field} = ?`)
          updateValues.push(settings[field])
        }
      })
      
      if (updateFields.length > 0) {
        updateValues.push(existingSettings[0].id)
        
        await query(
          `UPDATE pdf_settings_enhanced SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          updateValues
        )
      }
    } else {
      // Criar nova configuração
      const fields = Object.keys(settings).filter(key => 
        ['header_enabled', 'header_title', 'header_subtitle', 'header_bg_color',
         'header_text_color', 'header_height', 'header_font_size', 'header_subtitle_font_size',
         'logo_enabled', 'logo_position', 'logo_width', 'logo_height', 
         'logo_margin_x', 'logo_margin_y',
         'company_name', 'company_cnpj', 'company_address', 'company_phone', 'company_email',
         'footer_enabled', 'footer_text', 'footer_bg_color', 'footer_text_color', 'footer_height',
         'show_date', 'show_page_numbers', 'margin_top', 'margin_bottom', 
         'margin_left', 'margin_right',
         'primary_color', 'secondary_color', 'text_color', 'border_color', 'background_color',
         'signature_enabled', 'signature_field1_label', 'signature_field2_label'].includes(key)
      )
      
      const values = fields.map(field => settings[field])
      const placeholders = fields.map(() => '?').join(', ')
      
      await query(
        `INSERT INTO pdf_settings_enhanced (${fields.join(', ')}) VALUES (${placeholders})`,
        values
      )
    }
    
    // Buscar configurações atualizadas
    const updatedSettings = await query(
      'SELECT * FROM pdf_settings_enhanced WHERE is_active = TRUE ORDER BY id DESC LIMIT 1'
    )
    
    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso',
      settings: updatedSettings[0] || {}
    })
  } catch (error) {
    console.error('Erro ao salvar configurações PDF:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}