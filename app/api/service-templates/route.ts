import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
}

// GET - Buscar todos os templates de serviço
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category_id = searchParams.get('category_id') || ''
    const active = searchParams.get('active')

    const offset = (page - 1) * limit

    const connection = await mysql.createConnection(dbConfig)

    // Construir condições WHERE dinamicamente
    let whereConditions = []
    let queryParams: any[] = []

    if (search) {
      whereConditions.push('(st.name LIKE ? OR st.description LIKE ?)')
      const searchTerm = `%${search}%`
      queryParams.push(searchTerm, searchTerm)
    }

    if (category_id) {
      whereConditions.push('st.category_id = ?')
      queryParams.push(category_id)
    }

    if (active !== null && active !== undefined && active !== '') {
      whereConditions.push('st.is_active = ?')
      queryParams.push(active === 'true' ? 1 : 0)
    } else {
      // Por padrão, retornar apenas templates ativos
      whereConditions.push('st.is_active = 1')
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Query para contar total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM service_description_templates st
      ${whereClause}
    `

    const [countResult] = await connection.execute(countQuery, queryParams)
    const totalRecords = Array.isArray(countResult) && countResult.length > 0 
      ? (countResult[0] as any).total 
      : 0

    // Query principal com paginação
    const mainQuery = `
      SELECT 
        st.id,
        st.name,
        st.description,
        st.content,
        st.category_id,
        st.is_active as active,
        st.created_at,
        st.updated_at,
        NULL as category_name,
        NULL as category_color
      FROM service_description_templates st
      ${whereClause}
      ORDER BY st.name ASC
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
    console.error('Erro ao buscar templates de serviço:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo template de serviço
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      category_id,
      active = true
    } = body

    // Validações básicas
    if (!name || !description) {
      return NextResponse.json(
        { error: 'Nome e descrição são obrigatórios' },
        { status: 400 }
      )
    }

    const connection = await mysql.createConnection(dbConfig)

    // Verificar se já existe um template com o mesmo nome
    const [existing] = await connection.execute(
      'SELECT id FROM service_description_templates WHERE name = ?',
      [name]
    )

    if ((existing as any[]).length > 0) {
      await connection.end()
      return NextResponse.json(
        { error: 'Já existe um template com este nome' },
        { status: 409 }
      )
    }

    // Inserir novo template
    const [result] = await connection.execute(`
      INSERT INTO service_description_templates (
        name, description, category_id, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, NOW(), NOW())
    `, [
      name,
      description,
      category_id || null,
      active ? 1 : 0
    ])

    const insertId = (result as any).insertId

    // Buscar o template criado com dados completos
    const [newTemplate] = await connection.execute(`
      SELECT 
        st.id,
        st.name,
        st.description,
        st.content,
        st.category_id,
        st.is_active as active,
        st.created_at,
        st.updated_at,
        NULL as category_name,
        NULL as category_color
      FROM service_description_templates st
      WHERE st.id = ?
    `, [insertId])

    await connection.end()

    return NextResponse.json((newTemplate as any)[0], { status: 201 })
  } catch (error) {
    console.error('Erro ao criar template de serviço:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar template de serviço
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      name,
      description,
      category_id,
      active
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID do template é obrigatório' },
        { status: 400 }
      )
    }

    const connection = await mysql.createConnection(dbConfig)

    // Verificar se o template existe
    const [existing] = await connection.execute(
      'SELECT id FROM service_description_templates WHERE id = ?',
      [id]
    )

    if ((existing as any[]).length === 0) {
      await connection.end()
      return NextResponse.json(
        { error: 'Template não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se já existe outro template com o mesmo nome
    if (name) {
      const [nameCheck] = await connection.execute(
        'SELECT id FROM service_description_templates WHERE name = ? AND id != ?',
        [name, id]
      )

      if ((nameCheck as any[]).length > 0) {
        await connection.end()
        return NextResponse.json(
          { error: 'Já existe um template com este nome' },
          { status: 409 }
        )
      }
    }

    // Construir query de atualização dinamicamente
    const updateFields = []
    const updateValues = []

    if (name !== undefined) {
      updateFields.push('name = ?')
      updateValues.push(name)
    }
    if (description !== undefined) {
      updateFields.push('description = ?')
      updateValues.push(description)
    }
    if (category_id !== undefined) {
      updateFields.push('category_id = ?')
      updateValues.push(category_id)
    }
    if (active !== undefined) {
      updateFields.push('is_active = ?')
      updateValues.push(active ? 1 : 0)
    }

    // Sempre atualizar updated_at
    updateFields.push('updated_at = NOW()')
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
      `UPDATE service_description_templates SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )

    // Buscar o template atualizado
    const [updatedTemplate] = await connection.execute(`
      SELECT 
        st.id,
        st.name,
        st.description,
        st.content,
        st.category_id,
        st.is_active as active,
        st.created_at,
        st.updated_at,
        NULL as category_name,
        NULL as category_color
      FROM service_description_templates st
      WHERE st.id = ?
    `, [id])

    await connection.end()

    return NextResponse.json((updatedTemplate as any)[0])
  } catch (error) {
    console.error('Erro ao atualizar template de serviço:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir template de serviço
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

    const connection = await mysql.createConnection(dbConfig)

    // Verificar se o template existe
    const [existing] = await connection.execute(
      'SELECT id, name FROM service_description_templates WHERE id = ?',
      [id]
    )

    if ((existing as any[]).length === 0) {
      await connection.end()
      return NextResponse.json(
        { error: 'Template não encontrado' },
        { status: 404 }
      )
    }

    // Excluir template
    await connection.execute(
      'DELETE FROM service_description_templates WHERE id = ?',
      [id]
    )

    await connection.end()

    return NextResponse.json({
      success: true,
      message: 'Template excluído com sucesso'
    })
  } catch (error) {
    console.error('Erro ao excluir template de serviço:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}