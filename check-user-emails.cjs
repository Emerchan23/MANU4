const mysql = require('mysql2/promise');

async function checkUserEmails() {
  let connection;
  
  try {
    console.log('🔍 Verificando dados de email dos usuários...\n');
    
    // Conectar ao banco de dados
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco de dados\n');
    
    // Buscar todos os usuários com seus dados de email
    const [users] = await connection.execute(`
      SELECT 
        id,
        username,
        email,
        full_name,
        nick,
        name,
        is_active,
        created_at
      FROM users 
      ORDER BY id
    `);
    
    console.log('Dados dos usuários:');
    console.log('==================');
    
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`  Username: ${user.username || 'NULL'}`);
      console.log(`  Email: ${user.email || 'NULL'}`);
      console.log(`  Full Name: ${user.full_name || 'NULL'}`);
      console.log(`  Nick: ${user.nick || 'NULL'}`);
      console.log(`  Name: ${user.name || 'NULL'}`);
      console.log(`  Is Active: ${user.is_active}`);
      console.log(`  Created At: ${user.created_at}`);
      console.log('---');
    });
    
    console.log('\n🎯 Verificação completa!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkUserEmails();