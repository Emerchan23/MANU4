const mysql = require('mysql2/promise');

async function testSimpleServiceOrders() {
  const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance',
    charset: 'utf8mb4',
    timezone: '+00:00'
  };

  try {
    console.log('🔍 Testando query simples de service_orders...');
    const connection = await mysql.createConnection(dbConfig);
    
    // Query simples sem joins
    const simpleQuery = `
      SELECT
        so.id,
        so.order_number,
        so.description,
        so.status,
        so.priority,
        so.created_at
      FROM service_orders so
      ORDER BY so.created_at DESC
      LIMIT 5
    `;
    
    console.log('📋 Executando query simples...');
    const [results] = await connection.query(simpleQuery);
    console.log(`✅ Query executada com sucesso! Registros encontrados: ${results.length}`);
    
    if (results.length > 0) {
      console.log('📊 Registros encontrados:');
      results.forEach((row, index) => {
        console.log(`${index + 1}. OS: ${row.order_number} - ${row.description} (${row.status})`);
      });
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Erro ao executar query:', error);
    console.error('Código do erro:', error.code);
    console.error('Mensagem SQL:', error.sqlMessage);
  }
}

testSimpleServiceOrders();