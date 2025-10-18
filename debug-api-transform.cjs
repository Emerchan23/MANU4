const mysql = require('mysql2/promise');

async function debugApiTransform() {
  let connection;
  
  try {
    console.log('🔍 Debugando transformação de dados na API...\n');
    
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
    
    console.log('Dados brutos do banco:');
    console.log('=====================');
    users.forEach(user => {
      console.log(`ID: ${user.id}, Email: ${user.email || 'NULL'}`);
    });
    
    console.log('\nTransformação da API:');
    console.log('====================');
    
    // Simular a transformação da API
    const transformedUsers = users.map(user => {
      const permissions = JSON.parse(user.permissions || "{}")
      
      // Map database profile to frontend role
      const frontendRole = {
        'admin': 'ADMIN',
        'gestor': 'GESTOR',
        'usuario': 'USUARIO'
      }[user.profile] || 'USUARIO'
      
      const transformed = {
        id: user.id,
        username: user.nick,
        name: user.name,
        email: user.email, // Use email from database
        role: frontendRole,
        allowedSectors: permissions.allowedSectors || [],
        isActive: true, // Active column doesn't exist, assume true
        sector_name: user.sector_name,
        created_at: user.created_at
      }
      
      console.log(`ID: ${transformed.id}, Email: ${transformed.email || 'NULL'}`);
      return transformed;
    });
    
    console.log('\nJSON final:');
    console.log(JSON.stringify(transformedUsers, null, 2));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugApiTransform();