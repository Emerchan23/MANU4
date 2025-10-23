import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'

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
  console.log('🚀 ENDPOINT CONVERT-TO-SERVICE-ORDER CHAMADO!');
  console.log('🔄 API /api/maintenance-schedules/convert-to-service-order - Iniciando conversão...');
  console.log('📊 Request URL:', request.url);
  console.log('📊 Request method:', request.method);
  
  let connection;
  
  try {
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
    const [scheduleRows] = await connection.execute(`
      SELECT 
        ms.*,
        e.name as equipment_name,
        e.model as equipment_model,
        COALESCE(e.patrimony, e.patrimonio_number) as equipment_patrimonio,
        u.full_name as assigned_user_name,
        mp.name as maintenance_plan_name,
        mp.maintenance_type as maintenance_type_name,
        c.id as company_id,
        c.name as company_name
      FROM maintenance_schedules ms
      LEFT JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN users u ON ms.assigned_user_id = u.id
      LEFT JOIN maintenance_plans mp ON ms.maintenance_plan_id = mp.id
      LEFT JOIN companies c ON ms.company_id = c.id
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
    if (schedule.status !== 'CONCLUIDA') {
      await connection.rollback();
      return NextResponse.json(
        { 
          success: false, 
          error: 'Apenas agendamentos com status "CONCLUIDA" podem ser convertidos em ordem de serviço' 
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

    console.log('🔍 Determinando empresa prestadora...');

    // Usar a empresa do agendamento se disponível, senão usar empresa padrão
    let companyId, companyName;
    
    if (schedule.company_id && schedule.company_name) {
      // Usar empresa do agendamento
      companyId = schedule.company_id;
      companyName = schedule.company_name;
      console.log('✅ Usando empresa do agendamento:', { companyId, companyName });
    } else {
      // Buscar empresa padrão como fallback
      console.log('⚠️ Agendamento sem empresa definida, buscando empresa padrão...');
      const [companyRows] = await connection.execute(`
        SELECT id, name FROM companies WHERE id = 1 LIMIT 1
      `);

      console.log('📊 Resultado busca empresa padrão:', { 
        rowsLength: companyRows?.length, 
        isArray: Array.isArray(companyRows),
        companyName: companyRows?.[0]?.name,
        companyId: companyRows?.[0]?.id
      });

      if (!companyRows || companyRows.length === 0) {
        throw new Error('Empresa padrão não encontrada no banco de dados');
      }

      companyId = companyRows[0].id;
      companyName = companyRows[0].name;
      console.log('✅ Usando empresa padrão:', { companyId, companyName });
    }

    console.log('🔍 Gerando número da ordem de serviço...');

    // Função para gerar número de ordem de serviço
    const generateServiceOrderNumber = async (): Promise<string> => {
      const currentYear = new Date().getFullYear()
      
      try {
        // Busca o último número de ordem do ano atual
        const [rows] = await connection.execute(`
          SELECT order_number 
          FROM service_orders 
          WHERE YEAR(created_at) = ? 
          ORDER BY id DESC 
          LIMIT 1
        `, [currentYear])
        
        let nextNumber = 1
        
        if (Array.isArray(rows) && rows.length > 0) {
          const lastOrder = rows[0] as { order_number: string }
          // Extrai o número sequencial do formato OS-XXX/YYYY
          const match = lastOrder.order_number.match(/OS-(\d+)\/\d{4}/)
          if (match) {
            nextNumber = parseInt(match[1]) + 1
          }
        }
        
        // Formata o número com 3 dígitos (001, 002, etc.)
        const formattedNumber = nextNumber.toString().padStart(3, '0')
        
        return `OS-${formattedNumber}/${currentYear}`
      } catch (error) {
        console.error('Erro ao gerar número da ordem de serviço:', error)
        // Fallback: gera um número baseado no timestamp
        const timestamp = Date.now().toString().slice(-3)
        return `OS-${timestamp}/${currentYear}`
      }
    }

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
    
    console.log('🔍 Dados do agendamento para tipo de manutenção:', {
      maintenance_type: schedule.maintenance_type,
      maintenance_type_name: schedule.maintenance_type_name,
      maintenance_plan_name: schedule.maintenance_plan_name
    });
    
    // Logs detalhados para debug
    console.log('🔍 DEBUG - Dados do agendamento para tipo de manutenção:');
    console.log('  - schedule.maintenance_type:', schedule.maintenance_type);
    console.log('  - schedule.maintenance_type_name:', schedule.maintenance_type_name);
    console.log('  - schedule.maintenance_plan_name:', schedule.maintenance_plan_name);
    console.log('  - schedule.maintenance_plan_id:', schedule.maintenance_plan_id);

    // Mapear o tipo de manutenção do agendamento para o formato correto
    if (schedule.maintenance_type) {
      const typeMapping = {
        'preventiva': 'PREVENTIVA',
        'corretiva': 'CORRETIVA', 
        'preditiva': 'PREDITIVA',
        'Preventiva': 'PREVENTIVA',
        'Corretiva': 'CORRETIVA',
        'Preditiva': 'PREDITIVA',
        'PREVENTIVA': 'PREVENTIVA',
        'CORRETIVA': 'CORRETIVA',
        'PREDITIVA': 'PREDITIVA'
      };
      maintenanceTypeName = typeMapping[schedule.maintenance_type] || schedule.maintenance_type.toUpperCase();
      console.log('✅ Usando maintenance_type:', schedule.maintenance_type, '-> mapeado para:', maintenanceTypeName);
    } else if (schedule.maintenance_type_name) {
      maintenanceTypeName = schedule.maintenance_type_name.toUpperCase();
      console.log('✅ Usando maintenance_type_name:', schedule.maintenance_type_name, '-> mapeado para:', maintenanceTypeName);
    } else if (schedule.maintenance_plan_name) {
      // Se não tem tipo específico, usar o nome do plano de manutenção
      maintenanceTypeName = schedule.maintenance_plan_name.toUpperCase();
      console.log('✅ Usando maintenance_plan_name:', schedule.maintenance_plan_name, '-> mapeado para:', maintenanceTypeName);
    } else {
      // Fallback: buscar tipo do plano de manutenção
      if (schedule.maintenance_plan_id) {
        console.log('🔍 Buscando tipo do plano de manutenção ID:', schedule.maintenance_plan_id);
        const [planRows] = await connection.execute(`
          SELECT maintenance_type FROM maintenance_plans WHERE id = ? LIMIT 1
        `, [schedule.maintenance_plan_id]);
        
        if (planRows && planRows.length > 0 && planRows[0].maintenance_type) {
          const planType = planRows[0].maintenance_type;
          const typeMapping = {
            'PREVENTIVE': 'PREVENTIVA',
            'CORRECTIVE': 'CORRETIVA',
            'PREDICTIVE': 'PREDITIVA'
          };
          maintenanceTypeName = typeMapping[planType] || planType;
          console.log('✅ Tipo encontrado no plano:', planType, '-> mapeado para:', maintenanceTypeName);
        }
      }
      
      // Se ainda não encontrou, usar fallback padrão
      if (!maintenanceTypeName) {
        maintenanceTypeName = 'PREVENTIVA';
        console.log('⚠️ Usando fallback padrão: PREVENTIVA');
      }
    }

    console.log('🔧 Tipo de manutenção final determinado:', maintenanceTypeName);

    // Buscar ou criar tipo de manutenção
    console.log('🔍 Buscando tipo de manutenção:', maintenanceTypeName);
    const [typeRows] = await connection.execute(`
      SELECT id, name FROM maintenance_types WHERE name = ? LIMIT 1
    `, [maintenanceTypeName]);
    
    console.log('📊 Resultado busca tipo manutenção:', { 
      rowsLength: typeRows?.length, 
      isArray: Array.isArray(typeRows),
      maintenanceTypeName,
      foundType: typeRows?.[0]
    });
    
    if (typeRows && typeRows.length > 0) {
      maintenanceTypeId = typeRows[0].id;
      maintenanceTypeName = typeRows[0].name;
      console.log('✅ Tipo de manutenção encontrado:', { id: maintenanceTypeId, name: maintenanceTypeName });
    } else {
      // Criar tipo se não existir
      console.log('🔧 Criando tipo de manutenção:', maintenanceTypeName);
      const [insertResult] = await connection.execute(`
        INSERT INTO maintenance_types (name, description, created_at, updated_at) 
        VALUES (?, ?, NOW(), NOW())
      `, [maintenanceTypeName, `Manutenção ${maintenanceTypeName}`]);
      maintenanceTypeId = insertResult.insertId;
      console.log('✅ Tipo de manutenção criado:', { id: maintenanceTypeId, name: maintenanceTypeName });
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
          COALESCE(e.patrimony, e.patrimonio_number) as equipment_patrimonio,
          c.name as company_name,
          s.name as sector_name,
          sub.name as subsector_name,
          u1.full_name as created_by_name,
          u2.full_name as assigned_to_name,
          mt.name as maintenance_type_name
        FROM service_orders so
        LEFT JOIN equipment e ON so.equipment_id = e.id
        LEFT JOIN companies c ON so.company_id = c.id
        LEFT JOIN sectors s ON e.sector_id = s.id
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
    console.error('💥 ERRO CRÍTICO na API /api/maintenance-schedules/convert-to-service-order:', error);
    console.error('Stack trace:', error.stack);
    console.error('Tipo do erro:', typeof error);
    console.error('Nome do erro:', error.name);
    console.error('Mensagem do erro:', error.message);
    
    // Rollback em caso de erro
    if (connection) {
      try {
        await connection.rollback();
        console.log('🔄 Rollback executado com sucesso');
      } catch (rollbackError) {
        console.error('❌ Erro no rollback:', rollbackError);
      }
    }

    // Determinar tipo de erro e resposta apropriada
    let errorMessage = 'Erro interno do servidor ao converter agendamento';
    let statusCode = 500;

    if (error.message.includes('não encontrada')) {
      errorMessage = error.message;
      statusCode = 404;
    } else if (error.message.includes('já existe')) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      errorMessage = 'Erro de estrutura do banco de dados - tabela não encontrada';
      console.error('❌ Tabela não encontrada:', error.sqlMessage);
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      errorMessage = 'Erro de estrutura do banco de dados - campo não encontrado';
      console.error('❌ Campo não encontrado:', error.sqlMessage);
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Erro de conexão com o banco de dados';
      console.error('❌ Conexão recusada pelo banco de dados');
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      },
      { status: statusCode }
    )
  } finally {
    // Fechar conexão
    if (connection) {
      try {
        await connection.end();
        console.log('🔌 Conexão com banco fechada');
      } catch (closeError) {
        console.error('⚠️ Erro ao fechar conexão:', closeError);
      }
    }
  }
}