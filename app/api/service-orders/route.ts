import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'
import { formatDateBR, formatDateISO, parseISODate } from '@/lib/date-utils-br'
import { generateUniqueServiceOrderNumber } from '@/lib/service-order-utils'

// GET - Listar ordens de serviço com paginação e filtros
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [SERVICE-ORDERS API] Iniciando busca de ordens de serviço...');
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const maintenanceType = searchParams.get('maintenanceType')
    const equipmentId = searchParams.get('equipmentId')
    const companyId = searchParams.get('companyId')
    const search = searchParams.get('search')

    console.log('🔍 [SERVICE-ORDERS API] Parâmetros recebidos:', {
      page, limit, status, priority, maintenanceType, equipmentId, companyId, search
    });

    const offset = (page - 1) * limit

    // Construir query com filtros
    let whereConditions = []
    let queryParams = []

    if (status) {
      whereConditions.push('so.status = ?')
      queryParams.push(status)
    }

    if (priority) {
      whereConditions.push('so.priority = ?')
      queryParams.push(priority)
    }

    if (maintenanceType) {
      whereConditions.push('so.maintenance_type = ?')
      queryParams.push(maintenanceType)
    }

    if (equipmentId) {
      whereConditions.push('so.equipment_id = ?')
      queryParams.push(equipmentId)
    }

    if (companyId) {
      whereConditions.push('so.company_id = ?')
      queryParams.push(companyId)
    }

    if (search) {
      whereConditions.push('(so.order_number LIKE ? OR so.description LIKE ? OR e.name LIKE ? OR c.name LIKE ?)')
      const searchTerm = `%${search}%`
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm)
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''

    // Query principal com joins (inclui setores e subsectores via equipment)
    const mainQuery = `
      SELECT
        so.*,
        e.name as equipment_name,
        e.model as equipment_model,
        e.patrimonio as equipment_patrimonio,
        c.name as company_name,
        s.nome as sector_name,
        ss.name as subsector_name,
        u1.name as created_by_name,
        u2.name as assigned_to_name,
        mt.nome as maintenance_type_name
      FROM service_orders so
      LEFT JOIN equipment e ON so.equipment_id = e.id
      LEFT JOIN companies c ON so.company_id = c.id
      LEFT JOIN setores s ON e.sector_id = s.id
      LEFT JOIN subsectors ss ON e.subsector_id = ss.id
      LEFT JOIN users u1 ON so.created_by = u1.id
      LEFT JOIN users u2 ON so.assigned_to = u2.id
      LEFT JOIN tipos_manutencao mt ON so.maintenance_type_id = mt.id
      ${whereClause}
      ORDER BY so.created_at DESC
      LIMIT ? OFFSET ?
    `

    queryParams.push(limit, offset)

    console.log('🔍 [SERVICE-ORDERS API] Query principal:', mainQuery);
    console.log('🔍 [SERVICE-ORDERS API] Parâmetros da query:', queryParams);

    // Query para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM service_orders so
      LEFT JOIN equipment e ON so.equipment_id = e.id
      LEFT JOIN companies c ON so.company_id = c.id
      ${whereClause}
    `

    const countParams = queryParams.slice(0, -2) // Remove limit e offset

    console.log('🔍 [SERVICE-ORDERS API] Executando queries...');
    const [orders, countResult] = await Promise.all([
      query(mainQuery, queryParams),
      query(countQuery, countParams)
    ])

    console.log('🔍 [SERVICE-ORDERS API] Ordens encontradas:', orders?.length || 0);
    console.log('🔍 [SERVICE-ORDERS API] Total de registros:', countResult[0]?.total || 0);

    const total = countResult[0].total
    const totalPages = Math.ceil(total / limit)

    // Formatar datas para o padrão brasileiro
    const formattedOrders = orders.map(order => ({
      ...order,
      scheduled_date: order.scheduled_date ? formatDateBR(order.scheduled_date) : null,
      completion_date: order.completion_date ? formatDateBR(order.completion_date) : null,
      created_at: order.created_at ? formatDateBR(order.created_at) : null,
      updated_at: order.updated_at ? formatDateBR(order.updated_at) : null
    }))

    console.log('🔍 [SERVICE-ORDERS API] Retornando resposta de sucesso');
    return NextResponse.json({
      success: true,
      data: formattedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('❌ [SERVICE-ORDERS API] Erro ao buscar ordens de serviço:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova ordem de serviço
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [SERVICE ORDER API] Iniciando criação de ordem de serviço')
    
    const body = await request.json()
    console.log('📝 [SERVICE ORDER API] Dados recebidos:', JSON.stringify(body, null, 2))
    
    const {
      equipmentId,
      companyId,
      maintenanceType,
      maintenanceTypeId,
      description,
      priority = 'MEDIA',
      estimatedCost = 0,
      scheduledDate,
      observations,
      createdBy,
      assignedTo,
      templateId
    } = body

    console.log('🔍 [SERVICE ORDER API] Campos extraídos:', {
      equipmentId,
      companyId,
      maintenanceType,
      maintenanceTypeId,
      description,
      priority,
      estimatedCost,
      scheduledDate,
      observations,
      createdBy,
      assignedTo,
      templateId
    })

    console.log('🔍 [SERVICE ORDER API] Campo assignedTo recebido:', assignedTo)
    console.log('🔍 [SERVICE ORDER API] Campo maintenanceTypeId recebido:', maintenanceTypeId)

    // Debug: Mostrar todos os campos recebidos e sua validação
    console.log('🔍 [SERVICE ORDER API DEBUG] Validação detalhada dos campos obrigatórios:')
    console.log('  - equipmentId:', equipmentId, '(tipo:', typeof equipmentId, ', válido:', !!equipmentId, ')')
    console.log('  - companyId:', companyId, '(tipo:', typeof companyId, ', válido:', !!companyId, ')')
    console.log('  - maintenanceType:', maintenanceType, '(tipo:', typeof maintenanceType, ', válido:', !!maintenanceType, ')')
    console.log('  - maintenanceTypeId:', maintenanceTypeId, '(tipo:', typeof maintenanceTypeId, ', válido:', !!maintenanceTypeId, ')')
    console.log('  - description:', description, '(tipo:', typeof description, ', válido:', !!description, ', length:', description?.length || 0, ')')
    console.log('  - createdBy:', createdBy, '(tipo:', typeof createdBy, ', válido:', !!createdBy, ')')

    // Validações obrigatórias - CORRIGIDA: usar maintenanceTypeId ao invés de maintenanceType
    if (!equipmentId || !companyId || !maintenanceTypeId || !description || !createdBy) {
      console.log('❌ [SERVICE ORDER API] Validação falhou - campos obrigatórios:', {
        equipmentId: !!equipmentId,
        companyId: !!companyId,
        maintenanceTypeId: !!maintenanceTypeId,
        description: !!description,
        createdBy: !!createdBy
      })
      return NextResponse.json(
        { success: false, error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      )
    }

    console.log('✅ [SERVICE ORDER API] Validação passou - gerando número da OS')
    
    // Gerar número da OS automaticamente
    const orderNumber = await generateUniqueServiceOrderNumber()
    console.log('📋 [SERVICE ORDER API] Número da OS gerado:', orderNumber)

    // Converter data agendada se fornecida
    const scheduledDateISO = scheduledDate ? formatDateISO(new Date(scheduledDate)) : null
    console.log('📅 [SERVICE ORDER API] Data agendada convertida:', scheduledDateISO)

    // Mapear prioridade para valores da tabela
    const priorityMap = {
      'BAIXA': 'baixa',
      'MEDIA': 'media', 
      'ALTA': 'alta',
      'CRITICA': 'urgente',
      'baixa': 'baixa',
      'media': 'media',
      'alta': 'alta',
      'urgente': 'urgente'
    }
    const mappedPriority = priorityMap[priority] || 'media'

    // Inserir ordem de serviço com campos corretos da tabela
    const insertQuery = `
      INSERT INTO service_orders (
        order_number, equipment_id, company_id, description,
        priority, cost, requested_date, scheduled_date, observations, 
        created_by, assigned_to, type, maintenance_type_id
      ) VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?)
    `

    console.log('💾 [SERVICE ORDER API] Executando INSERT com parâmetros:', [
      orderNumber,
      equipmentId,
      companyId,
      description,
      mappedPriority,
      estimatedCost,
      scheduledDateISO,
      observations,
      createdBy,
      assignedTo,
      maintenanceType,
      maintenanceTypeId
    ])

    const result = await query(insertQuery, [
      orderNumber,
      equipmentId,
      companyId,
      description,
      mappedPriority,
      estimatedCost,
      scheduledDateISO,
      observations,
      createdBy,
      assignedTo,
      maintenanceType,
      maintenanceTypeId
    ])
    
    console.log('✅ [SERVICE ORDER API] INSERT executado com sucesso, ID:', result.insertId)

    console.log('🔍 [SERVICE ORDER API] Buscando ordem criada com dados completos')
    
    // Buscar a ordem criada com dados completos
    const createdOrder = await query(`
      SELECT
        so.*,
        e.name as equipment_name,
        e.patrimonio as equipment_patrimonio,
        c.name as company_name,
        s.nome as sector_name,
        ss.name as subsector_name,
        u1.name as created_by_name,
        u2.name as assigned_to_name,
        mt.nome as maintenance_type_name
      FROM service_orders so
      LEFT JOIN equipment e ON so.equipment_id = e.id
      LEFT JOIN companies c ON so.company_id = c.id
      LEFT JOIN setores s ON e.sector_id = s.id
      LEFT JOIN subsectors ss ON e.subsector_id = ss.id
      LEFT JOIN users u1 ON so.created_by = u1.id
      LEFT JOIN users u2 ON so.assigned_to = u2.id
      LEFT JOIN tipos_manutencao mt ON so.maintenance_type_id = mt.id
      WHERE so.id = ?
    `, [result.insertId])

    console.log('📋 [SERVICE ORDER API] Ordem encontrada:', createdOrder.length > 0 ? 'SIM' : 'NÃO')
    
    const order = createdOrder[0]

    // Formatar datas para resposta
    const formattedOrder = {
      ...order,
      scheduled_date: order.scheduled_date ? formatDateBR(order.scheduled_date) : null,
      completion_date: order.completion_date ? formatDateBR(order.completion_date) : null,
      created_at: formatDateBR(order.created_at),
      updated_at: formatDateBR(order.updated_at)
    }

    console.log('✅ [SERVICE ORDER API] Ordem de serviço criada com sucesso:', orderNumber)

    return NextResponse.json({
      success: true,
      data: formattedOrder,
      message: `Ordem de serviço ${orderNumber} criada com sucesso!`
    })

  } catch (error) {
    console.error('❌ [SERVICE ORDER API] Erro ao criar ordem de serviço:', error)
    console.error('❌ [SERVICE ORDER API] Stack trace:', error.stack)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', details: error.message },
      { status: 500 }
    )
  }
}