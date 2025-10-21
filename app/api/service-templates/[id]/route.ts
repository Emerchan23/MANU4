import { NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
}

// DELETE - Excluir template de serviço por ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'ID do template é obrigatório' },
        { status: 400 }
      )
    }

    const connection = await mysql.createConnection({
      ...dbConfig,
      charset: 'utf8mb4'
    })

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

    // Como não existe relação direta entre service_orders e templates,
    // vamos pular a verificação de dependências por enquanto
    // TODO: Implementar verificação de dependências se necessário no futuro

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

// GET - Buscar template específico por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'ID do template é obrigatório' },
        { status: 400 }
      )
    }

    const connection = await mysql.createConnection({
      ...dbConfig,
      charset: 'utf8mb4'
    })

    const [rows] = await connection.execute(`
      SELECT 
        st.id,
        st.name,
        st.description,
        st.content,
        st.category_id,
        st.is_active as active,
        st.created_at,
        st.updated_at,
        ct.nome as category_name,
        ct.cor as category_color
      FROM service_description_templates st
      LEFT JOIN categorias_templates ct ON st.category_id = ct.id
      WHERE st.id = ?
    `, [id])

    await connection.end()

    if ((rows as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Template não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: (rows as any)[0]
    })
  } catch (error) {
    console.error('Erro ao buscar template de serviço:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar template específico por ID
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    // Ler o body da requisição usando método alternativo para evitar conflito
    let body;
    try {
      const bodyText = await request.text();
      body = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('❌ Erro ao processar body:', parseError);
      return NextResponse.json(
        { success: false, error: 'Dados inválidos na requisição' },
        { status: 400 }
      );
    }
    const {
      name,
      description,
      content,
      category_id,
      active
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID do template é obrigatório' },
        { status: 400 }
      )
    }

    const connection = await mysql.createConnection({
      ...dbConfig,
      charset: 'utf8mb4'
    })

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
    if (content !== undefined) {
      updateFields.push('content = ?')
      updateValues.push(content)
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

    // Definir charset UTF-8 para a conexão
    await connection.execute('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci')
    
    // Executar atualização
    await connection.execute(
      `UPDATE service_description_templates SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    )

    // Buscar o template atualizado
    const [updatedTemplate] = await connection.execute(`
      SELECT 
        st.id,
        CONVERT(st.name USING utf8mb4) as name,
        CONVERT(st.description USING utf8mb4) as description,
        CONVERT(st.content USING utf8mb4) as content,
        st.category_id,
        st.is_active as active,
        st.created_at,
        st.updated_at,
        CONVERT(ct.nome USING utf8mb4) as category_name,
        ct.cor as category_color
      FROM service_description_templates st
      LEFT JOIN categorias_templates ct ON st.category_id = ct.id
      WHERE st.id = ?
    `, [id])

    await connection.end()

    return NextResponse.json({
      success: true,
      data: (updatedTemplate as any)[0]
    })
  } catch (error) {
    console.error('Erro ao atualizar template de serviço:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}