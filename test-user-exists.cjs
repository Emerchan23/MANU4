const mysql = require('mysql2/promise');
const crypto = require('crypto');

async function checkUserExists() {
  let connection;
  
  try {
    console.log('🔍 Verificando se usuário admin@sistema.com existe no banco...\n');
    
    // Conectar ao banco
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco de dados');
    
    // Buscar usuário por email
    const [rows] = await connection.execute(
      `SELECT 
        id,
        username,
        email,
        password_hash,
        full_name,
        is_active,
        is_admin,
        created_at,
        last_login
      FROM users 
      WHERE email = ? OR username = ?`,
      ['admin@sistema.com', 'admin@sistema.com']
    );
    
    if (rows.length === 0) {
      console.log('❌ Usuário admin@sistema.com NÃO encontrado no banco');
      
      // Verificar se existe algum usuário admin
      const [adminRows] = await connection.execute(
        `SELECT 
          id,
          username,
          email,
          password_hash,
          full_name,
          is_active,
          is_admin
        FROM users 
        WHERE is_admin = 1 OR username LIKE '%admin%'`
      );
      
      if (adminRows.length > 0) {
        console.log('\n📋 Usuários admin encontrados:');
        adminRows.forEach((user, index) => {
          console.log(`${index + 1}. ID: ${user.id}`);
          console.log(`   Username: ${user.username}`);
          console.log(`   Email: ${user.email}`);
          console.log(`   Nome: ${user.full_name}`);
          console.log(`   Ativo: ${user.is_active ? 'Sim' : 'Não'}`);
          console.log(`   Admin: ${user.is_admin ? 'Sim' : 'Não'}`);
          console.log(`   Hash: ${user.password_hash ? 'Configurado' : 'NÃO configurado'}`);
          console.log('');
        });
      } else {
        console.log('\n❌ Nenhum usuário admin encontrado no banco');
      }
      
    } else {
      const user = rows[0];
      console.log('✅ Usuário encontrado:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nome: ${user.full_name}`);
      console.log(`   Ativo: ${user.is_active ? 'Sim' : 'Não'}`);
      console.log(`   Admin: ${user.is_admin ? 'Sim' : 'Não'}`);
      console.log(`   Hash: ${user.password_hash ? 'Configurado' : 'NÃO configurado'}`);
      console.log(`   Criado em: ${user.created_at}`);
      console.log(`   Último login: ${user.last_login || 'Nunca'}`);
      
      if (user.password_hash) {
        console.log(`   Hash da senha: ${user.password_hash.substring(0, 20)}...`);
        
        // Testar hash da senha "admin123"
        const testPassword = 'admin123';
        const testHash = crypto.createHash('sha256').update(testPassword).digest('hex');
        
        console.log(`\n🔑 Teste de senha "admin123":`);
        console.log(`   Hash calculado: ${testHash.substring(0, 20)}...`);
        console.log(`   Hash no banco:  ${user.password_hash.substring(0, 20)}...`);
        console.log(`   Senhas coincidem: ${testHash === user.password_hash ? '✅ SIM' : '❌ NÃO'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkUserExists();