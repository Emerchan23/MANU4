const mysql = require('mysql2/promise');

async function checkUsersTable() {
  let connection;

  try {
    console.log('🔍 Verificando estrutura da tabela users...\n');

    // Conectar ao banco
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco de dados\n');
    
    // Verificar estrutura da tabela users
    console.log('Colunas da tabela users:');
    const [structure] = await connection.execute('DESCRIBE users');
    structure.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    console.log('\n🎯 Verificação completa!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkUsersTable().catch(console.error);