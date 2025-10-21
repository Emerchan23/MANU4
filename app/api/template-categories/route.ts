import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
}

// GET - Buscar todas as categorias de templates
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const active = searchParams.get('active')

    const offset = (page - 1) * limit

    const connection = await mysql.createConnection(dbConfig)

    // Construir condições WHERE dinamicamente
    let whereConditions = []
    let queryParams: any[] = []

    if (search) {
      whereConditions.push('(ct.nome LIKE ? OR ct.descricao LIKE ?)')
      const searchTerm = `%${search}%`
      queryParams.push(searchTerm, searchTerm)
    }

    // Coluna 'active' removida - não existe na tabela template_categories

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Query para contar total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM categorias_templates ct
      ${whereClause}
    `

    const [countResult] = await connection.execute(countQuery, queryParams)
    const totalRecords = Array.isArray(countResult) && countResult.length > 0 
      ? (countResult[0] as any).total 
      : 0

    // Query principal com paginação e contagem de templates
    const mainQuery = `
      SELECT 
        ct.id,
        ct.nome as name,
        ct.descricao as description,
        ct.cor as color,
        ct.icone as icon,
        ct.ativo as active,
        ct.criado_em as created_at,
        ct.atualizado_em as updated_at,
        COUNT(st.id) as template_count
      FROM categorias_templates ct
      LEFT JOIN service_description_templates st ON ct.id = st.category_id AND st.is_active = 1
      ${whereClause}
      GROUP BY ct.id, ct.nome, ct.descricao, ct.cor, ct.icone, ct.ativo, ct.criado_em, ct.atualizado_em
      ORDER BY ct.nome ASC
      LIMIT ? OFFSET ?
    `

    const [rows] = await connection.execute(mainQuery, [...queryParams, limit, offset])

    await connection.end()

    const totalPages = Math.ceil(totalRecords / limit)

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    })
  } catch (error) {
    console.error('Erro ao buscar categorias de templates:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova categoria de template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      color = '#3B82F6'
    } = body

    // Validações básicas
    if (!name) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    const connection = await mysql.createConnection(dbConfig)

    // Verificar se já existe uma categoria com o mesmo nome
    const [existing] = await connection.execute(
      'SELECT id FROM categorias_templates WHERE nome = ?',
      [name]
    )

    if ((existing as any[]).length > 0) {
      await connection.end()
      return NextResponse.json(
        { error: 'Já existe uma categoria com este nome' },
        { status: 409 }
      )
    }

    // Inserir nova categoria
    const [result] = await connection.execute(`
      INSERT INTO categorias_templates (
        nome, descricao, cor, icone, ativo, criado_em, atualizado_em
      ) VALUES (?, ?, ?, 'folder', 1, NOW(), NOW())
    `, [
      name,
      description || null,
      color
    ])

    const insertId = (result as any).insertId

    // Buscar a categoria criada
    const [newCategory] = await connection.execute(`
      SELECT 
        ct.id,
        ct.nome as name,
        ct.descricao as description,
        ct.cor as color,
        ct.icone as icon,
        ct.ativo as active,
        ct.criado_em as created_at,
        ct.atualizado_em as updated_at,
        COUNT(st.id) as template_count
      FROM categorias_templates ct
      LEFT JOIN service_description_templates st ON ct.id = st.category_id AND st.is_active = 1
      WHERE ct.id = ?
      GROUP BY ct.id, ct.nome, ct.descricao, ct.cor, ct.icone, ct.ativo, ct.criado_em, ct.atualizado_em
    `, [insertId])

    await connection.end()

    return NextResponse.json((newCategory as any)[0], { status: 201 })
  } catch (error) {
    console.error('Erro ao criar categoria de template:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar categoria de template
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const {
      id,
      name,
      description,
      color
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID da categoria é obrigatório' },
        { status: 400 }
      )
    }

    const connection = await mysql.createConnection(dbConfig)

    // Verificar se a categoria existe
    const [existing] = await connection.execute(
      'SELECT id FROM categorias_templates WHERE id = ?',
      [id]
    )

    if ((existing as any[]).length === 0) {
      await connection.end()
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se já existe outra categoria com o mesmo nome
    if (name) {
      const [nameCheck] = await connection.execute(
        'SELECT id FROM categorias_templates WHERE nome = ? AND id != ?',
        [name, id]
      )

      if ((nameCheck as any[]).length > 0) {
        await connection.end()
        return NextResponse.json(
          { error: 'Já existe uma categoria com este nome' },
          { status: 409 }
        )
      }
    }

    // Construir query de atualização dinamicamente
    const updateFields = []
    const updateValues = []

    if (name !== undefined) {
      updateFields.push('nome = ?')
      updateValues.push(name)
    }
    if (description !== undefined) {
      updateFields.push('descricao = ?')
      updateValues.push(description)
    }
    if (color !== undefined) {
      updateFields.push('cor = ?')
      updateValues.push(color)
    }

    // Sempre atualizar atualizado_em
    updateFields.push('atualizado_em = NOW()')
    updateValues.push(id)

    if (updateFields.length === 1) { // Apenas updated_at
      await connection.end()
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      )
    }

    // Executar atualização
    await connection.execute(
      `UPDATE categorias_templates SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )

    // Buscar categoria atualizada
    const [updatedCategory] = await connection.execute(`
      SELECT 
        ct.id,
        ct.nome as name,
        ct.descricao as description,
        ct.cor as color,
        ct.icone as icon,
        ct.ativo as active,
        ct.criado_em as created_at,
        ct.atualizado_em as updated_at,
        COUNT(st.id) as template_count
      FROM categorias_templates ct
      LEFT JOIN service_description_templates st ON ct.id = st.category_id AND st.is_active = 1
      WHERE ct.id = ?
      GROUP BY ct.id, ct.nome, ct.descricao, ct.cor, ct.icone, ct.ativo, ct.criado_em, ct.atualizado_em
    `, [id])

    await connection.end()

    return NextResponse.json((updatedCategory as any)[0])
  } catch (error) {
    console.error('Erro ao atualizar categoria de template:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir categoria de template
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID da categoria é obrigatório' },
        { status: 400 }
      )
    }

    const connection = await mysql.createConnection(dbConfig)

    // Verificar se a categoria existe
    const [existing] = await connection.execute(
      'SELECT id, nome as name FROM categorias_templates WHERE id = ?',
      [id]
    )

    if ((existing as any[]).length === 0) {
      await connection.end()
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se existem templates usando esta categoria
    const [templatesUsing] = await connection.execute(
      'SELECT COUNT(*) as count FROM service_description_templates WHERE category_id = ?',
      [id]
    )

    const templateCount = (templatesUsing as any)[0].count

    if (templateCount > 0) {
      await connection.end()
      return NextResponse.json(
        { 
          error: `Não é possível excluir a categoria. Existem ${templateCount} template${templateCount > 1 ? 's' : ''} vinculado${templateCount > 1 ? 's' : ''} a esta categoria.`,
          templateCount: templateCount,
          canDelete: false
        },
        { status: 409 }
      )
    }

    // Excluir categoria
    await connection.execute(
      'DELETE FROM categorias_templates WHERE id = ?',
      [id]
    )

    await connection.end()

    return NextResponse.json({
      success: true,
      message: 'Categoria excluída com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir categoria de template:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}