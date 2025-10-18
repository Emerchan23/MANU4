const mysql = require('mysql2/promise');

async function testSimpleQuery() {
  const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance',
    charset: 'utf8mb4',
    timezone: '+00:00'
  };

  try {
    console.log('🔍 Testando query simples...');
    const connection = await mysql.createConnection(dbConfig);
    
    // Testar query simples sem parâmetros
    const sql = `SELECT COUNT(*) as total FROM service_orders`;
    console.log('📋 Executando query:', sql);
    
    const [results] = await connection.query(sql);
    console.log('✅ Query executada com sucesso!');
    console.log('📊 Resultado:', results);
    
    // Testar query com parâmetros
    const sqlWithParams = `SELECT COUNT(*) as total FROM service_orders WHERE status = ?`;
    console.log('📋 Executando query com parâmetros:', sqlWithParams);
    
    const [resultsWithParams] = await connection.query(sqlWithParams, ['aberta']);
    console.log('✅ Query com parâmetros executada com sucesso!');
    console.log('📊 Resultado:', resultsWithParams);
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Erro ao executar query:', error);
    console.error('Código do erro:', error.code);
    console.error('Mensagem SQL:', error.sqlMessage);
  }
}

testSimpleQuery();