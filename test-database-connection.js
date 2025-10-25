const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
  const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance',
    port: 3306
  };

  try {
    console.log('🔍 Testando conexão com o banco de dados...');
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Testar se a tabela sectors existe
    console.log('🔍 Verificando se a tabela sectors existe...');
    const [tables] = await connection.execute("SHOW TABLES LIKE 'sectors'");
    
    if (tables.length === 0) {
      console.log('❌ Tabela "sectors" não encontrada!');
      return;
    }
    
    console.log('✅ Tabela "sectors" encontrada!');
    
    // Verificar dados na tabela sectors
    console.log('🔍 Verificando dados na tabela sectors...');
    const [rows] = await connection.execute('SELECT COUNT(*) as total FROM sectors');
    console.log(`📊 Total de registros na tabela sectors: ${rows[0].total}`);
    
    if (rows[0].total > 0) {
      console.log('🔍 Buscando alguns registros...');
      const [sectors] = await connection.execute('SELECT id, name, description, active FROM sectors LIMIT 5');
      console.log('📋 Registros encontrados:', sectors);
    }
    
    await connection.end();
    console.log('✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testDatabaseConnection();