const mysql = require('mysql2/promise');

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  charset: 'utf8mb4',
  timezone: '+00:00',
  // Configurações otimizadas
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  waitForConnections: true,
  queueLimit: 0,
  multipleStatements: false,
  dateStrings: false,
  supportBigNumbers: true,
  bigNumberStrings: false,
  idleTimeout: 300000,
  maxIdle: 5,
  maxReconnects: 3,
  reconnectDelay: 2000
};

async function testConnection() {
  console.log('🔍 Testando conexão com MariaDB...');
  console.log('📊 Configuração:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    connectionLimit: dbConfig.connectionLimit
  });

  let pool;
  let connection;

  try {
    // Criar pool de conexões
    console.log('🔄 Criando pool de conexões...');
    pool = mysql.createPool(dbConfig);

    // Testar conexão básica
    console.log('🔗 Obtendo conexão do pool...');
    connection = await pool.getConnection();
    
    console.log('✅ Conexão obtida com sucesso! Thread ID:', connection.threadId);

    // Testar ping
    console.log('🏓 Testando ping...');
    await connection.ping();
    console.log('✅ Ping bem-sucedido!');

    // Testar query simples
    console.log('🔍 Testando query simples...');
    const [rows] = await connection.query('SELECT 1 as test');
    console.log('✅ Query executada:', rows);

    // Testar query de status
    console.log('📊 Verificando status do banco...');
    const [status] = await connection.query('SHOW STATUS LIKE "Threads_connected"');
    console.log('📊 Conexões ativas:', status);

    // Testar query de variáveis
    console.log('⚙️ Verificando configurações...');
    const [variables] = await connection.query('SHOW VARIABLES LIKE "max_connections"');
    console.log('⚙️ Máximo de conexões:', variables);

    // Testar tabelas do sistema
    console.log('🗃️ Verificando tabelas...');
    const [tables] = await connection.query('SHOW TABLES');
    console.log('🗃️ Tabelas encontradas:', tables.length);

    console.log('🎉 Teste de conexão concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no teste de conexão:', error.message);
    console.error('❌ Código do erro:', error.code);
    console.error('❌ Stack:', error.stack);
    
    // Diagnóstico adicional
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Dica: Verifique se o MariaDB está rodando');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('💡 Dica: Verifique usuário e senha');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('💡 Dica: Verifique se o banco de dados existe');
    }
  } finally {
    // Limpar recursos
    if (connection) {
      console.log('🔓 Liberando conexão...');
      connection.release();
    }
    
    if (pool) {
      console.log('🔚 Fechando pool...');
      await pool.end();
    }
  }
}

// Executar teste
testConnection().catch(console.error);