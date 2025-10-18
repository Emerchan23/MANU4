const mysql = require('mysql2/promise');

async function debugSpecificOrder() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  try {
    console.log('🔍 === DEBUG ORDEM DE SERVIÇO ID 50 ===');
    
    // 1. Verificar estrutura da tabela primeiro
     const [columns] = await connection.execute(`
       SHOW COLUMNS FROM service_orders
     `);
     
     console.log('📋 ESTRUTURA DA TABELA service_orders:');
     columns.forEach(col => {
       console.log(`- ${col.Field} (${col.Type})`);
     });
     console.log('');

     // 2. Verificar dados da ordem de serviço
     const [orderRows] = await connection.execute(`
       SELECT * FROM service_orders WHERE id = ?
     `, [50]);

    if (orderRows.length > 0) {
      const order = orderRows[0];
      console.log('📋 DADOS DA ORDEM DE SERVIÇO:');
      console.log('ID:', order.id);
      console.log('Equipment ID:', order.equipment_id);
      console.log('Company ID:', order.company_id);
      console.log('🔧 Maintenance Type ID:', order.maintenance_type_id, typeof order.maintenance_type_id);
      console.log('Priority:', order.priority);
      console.log('Status:', order.status);
      console.log('Cost:', order.cost);
      console.log('📅 Scheduled Date:', order.scheduled_date, typeof order.scheduled_date);
      console.log('📅 Completion Date:', order.completion_date, typeof order.completion_date);
      console.log('Responsible:', order.responsible);
      console.log('Description:', order.description);
      console.log('Observations:', order.observations);
      console.log('');
    }

    // 2. Verificar tipos de manutenção disponíveis
    const [maintenanceTypes] = await connection.execute(`
      SELECT id, name, description 
      FROM maintenance_types 
      ORDER BY name
    `);

    console.log('🔧 TIPOS DE MANUTENÇÃO DISPONÍVEIS:');
    maintenanceTypes.forEach(type => {
      console.log(`- ID: ${type.id}, Nome: ${type.name}`);
    });
    console.log('');

    // 3. Simular o que a API retorna
    console.log('🌐 SIMULANDO RESPOSTA DA API:');
    
    if (orderRows.length > 0) {
      const order = orderRows[0];
      
      // Simular formatação da API
      const apiResponse = {
        id: order.id,
        equipment_id: order.equipment_id,
        company_id: order.company_id,
        maintenance_type_id: order.maintenance_type_id,
        priority: order.priority,
        status: order.status,
        cost: order.cost,
        scheduled_date: order.scheduled_date,
        completion_date: order.completion_date,
        responsible: order.responsible,
        description: order.description,
        observations: order.observations
      };
      
      console.log('API Response:', JSON.stringify(apiResponse, null, 2));
      
      // Verificar tipos específicos
      console.log('');
      console.log('🔍 VERIFICAÇÃO DE TIPOS:');
      console.log('maintenance_type_id é null?', order.maintenance_type_id === null);
      console.log('maintenance_type_id é undefined?', order.maintenance_type_id === undefined);
      console.log('maintenance_type_id é string vazia?', order.maintenance_type_id === '');
      console.log('scheduled_date é null?', order.scheduled_date === null);
      console.log('scheduled_date é undefined?', order.scheduled_date === undefined);
      console.log('completion_date é null?', order.completion_date === null);
      console.log('completion_date é undefined?', order.completion_date === undefined);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await connection.end();
  }
}

debugSpecificOrder();