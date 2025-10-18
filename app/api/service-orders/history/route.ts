import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database.js'
import { formatDateBR, formatDateISO } from '@/lib/date-utils-br'

// GET - Buscar histórico de manutenção
export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG: Iniciando busca do histórico ===')
    const { searchParams } = new URL(request.url)
    const equipmentId = searchParams.get('equipmentId')
    const serviceOrderId = searchParams.get('serviceOrderId')
    const equipmentName = searchParams.get('equipment_name')
    const patrimonyNumber = searchParams.get('patrimony_number')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    console.log('DEBUG: Parâmetros recebidos:', { equipmentId, serviceOrderId, equipmentName, patrimonyNumber, page, limit, offset })

    // Construir query com filtros
    let whereConditions = []
    let queryParams = []

    if (equipmentId) {
      whereConditions.push('so.equipment_id = ?')
      queryParams.push(equipmentId)
    }

    if (serviceOrderId) {
      whereConditions.push('mh.service_order_id = ?')
      queryParams.push(serviceOrderId)
    }

    if (equipmentName) {
      whereConditions.push('e.name LIKE ?')
      queryParams.push(`%${equipmentName}%`)
    }

    if (patrimonyNumber) {
      whereConditions.push('e.patrimonio LIKE ?')
      queryParams.push(`%${patrimonyNumber}%`)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''
    console.log('DEBUG: whereClause:', whereClause)
    console.log('DEBUG: queryParams inicial:', queryParams)

    // Query para contar total de registros - incluindo ordens concluídas
    let countWhereConditions = []
    let countParams = []

    // Construir condições para a segunda parte do UNION (ordens concluídas)
    if (equipmentId) {
      countWhereConditions.push('so.equipment_id = ?')
      countParams.push(equipmentId)
    }

    if (equipmentName) {
      countWhereConditions.push('e.name LIKE ?')
      countParams.push(`%${equipmentName}%`)
    }

    if (patrimonyNumber) {
      countWhereConditions.push('e.patrimonio LIKE ?')
      countParams.push(`%${patrimonyNumber}%`)
    }

    const countWhereClause = countWhereConditions.length > 0 ? `AND ${countWhereConditions.join(' AND ')}` : ''

    const countQuery = `
      SELECT COUNT(*) as total FROM (
        SELECT mh.id
        FROM maintenance_history mh
        LEFT JOIN service_orders so ON mh.service_order_id = so.id
        LEFT JOIN equipment e ON so.equipment_id = e.id
        ${whereClause}
        
        UNION ALL
        
        SELECT so.id
        FROM service_orders so
        LEFT JOIN equipment e ON so.equipment_id = e.id
        WHERE so.status IN ('concluida', 'finalizada', 'completed') 
          AND so.completion_date IS NOT NULL
          ${countWhereClause}
      ) as combined_history
    `

    // Preparar parâmetros para contagem - duplicar os parâmetros para ambas as partes do UNION
    let finalCountParams = [...queryParams, ...countParams]

    console.log('DEBUG: countQuery:', countQuery)
    console.log('DEBUG: finalCountParams:', finalCountParams)

    const countResult = await query(countQuery, finalCountParams)
    console.log('DEBUG: countResult:', countResult)
    const total = countResult[0].total

    // Query principal com paginação - UNION entre maintenance_history e service_orders concluídas
    const historyQuery = `
      SELECT 
        mh.id,
        mh.service_order_id,
        mh.description,
        mh.execution_date,
        mh.performed_by,
        mh.cost,
        mh.observations,
        mh.created_by,
        mh.created_at,
        mh.updated_at,
        so.order_number,
        so.type as maintenance_type,
        so.priority,
        so.status as order_status,
        e.name as equipment_name,
        e.model as equipment_model,
        c.name as company_name,
        u1.name as performed_by_name,
        u2.name as created_by_name,
        'manual' as source_type
      FROM maintenance_history mh
      LEFT JOIN service_orders so ON mh.service_order_id = so.id
      LEFT JOIN equipment e ON so.equipment_id = e.id
      LEFT JOIN companies c ON so.company_id = c.id
      LEFT JOIN users u1 ON mh.performed_by = u1.id
      LEFT JOIN users u2 ON mh.created_by = u2.id
      ${whereClause.replace('so.equipment_id', 'so.equipment_id')}
      
      UNION ALL
      
      SELECT 
        so.id as id,
        so.id as service_order_id,
        so.description,
        so.completion_date as execution_date,
        so.assigned_to as performed_by,
        so.cost,
        so.observations,
        so.created_by,
        so.created_at,
        so.updated_at,
        so.order_number,
        so.type as maintenance_type,
        so.priority,
        so.status as order_status,
        e.name as equipment_name,
        e.model as equipment_model,
        c.name as company_name,
        u1.name as performed_by_name,
        u2.name as created_by_name,
        'completed_order' as source_type
      FROM service_orders so
      LEFT JOIN equipment e ON so.equipment_id = e.id
      LEFT JOIN companies c ON so.company_id = c.id
      LEFT JOIN users u1 ON so.assigned_to = u1.id
      LEFT JOIN users u2 ON so.created_by = u2.id
      WHERE so.status IN ('concluida', 'finalizada', 'completed') 
        AND so.completion_date IS NOT NULL
        ${countWhereClause}
      
      ORDER BY execution_date DESC, created_at DESC
      LIMIT ? OFFSET ?
    `

    // Adicionar parâmetros para a segunda parte do UNION
    queryParams.push(...countParams)
    queryParams.push(limit, offset)
    
    console.log('DEBUG: historyQuery:', historyQuery)
    console.log('DEBUG: queryParams final:', queryParams)
    
    const history = await query(historyQuery, queryParams)
    console.log('DEBUG: history result:', history)

    // Formatar datas
    const formattedHistory = history.map(item => ({
      ...item,
      execution_date: formatDateBR(item.execution_date),
      created_at: formatDateBR(item.created_at),
      updated_at: formatDateBR(item.updated_at)
    }))

    return NextResponse.json({
      success: true,
      data: formattedHistory,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Erro ao buscar histórico:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Adicionar entrada no histórico
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      serviceOrderId,
      description,
      executionDate,
      performedBy,
      cost = 0,
      observations = '',
      createdBy
    } = body

    // Validações obrigatórias
    if (!serviceOrderId || !description || !executionDate || !performedBy || !createdBy) {
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      )
    }

    // Verificar se a ordem de serviço existe
    const orderExists = await query('SELECT id FROM service_orders WHERE id = ?', [serviceOrderId])
    
    if (orderExists.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      )
    }

    // Inserir entrada no histórico
    const insertQuery = `
      INSERT INTO maintenance_history (
        service_order_id, description, execution_date, performed_by, cost, observations, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `

    const result = await query(insertQuery, [
      serviceOrderId,
      description,
      formatDateISO(new Date(executionDate)),
      performedBy,
      cost,
      observations,
      createdBy
    ])

    // Buscar entrada criada
    const createdEntry = await query(`
      SELECT 
        mh.*,
        so.order_number,
        u1.name as performed_by_name,
        u2.name as created_by_name
      FROM maintenance_history mh
      LEFT JOIN service_orders so ON mh.service_order_id = so.id
      LEFT JOIN users u1 ON mh.performed_by = u1.id
      LEFT JOIN users u2 ON mh.created_by = u2.id
      WHERE mh.id = ?
    `, [result.insertId])

    const entry = createdEntry[0]

    // Formatar datas
    const formattedEntry = {
      ...entry,
      execution_date: formatDateBR(entry.execution_date),
      created_at: formatDateBR(entry.created_at),
      updated_at: formatDateBR(entry.updated_at)
    }

    return NextResponse.json({
      success: true,
      data: formattedEntry,
      message: 'Entrada adicionada ao histórico com sucesso!'
    })

  } catch (error) {
    console.error('Erro ao adicionar entrada no histórico:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}