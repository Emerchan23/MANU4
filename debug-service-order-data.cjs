const mysql = require('mysql2/promise');

async function debugServiceOrderData() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('🔍 === ESTRUTURA DA TABELA service_orders ===');
    const [columns] = await connection.execute('DESCRIBE service_orders');
    columns.forEach(col => console.log(`${col.Field}: ${col.Type}`));
    
    console.log('\n🔍 === DADOS DE UMA ORDEM ESPECÍFICA (ID 50) ===');
    const [orders] = await connection.execute('SELECT * FROM service_orders WHERE id = 50 LIMIT 1');
    if (orders.length > 0) {
      console.log(JSON.stringify(orders[0], null, 2));
    } else {
      console.log('❌ Ordem ID 50 não encontrada');
    }
    
    console.log('\n🔍 === TIPOS DE MANUTENÇÃO DISPONÍVEIS ===');
    const [types] = await connection.execute('SELECT * FROM maintenance_types WHERE isActive = 1');
    types.forEach(type => console.log(`ID: ${type.id}, Nome: ${type.name}`));
    
    console.log('\n🔍 === COMPARAÇÃO: API vs BANCO ===');
    console.log('Campos esperados pela API:');
    console.log('- maintenance_type_id');
    console.log('- priority');  
    console.log('- status');
    console.log('- scheduled_date');
    console.log('- completion_date');
    console.log('- estimated_cost');
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

debugServiceOrderData();