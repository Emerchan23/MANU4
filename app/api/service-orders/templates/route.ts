import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database.js'

// GET - Listar templates de serviço
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const maintenanceType = searchParams.get('maintenanceType')
    const categoryId = searchParams.get('categoryId')
    const active = searchParams.get('active')

    // Construir query com filtros
    let whereConditions = []
    let queryParams = []

    if (maintenanceType) {
      whereConditions.push('st.maintenance_type = ?')
      queryParams.push(maintenanceType)
    }

    if (categoryId) {
      whereConditions.push('st.category_id = ?')
      queryParams.push(categoryId)
    }

    if (active !== null && active !== undefined) {
      whereConditions.push('st.is_active = ?')
      queryParams.push(active === 'true' ? 1 : 0)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    const templatesQuery = `
      SELECT 
        st.*,
        tc.name as category_name,
        tc.description as category_description
      FROM service_templates st
      LEFT JOIN template_categories tc ON st.category_id = tc.id
      ${whereClause}
      ORDER BY tc.name, st.name
    `

    const templates = await query(templatesQuery, queryParams)

    return NextResponse.json({
      success: true,
      data: templates
    })

  } catch (error) {
    console.error('Erro ao buscar templates:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      categoryId,
      name,
      descriptionTemplate,
      maintenanceType,
      estimatedCost = 0
    } = body

    // Validações obrigatórias
    if (!categoryId || !name || !descriptionTemplate || !maintenanceType) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      )
    }

    // Inserir template
    const insertQuery = `
      INSERT INTO service_templates (
        category_id, name, description_template, maintenance_type, estimated_cost
      ) VALUES (?, ?, ?, ?, ?)
    `

    const result = await query(insertQuery, [
      categoryId,
      name,
      descriptionTemplate,
      maintenanceType,
      estimatedCost
    ])

    // Buscar template criado
    const createdTemplate = await query(`
      SELECT 
        st.*,
        tc.name as category_name
      FROM service_templates st
      LEFT JOIN template_categories tc ON st.category_id = tc.id
      WHERE st.id = ?
    `, [result.insertId])

    return NextResponse.json({
      success: true,
      data: createdTemplate[0],
      message: 'Template criado com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao criar template:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}