const mysql = require('mysql2/promise');

async function checkTables() {
  let connection;

  try {
    console.log('🔍 Verificando estrutura das tabelas...\n');

    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('✅ Conectado ao banco de dados\n');

    // Verificar tabela user_sessions
    console.log('📋 Estrutura da tabela user_sessions:');
    const [sessionColumns] = await connection.query('DESCRIBE user_sessions');
    console.table(sessionColumns);

    // Verificar tabela users
    console.log('\n📋 Estrutura da tabela users:');
    const [userColumns] = await connection.query('DESCRIBE users');
    console.table(userColumns);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTables();
