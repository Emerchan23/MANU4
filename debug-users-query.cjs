const mysql = require('mysql2/promise');

async function debugUsersQuery() {
  let connection;
  
  try {
    console.log('🔍 Testando consulta SQL da API /api/users...\n');
    
    // Conectar ao banco de dados
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco de dados\n');
    
    // Executar a mesma consulta da API
    const [users] = await connection.execute(`
      SELECT u.id, u.nick, u.name, u.email, u.profile, u.sector_id, u.permissions, u.created_at,
             s.nome as sector_name
      FROM users u
      LEFT JOIN setores s ON u.sector_id = s.id
      ORDER BY u.name
    `);
    
    console.log('Resultado da consulta SQL:');
    console.log('========================');
    
    users.forEach(user => {
      console.log(`ID: ${user.id}`);
      console.log(`  Nick: ${user.nick}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email || 'NULL'}`);
      console.log(`  Profile: ${user.profile}`);
      console.log(`  Sector ID: ${user.sector_id}`);
      console.log(`  Sector Name: ${user.sector_name || 'NULL'}`);
      console.log(`  Created At: ${user.created_at}`);
      console.log('---');
    });
    
    console.log('\n🎯 Debug completo!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugUsersQuery();