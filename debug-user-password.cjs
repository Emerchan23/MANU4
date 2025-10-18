const mysql = require('mysql2/promise');
const crypto = require('crypto');

async function debugUserPassword() {
  let connection;
  
  try {
    // Conectar ao banco de dados
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance'
    });

    console.log('✅ Conectado ao banco de dados');

    // Função para hash de senha usando SHA256 (igual ao endpoint)
    function hashPassword(password) {
      return crypto.createHash('sha256').update(password).digest('hex');
    }

    // 1. Verificar usuário admin
    console.log('\n👑 Verificando usuário admin...');
    const [users] = await connection.execute(
      "SELECT id, username, email, password_hash, is_active FROM users WHERE username = 'admin'"
    );

    if (users.length === 0) {
      console.log('❌ Usuário admin não encontrado!');
      return;
    }

    const user = users[0];
    console.log('✅ Usuário admin encontrado:');
    console.table({
      id: user.id,
      username: user.username,
      email: user.email,
      has_password_hash: !!user.password_hash,
      password_hash_length: user.password_hash ? user.password_hash.length : 0,
      is_active: user.is_active
    });

    // 2. Testar senhas comuns
    const commonPasswords = ['admin123', 'admin', '123456', 'password', 'sistema'];
    
    console.log('\n🔑 Testando senhas comuns...');
    for (const testPassword of commonPasswords) {
      const testHash = hashPassword(testPassword);
      const match = user.password_hash === testHash;
      
      console.log(`${match ? '✅' : '❌'} Senha "${testPassword}": ${match ? 'MATCH!' : 'não confere'}`);
      
      if (match) {
        console.log(`🎉 SENHA ENCONTRADA: "${testPassword}"`);
        break;
      }
    }

    // 3. Verificar se precisa atualizar a senha
    if (!user.password_hash || user.password_hash.length === 0) {
      console.log('\n🔧 Usuário sem senha configurada. Definindo senha padrão...');
      
      const defaultPassword = 'admin123';
      const newHash = hashPassword(defaultPassword);
      
      await connection.execute(
        "UPDATE users SET password_hash = ? WHERE id = ?",
        [newHash, user.id]
      );
      
      console.log(`✅ Senha padrão definida: "${defaultPassword}"`);
    }

    // 4. Verificar login por email
    console.log('\n📧 Verificando login por email...');
    const [emailUsers] = await connection.execute(
      "SELECT id, username, email, password_hash FROM users WHERE email = ?",
      ['admin@sistema.com']
    );

    if (emailUsers.length > 0) {
      console.log('✅ Usuário encontrado por email:');
      console.table({
        id: emailUsers[0].id,
        username: emailUsers[0].username,
        email: emailUsers[0].email,
        has_password_hash: !!emailUsers[0].password_hash
      });
    } else {
      console.log('❌ Usuário não encontrado por email');
    }

  } catch (error) {
    console.log('❌ Erro:', error.message);
    console.log('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar debug
debugUserPassword().catch(console.error);