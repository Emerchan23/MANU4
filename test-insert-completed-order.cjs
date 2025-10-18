const mysql = require('mysql2/promise');

async function insertCompletedOrder() {
  let connection;
  
  try {
    console.log('🔗 Conectando ao banco de dados...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456',
      database: 'sis_manutencao'
    });

    console.log('✅ Conectado ao banco de dados');

    // Inserir uma ordem de serviço concluída para teste
    console.log('📝 Inserindo ordem de serviço concluída para teste...');
    
    const insertQuery = `
      INSERT INTO service_orders (
        order_number, 
        equipment_id, 
        company_id, 
        description, 
        priority, 
        status, 
        completion_date, 
        cost, 
        created_by, 
        assigned_to, 
        maintenance_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(insertQuery, [
      'OS-TEST-HIST-001',
      1,
      1,
      'Teste para histórico de manutenção - Ordem concluída',
      'medium',
      'concluida',
      new Date(),
      150.00,
      1,
      1,
      'preventive'
    ]);

    console.log(`✅ Ordem de serviço inserida com ID: ${result.insertId}`);

    // Verificar se foi inserida corretamente
    const [orders] = await connection.execute(
      'SELECT * FROM service_orders WHERE id = ?',
      [result.insertId]
    );

    if (orders.length > 0) {
      const order = orders[0];
      console.log('📋 Ordem inserida:');
      console.log(`   ID: ${order.id}`);
      console.log(`   Número: ${order.order_number}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Data de conclusão: ${order.completion_date}`);
      console.log(`   Custo: R$ ${order.cost}`);
    }

    console.log('✅ Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

insertCompletedOrder();