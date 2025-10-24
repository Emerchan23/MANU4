const mysql = require('mysql2/promise');

async function checkUsersTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  try {
    console.log('=== Verificando estrutura da tabela users ===');
    
    const [result] = await connection.execute('DESCRIBE users');
    console.log('Estrutura da tabela users:');
    result.forEach(col => {
      console.log(`${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `(${col.Key})` : ''}`);
    });
    
    console.log('\n=== Verificando se existe coluna password_hash ===');
    const hasPasswordHash = result.some(col => col.Field === 'password_hash');
    const hasPassword = result.some(col => col.Field === 'password');
    
    console.log('Tem password_hash:', hasPasswordHash);
    console.log('Tem password:', hasPassword);
    
    if (!hasPasswordHash && hasPassword) {
      console.log('\n✅ ESTRUTURA CORRETA: A tabela usa "password" que é compatível com a API Express');
      console.log('A API Express /api/users.js usa "password" (bcrypt)');
    }
    
  } catch (error) {
    console.error('ERRO:', error.message);
  } finally {
    await connection.end();
  }
}

checkUsersTable().catch(console.error);