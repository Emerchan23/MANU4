const mysql = require('mysql2/promise');
require('dotenv').config();

async function testHistoryClick() {
  let connection;
  
  try {
    console.log('🔍 Testando clique no histórico...');
    
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

    // Buscar uma ordem de serviço para testar
    console.log('\n📋 Buscando ordens de serviço...');
    const [orders] = await connection.execute(`
      SELECT id, order_number, equipment_id, status, description
      FROM service_orders 
      ORDER BY id DESC
      LIMIT 5
    `);
    
    if (orders.length === 0) {
      console.log('❌ Nenhuma ordem de serviço encontrada!');
      return;
    }
    
    console.log(`✅ Encontradas ${orders.length} ordens de serviço:`);
    orders.forEach(order => {
      console.log(`   ID: ${order.id}, Número: ${order.order_number}, Equipamento: ${order.equipment_id}, Status: ${order.status}`);
    });
    
    // Testar a API de histórico com o primeiro equipamento
    const firstOrder = orders[0];
    const equipmentId = firstOrder.equipment_id;
    
    console.log(`\n🔍 Testando histórico para equipamento ID: ${equipmentId}`);
    
    // Simular a chamada da API
    const fetch = require('node-fetch');
    
    try {
      const response = await fetch(`http://localhost:3000/api/service-orders/history?equipmentId=${equipmentId}`);
      const data = await response.json();
      
      console.log(`📡 Status da resposta: ${response.status}`);
      console.log('📊 Dados retornados:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log(`✅ API funcionando! Retornou ${data.data.length} registros`);
        if (data.data.length > 0) {
          console.log('\n📋 Primeiro registro do histórico:');
          const first = data.data[0];
          console.log(`   ID: ${first.id}`);
          console.log(`   Descrição: ${first.description}`);
          console.log(`   Data: ${first.execution_date}`);
          console.log(`   Tipo: ${first.source_type}`);
        }
      } else {
        console.log('❌ API retornou erro:', data.error);
      }
    } catch (fetchError) {
      console.error('❌ Erro ao chamar API:', fetchError.message);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada');
    }
  }
}

testHistoryClick();