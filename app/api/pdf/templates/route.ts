import { NextResponse } from 'next/server'
import { query } from '../../../../lib/database.js'

// GET /api/pdf/templates - Buscar templates PDF
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    
    let sql = 'SELECT * FROM pdf_templates WHERE is_active = TRUE'
    const params: any[] = []
    
    if (type && type !== 'all') {
      sql += ' AND type = ?'
      params.push(type)
    }
    
    sql += ' ORDER BY is_default DESC, created_at DESC'
    
    const templates = await query(sql, params)
    
    return NextResponse.json({
      success: true,
      templates
    })
  } catch (error) {
    console.error('Erro ao buscar templates:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/pdf/templates - Criar novo template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, headerConfig, footerConfig, logoConfig, isDefault } = body
    
    if (!name || !type || !headerConfig || !footerConfig) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, type, headerConfig, footerConfig' },
        { status: 400 }
      )
    }
    
    // Se for template padrão, remover padrão dos outros templates do mesmo tipo
    if (isDefault) {
      await query(
        'UPDATE pdf_templates SET is_default = FALSE WHERE type = ? AND is_default = TRUE',
        [type]
      )
    }
    
    const result = await query(
      `INSERT INTO pdf_templates (name, type, header_config, footer_config, logo_config, is_default)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        type,
        JSON.stringify(headerConfig),
        JSON.stringify(footerConfig),
        logoConfig ? JSON.stringify(logoConfig) : null,
        isDefault || false
      ]
    )
    
    return NextResponse.json({
      success: true,
      message: 'Template criado com sucesso',
      templateId: result.insertId
    })
  } catch (error) {
    console.error('Erro ao criar template:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/pdf/templates - Atualizar template
export async function PUT(request: Request) {
  try {
    // Ler o body da requisição usando método alternativo para evitar conflito
    let body;
    try {
      const bodyText = await request.text();
      body = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('❌ Erro ao processar body:', parseError);
      return NextResponse.json(
        { error: 'Dados inválidos na requisição' },
        { status: 400 }
      );
    }
    const { id, name, headerConfig, footerConfig, logoConfig, isDefault } = body
    
    if (!id || !name || !headerConfig || !footerConfig) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: id, name, headerConfig, footerConfig' },
        { status: 400 }
      )
    }
    
    // Verificar se template existe
    const existing = await query('SELECT type FROM pdf_templates WHERE id = ?', [id])
    if (!existing.length) {
      return NextResponse.json(
        { error: 'Template não encontrado' },
        { status: 404 }
      )
    }
    
    // Se for template padrão, remover padrão dos outros templates do mesmo tipo
    if (isDefault) {
      await query(
        'UPDATE pdf_templates SET is_default = FALSE WHERE type = ? AND id != ? AND is_default = TRUE',
        [existing[0].type, id]
      )
    }
    
    await query(
      `UPDATE pdf_templates 
       SET name = ?, header_config = ?, footer_config = ?, logo_config = ?, is_default = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        name,
        JSON.stringify(headerConfig),
        JSON.stringify(footerConfig),
        logoConfig ? JSON.stringify(logoConfig) : null,
        isDefault || false,
        id
      ]
    )
    
    return NextResponse.json({
      success: true,
      message: 'Template atualizado com sucesso'
    })
  } catch (error) {
    console.error('Erro ao atualizar template:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/pdf/templates - Deletar template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do template é obrigatório' },
        { status: 400 }
      )
    }
    
    // Verificar se template existe e não é padrão
    const existing = await query('SELECT is_default FROM pdf_templates WHERE id = ?', [id])
    if (!existing.length) {
      return NextResponse.json(
        { error: 'Template não encontrado' },
        { status: 404 }
      )
    }
    
    if (existing[0].is_default) {
      return NextResponse.json(
        { error: 'Não é possível deletar template padrão' },
        { status: 400 }
      )
    }
    
    // Soft delete - marcar como inativo
    await query('UPDATE pdf_templates SET is_active = FALSE WHERE id = ?', [id])
    
    return NextResponse.json({
      success: true,
      message: 'Template removido com sucesso'
    })
  } catch (error) {
    console.error('Erro ao deletar template:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}