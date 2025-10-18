const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugHistoryDeep() {
  let connection;
  
  try {
    console.log('🔍 DEBUG PROFUNDO DO HISTÓRICO DE MANUTENÇÃO');
    console.log('='.repeat(60));
    
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance',
      charset: 'utf8mb4',
      timezone: '+00:00'
    };

    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');

    // 1. Verificar se a tabela maintenance_history existe e tem dados
    console.log('\n1️⃣ VERIFICANDO TABELA MAINTENANCE_HISTORY');
    console.log('-'.repeat(50));
    
    const [historyCount] = await connection.execute(`SELECT COUNT(*) as total FROM maintenance_history`);
    console.log(`📊 Total de registros na maintenance_history: ${historyCount[0].total}`);
    
    if (historyCount[0].total > 0) {
      const [historyData] = await connection.execute(`
        SELECT id, service_order_id, description, execution_date, performed_by, cost
        FROM maintenance_history 
        ORDER BY id DESC 
        LIMIT 3
      `);
      console.log('📋 Últimos registros da maintenance_history:');
      historyData.forEach(record => {
        console.log(`   ID: ${record.id}, OS: ${record.service_order_id}, Desc: ${record.description.substring(0, 50)}...`);
      });
    }

    // 2. Verificar ordens de serviço concluídas
    console.log('\n2️⃣ VERIFICANDO ORDENS DE SERVIÇO CONCLUÍDAS');
    console.log('-'.repeat(50));
    
    const [completedOrders] = await connection.execute(`
      SELECT COUNT(*) as total 
      FROM service_orders 
      WHERE status IN ('concluida', 'finalizada', 'completed') 
        AND completion_date IS NOT NULL
    `);
    console.log(`📊 Total de ordens concluídas: ${completedOrders[0].total}`);
    
    if (completedOrders[0].total > 0) {
      const [ordersData] = await connection.execute(`
        SELECT id, order_number, equipment_id, status, completion_date, description
        FROM service_orders 
        WHERE status IN ('concluida', 'finalizada', 'completed') 
          AND completion_date IS NOT NULL
        ORDER BY id DESC 
        LIMIT 5
      `);
      console.log('📋 Ordens concluídas encontradas:');
      ordersData.forEach(order => {
        console.log(`   ID: ${order.id}, Número: ${order.order_number}, Equip: ${order.equipment_id}, Status: ${order.status}`);
      });
    }

    // 3. Testar a query exata da API
    console.log('\n3️⃣ TESTANDO QUERY EXATA DA API');
    console.log('-'.repeat(50));
    
    // Query de contagem (igual à da API)
    const countQuery = `
      SELECT COUNT(*) as total FROM (
        SELECT mh.id
        FROM maintenance_history mh
        LEFT JOIN service_orders so ON mh.service_order_id = so.id
        
        UNION ALL
        
        SELECT so.id
        FROM service_orders so
        WHERE so.status IN ('concluida', 'finalizada', 'completed') 
          AND so.completion_date IS NOT NULL
      ) as combined_history
    `;
    
    const [countResult] = await connection.execute(countQuery);
    console.log(`📊 Total combinado (API count): ${countResult[0].total}`);
    
    // Query principal (igual à da API)
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
      
      ORDER BY execution_date DESC, created_at DESC
      LIMIT 10 OFFSET 0
    `;
    
    console.log('🔍 Executando query principal da API...');
    const [historyResult] = await connection.execute(historyQuery);
    console.log(`📊 Registros retornados pela query principal: ${historyResult.length}`);
    
    if (historyResult.length > 0) {
      console.log('📋 Primeiros registros encontrados:');
      historyResult.slice(0, 3).forEach((record, index) => {
        console.log(`   ${index + 1}. ID: ${record.id}, Tipo: ${record.source_type}, Desc: ${record.description?.substring(0, 40)}...`);
        console.log(`      Equipamento: ${record.equipment_name || 'N/A'}, Data: ${record.execution_date}`);
      });
    } else {
      console.log('❌ Nenhum registro encontrado pela query principal!');
    }

    // 4. Verificar equipamentos específicos
    console.log('\n4️⃣ VERIFICANDO EQUIPAMENTOS ESPECÍFICOS');
    console.log('-'.repeat(50));
    
    const [equipments] = await connection.execute(`
      SELECT DISTINCT equipment_id, COUNT(*) as orders_count
      FROM service_orders 
      WHERE equipment_id IS NOT NULL
      GROUP BY equipment_id
      ORDER BY orders_count DESC
      LIMIT 5
    `);
    
    console.log('📋 Equipamentos com mais ordens:');
    equipments.forEach(eq => {
      console.log(`   Equipamento ID: ${eq.equipment_id}, Total de ordens: ${eq.orders_count}`);
    });
    
    // Testar com um equipamento específico
    if (equipments.length > 0) {
      const testEquipmentId = equipments[0].equipment_id;
      console.log(`\n🔍 Testando histórico para equipamento ID: ${testEquipmentId}`);
      
      const equipmentHistoryQuery = `
        SELECT COUNT(*) as total FROM (
          SELECT mh.id
          FROM maintenance_history mh
          LEFT JOIN service_orders so ON mh.service_order_id = so.id
          WHERE so.equipment_id = ?
          
          UNION ALL
          
          SELECT so.id
          FROM service_orders so
          WHERE so.status IN ('concluida', 'finalizada', 'completed') 
            AND so.completion_date IS NOT NULL
            AND so.equipment_id = ?
        ) as combined_history
      `;
      
      const [equipmentCount] = await connection.execute(equipmentHistoryQuery, [testEquipmentId, testEquipmentId]);
      console.log(`📊 Histórico para equipamento ${testEquipmentId}: ${equipmentCount[0].total} registros`);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada');
    }
  }
}

debugHistoryDeep();