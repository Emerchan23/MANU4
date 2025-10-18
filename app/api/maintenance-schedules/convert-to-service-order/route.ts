import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import { generateServiceOrderNumber } from '@/lib/service-order-utils'

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  charset: 'utf8mb4',
  timezone: '+00:00',
  connectTimeout: 5000,
  acquireTimeout: 5000,
  timeout: 5000
}

// POST - Converter agendamento em ordem de serviço
export async function POST(request: NextRequest) {
  let connection;
  
  try {
    console.log('🔄 API /api/maintenance-schedules/convert-to-service-order - Iniciando conversão...');
    
    const body = await request.json()
    console.log('📊 Body recebido (raw):', body);
    console.log('📊 Tipo do body:', typeof body);
    console.log('📊 Body é array?', Array.isArray(body));
    
    const { scheduleId, userId } = body

    console.log('📊 Dados extraídos:', { scheduleId, userId, scheduleIdType: typeof scheduleId, userIdType: typeof userId });

    // Validações básicas
    if (!scheduleId) {
      return NextResponse.json(
        { success: false, error: 'ID do agendamento é obrigatório' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Validar se os IDs são números válidos
    const numericScheduleId = parseInt(scheduleId);
    const numericUserId = parseInt(userId);
    
    if (isNaN(numericScheduleId) || isNaN(numericUserId)) {
      return NextResponse.json(
        { success: false, error: 'scheduleId e userId devem ser números válidos' },
        { status: 400 }
      )
    }

    // Criar conexão com o banco
    connection = await mysql.createConnection(dbConfig);
    await connection.beginTransaction();

    console.log('🔍 Buscando dados do agendamento...');

    // Buscar dados do agendamento
    console.log('🔍 Buscando agendamento ID:', numericScheduleId);
    const [scheduleRows] = await connection.execute(`
      SELECT 
        ms.*,
        e.name as equipment_name,
        e.model as equipment_model,
        e.patrimonio as equipment_patrimonio,
        u.full_name as assigned_user_name,
        mp.name as maintenance_plan_name,
        mp.maintenance_type as maintenance_type_name
      FROM maintenance_schedules ms
      LEFT JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN users u ON ms.assigned_user_id = u.id
      LEFT JOIN maintenance_plans mp ON ms.maintenance_plan_id = mp.id
      WHERE ms.id = ?
    `, [numericScheduleId]);

    console.log('📊 Resultado busca agendamento:', { 
      rowsLength: scheduleRows?.length, 
      isArray: Array.isArray(scheduleRows),
      scheduleId: numericScheduleId
    });

    if (!scheduleRows || scheduleRows.length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, error: 'Agendamento não encontrado' },
        { status: 404 }
      )
    }

    const schedule = scheduleRows[0];
    console.log('📋 Agendamento encontrado:', { 
      id: schedule.id, 
      status: schedule.status, 
      equipment_id: schedule.equipment_id 
    });
    console.log('📊 Agendamento encontrado:', {
      id: schedule.id,
      status: schedule.status,
      equipment_name: schedule.equipment_name
    });

    // Verificar se o agendamento pode ser convertido
    if (schedule.status !== 'concluido') {
      await connection.rollback();
      return NextResponse.json(
        { 
          success: false, 
          error: 'Apenas agendamentos com status "concluido" podem ser convertidos em ordem de serviço' 
        },
        { status: 400 }
      )
    }

    // Verificar se já existe uma ordem de serviço para este agendamento
    console.log('🔍 Verificando se já existe OS para agendamento:', numericScheduleId);
    const [existingOrderRows] = await connection.execute(`
      SELECT id FROM service_orders WHERE schedule_id = ?
    `, [numericScheduleId]);

    console.log('📊 Resultado verificação OS existente:', { 
      rowsLength: existingOrderRows?.length, 
      isArray: Array.isArray(existingOrderRows),
      rows: existingOrderRows
    });

    if (existingOrderRows && existingOrderRows.length > 0) {
      await connection.rollback();
      return NextResponse.json(
        { 
          success: false, 
          error: 'Já existe uma ordem de serviço para este agendamento',
          serviceOrderId: existingOrderRows[0].id
        },
        { status: 400 }
      )
    }

    console.log('🔍 Buscando empresa do equipamento...');

    // Buscar empresa do equipamento
    console.log('🔍 Buscando empresa do equipamento...');
    const [companyRows] = await connection.execute(`
      SELECT e.id as equipment_id, e.name as equipment_name
      FROM equipment e
      WHERE e.id = ?
    `, [schedule.equipment_id]);

    console.log('📊 Resultado busca empresa:', { 
      rowsLength: companyRows?.length, 
      isArray: Array.isArray(companyRows),
      equipment_id: schedule.equipment_id
    });

    const companyId = 1; // Usar empresa padrão (TechMed Soluções)

    console.log('🔍 Gerando número da ordem de serviço...');

    // Gerar número único da ordem de serviço
    let orderNumber = await generateServiceOrderNumber();
    
    // Verificar se o número já existe e gerar um novo se necessário
    let attempts = 0;
    while (attempts < 10) {
      console.log('🔍 Verificando se número OS já existe:', orderNumber);
      const [existingNumber] = await connection.execute(`
        SELECT id FROM service_orders WHERE order_number = ?
      `, [orderNumber]);
      
      console.log('📊 Resultado verificação número OS:', { 
        rowsLength: existingNumber?.length, 
        isArray: Array.isArray(existingNumber),
        orderNumber
      });
      
      if (!existingNumber || existingNumber.length === 0) {
        break;
      }
      
      // Adicionar sufixo se já existir
      attempts++;
      orderNumber = `${await generateServiceOrderNumber()}_${attempts}`;
    }

    console.log('📊 Número da OS gerado:', orderNumber);

    // Determinar tipo de manutenção baseado no agendamento
    let maintenanceTypeId = null;
    let maintenanceTypeName = 'PREVENTIVA'; // Default
    
    // Mapear o tipo de manutenção do agendamento para o formato correto
    if (schedule.maintenance_type) {
      const typeMapping = {
        'preventiva': 'PREVENTIVA',
        'corretiva': 'CORRETIVA', 
        'preditiva': 'PREDITIVA',
        'Preventiva': 'PREVENTIVA',
        'Corretiva': 'CORRETIVA',
        'Preditiva': 'PREDITIVA'
      };
      maintenanceTypeName = typeMapping[schedule.maintenance_type] || 'PREVENTIVA';
    } else if (schedule.maintenance_type_name) {
      maintenanceTypeName = schedule.maintenance_type_name.toUpperCase();
    }

    // Buscar ou criar tipo de manutenção
    console.log('🔍 Buscando tipo de manutenção:', maintenanceTypeName);
    const [typeRows] = await connection.execute(`
      SELECT id, name FROM maintenance_types WHERE name = ? LIMIT 1
    `, [maintenanceTypeName]);
    
    console.log('📊 Resultado busca tipo manutenção:', { 
      rowsLength: typeRows?.length, 
      isArray: Array.isArray(typeRows),
      maintenanceTypeName
    });
    
    if (typeRows && typeRows.length > 0) {
      maintenanceTypeId = typeRows[0].id;
      maintenanceTypeName = typeRows[0].name;
    } else {
      // Criar tipo se não existir
      console.log('🔧 Criando tipo de manutenção:', maintenanceTypeName);
      const [insertResult] = await connection.execute(`
        INSERT INTO maintenance_types (name, description, created_at, updated_at) 
        VALUES (?, ?, NOW(), NOW())
      `, [maintenanceTypeName, `Manutenção ${maintenanceTypeName}`]);
      maintenanceTypeId = insertResult.insertId;
    }

    // Determinar status baseado no agendamento
    let serviceOrderStatus = 'ABERTA'; // Default
    if (schedule.status === 'concluido' || schedule.status === 'COMPLETED') {
      serviceOrderStatus = 'CONCLUIDA';
    } else if (schedule.status === 'IN_PROGRESS') {
      serviceOrderStatus = 'EM_ANDAMENTO';
    }

    // Determinar custo baseado no agendamento
    let serviceOrderCost = 0.00;
    if (schedule.actual_cost && schedule.actual_cost > 0) {
      serviceOrderCost = schedule.actual_cost;
    } else if (schedule.estimated_cost && schedule.estimated_cost > 0) {
      serviceOrderCost = schedule.estimated_cost;
    }

    console.log('🚀 Criando ordem de serviço...');
    console.log('📊 Parâmetros para inserção:', {
      orderNumber,
      equipment_id: schedule.equipment_id,
      companyId,
      maintenanceTypeId,
      description: schedule.description || `Ordem de serviço gerada a partir do agendamento #${schedule.id}`,
      priority: schedule.priority || 'MEDIA',
      status: serviceOrderStatus,
      scheduled_date: schedule.scheduled_date,
      observations: schedule.completion_notes || 'Convertido automaticamente do agendamento',
      created_by: numericUserId,
      assigned_to: schedule.assigned_user_id,
      schedule_id: numericScheduleId,
      type: maintenanceTypeName,
      cost: serviceOrderCost
    });

    // Criar a ordem de serviço
    console.log('🔧 Executando INSERT na tabela service_orders...');
    console.log('🔧 Parâmetros do INSERT:', [
       orderNumber,
       schedule.equipment_id,
       companyId,
       maintenanceTypeId,
       schedule.description || `Ordem de serviço gerada a partir do agendamento #${schedule.id}`,
       schedule.priority || 'MEDIA',
       serviceOrderStatus,
       schedule.scheduled_date || new Date().toISOString().split('T')[0], // requested_date
       schedule.scheduled_date,
       schedule.completion_notes || 'Convertido automaticamente do agendamento',
       numericUserId,
       schedule.assigned_user_id,
       numericScheduleId
     ]);
    
    let insertResult;
    try {
      const insertQuery = `
         INSERT INTO service_orders (
           order_number,
           equipment_id,
           company_id,
           maintenance_type_id,
           description,
           priority,
           status,
           requested_date,
           scheduled_date,
           observations,
           created_by,
           assigned_to,
           schedule_id,
           type,
           cost,
           created_at,
           updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
       `;
       
       console.log('🔧 Query INSERT:', insertQuery);
       
       const insertQueryResult = await connection.execute(insertQuery, [
         orderNumber,
         schedule.equipment_id,
         companyId,
         maintenanceTypeId,
         schedule.description || `Ordem de serviço gerada a partir do agendamento #${schedule.id}`,
         schedule.priority || 'MEDIA',
         serviceOrderStatus,
         schedule.scheduled_date || new Date().toISOString().split('T')[0], // requested_date
         schedule.scheduled_date,
         schedule.completion_notes || 'Convertido automaticamente do agendamento',
         numericUserId,
         schedule.assigned_user_id,
         numericScheduleId,
         maintenanceTypeName,
         serviceOrderCost
       ]);
      
      console.log('🔧 Resultado bruto do INSERT:', insertQueryResult);
      console.log('🔧 Tipo do resultado:', typeof insertQueryResult);
      console.log('🔧 É array?:', Array.isArray(insertQueryResult));
      
      [insertResult] = insertQueryResult;
      
      console.log('🔧 insertResult após destructuring:', insertResult);
      console.log('🔧 Tipo do insertResult:', typeof insertResult);
      
    } catch (insertError) {
      console.error('❌ Erro no INSERT:', insertError);
      throw insertError;
    }

    console.log('📊 Resultado da inserção:', { 
      insertResult,
      insertId: insertResult?.insertId,
      affectedRows: insertResult?.affectedRows
    });

    const serviceOrderId = insertResult.insertId;
    console.log('✅ Ordem de serviço criada com ID:', serviceOrderId);

    console.log('🔄 Atualizando status do agendamento...');

    // Atualizar status do agendamento para 'OS_GERADA'
    await connection.execute(`
      UPDATE maintenance_schedules 
      SET status = 'OS_GERADA', updated_at = NOW()
      WHERE id = ?
    `, [numericScheduleId]);

    console.log('📝 Registrando no histórico integrado...');

    // Registrar no histórico integrado
    try {
      await connection.execute(`
        INSERT INTO maintenance_history_integrated (
          equipment_id,
          schedule_id,
          service_order_id,
          action_type,
          description,
          performed_by,
          performed_at,
          additional_data
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?)
      `, [
        schedule.equipment_id,
        numericScheduleId,
        serviceOrderId,
        'OS_GERADA',
        `Ordem de serviço ${orderNumber} criada a partir do agendamento`,
        numericUserId,
        JSON.stringify({
          order_number: orderNumber,
          equipment_name: schedule.equipment_name,
          maintenance_type: maintenanceTypeName
        })
      ]);
      console.log('✅ Histórico registrado com sucesso');
    } catch (historyError) {
      console.error('⚠️ Erro ao registrar histórico (não crítico):', historyError.message);
      // Não interromper o processo por erro no histórico
    }

    // Commit da transação
    await connection.commit();

    console.log('🔍 Buscando dados completos da ordem de serviço criada...');

    // Buscar dados completos da ordem de serviço criada
    console.log('🔍 Buscando ordem de serviço ID:', serviceOrderId);
    console.log('🔍 Tipo do serviceOrderId:', typeof serviceOrderId);
    console.log('🔍 Valor do serviceOrderId:', serviceOrderId);
    
    let queryResult;
    try {
      queryResult = await connection.execute(`
        SELECT 
          so.*,
          e.name as equipment_name,
          e.model as equipment_model,
          e.patrimonio as equipment_patrimonio,
          c.name as company_name,
          s.nome as sector_name,
          sub.name as subsector_name,
          u1.full_name as created_by_name,
          u2.full_name as assigned_to_name,
          mt.name as maintenance_type_name
        FROM service_orders so
        LEFT JOIN equipment e ON so.equipment_id = e.id
        LEFT JOIN companies c ON so.company_id = c.id
        LEFT JOIN setores s ON e.sector_id = s.id
        LEFT JOIN subsectors sub ON e.subsector_id = sub.id
        LEFT JOIN users u1 ON so.created_by = u1.id
        LEFT JOIN users u2 ON so.assigned_to = u2.id
        LEFT JOIN maintenance_types mt ON so.maintenance_type_id = mt.id
        WHERE so.id = ?
      `, [serviceOrderId]);
      
      console.log('📊 Query executada com sucesso');
      console.log('📊 Tipo do queryResult:', typeof queryResult);
      console.log('📊 É array?:', Array.isArray(queryResult));
      console.log('📊 Comprimento do queryResult:', queryResult?.length);
      
    } catch (queryError) {
      console.error('❌ Erro na query de busca:', queryError);
      throw queryError;
    }
    
    const [serviceOrderRows] = queryResult;
    
    console.log('📊 Resultado da busca após destructuring:', { 
      rowsLength: serviceOrderRows?.length, 
      serviceOrderId,
      hasRows: Array.isArray(serviceOrderRows),
      serviceOrderRowsType: typeof serviceOrderRows,
      serviceOrderRowsValue: serviceOrderRows
    });

    if (!serviceOrderRows || serviceOrderRows.length === 0) {
      console.error('❌ Nenhuma ordem de serviço encontrada com ID:', serviceOrderId);
      throw new Error(`Ordem de serviço não encontrada após criação (ID: ${serviceOrderId})`);
    }

    const serviceOrder = serviceOrderRows[0];

    console.log('✅ API /api/maintenance-schedules/convert-to-service-order - Conversão concluída com sucesso');

    return NextResponse.json({
      success: true,
      message: 'Agendamento convertido em ordem de serviço com sucesso',
      data: {
        serviceOrder: serviceOrder,
        scheduleId: numericScheduleId,
        orderNumber: orderNumber
      }
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Erro ao converter agendamento em ordem de serviço:', error)
    console.error('❌ Stack trace:', error.stack)
    console.error('❌ Mensagem do erro:', error.message)
    console.error('❌ Código do erro SQL:', error.code)
    console.error('❌ SQL State:', error.sqlState)
    console.error('❌ SQL Message:', error.sqlMessage)
    console.error('❌ Tipo do erro:', typeof error)
    console.error('❌ Nome do erro:', error.name)
    console.error('❌ Propriedades do erro:', Object.keys(error))
    
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('❌ Erro no rollback:', rollbackError);
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor ao converter agendamento',
        details: error.message,
        sqlError: error.sqlMessage || error.code,
        errorType: error.name,
        errorStack: error.stack
      },
      { status: 500 }
    )
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}