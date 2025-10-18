const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function testBcryptPassword() {
  let connection;
  
  try {
    console.log('🔑 Testando senha bcrypt para admin@sistema.com...\n');
    
    // Conectar ao banco
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco de dados');
    
    // Buscar usuário
    const [rows] = await connection.execute(
      `SELECT id, username, email, password_hash FROM users WHERE email = ?`,
      ['admin@sistema.com']
    );
    
    if (rows.length === 0) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    const user = rows[0];
    console.log('✅ Usuário encontrado:', user.username);
    console.log('Hash atual:', user.password_hash.substring(0, 30) + '...');
    
    // Testar senhas comuns
    const testPasswords = ['admin123', 'admin', '123456', 'password'];
    
    for (const testPassword of testPasswords) {
      const isMatch = await bcrypt.compare(testPassword, user.password_hash);
      console.log(`Senha "${testPassword}": ${isMatch ? '✅ CORRETA' : '❌ Incorreta'}`);
      
      if (isMatch) {
        console.log(`\n🎉 SENHA ENCONTRADA: "${testPassword}"`);
        return;
      }
    }
    
    console.log('\n❌ Nenhuma das senhas testadas funcionou');
    console.log('\n🔧 Vamos criar uma nova senha "admin123" para o usuário...');
    
    // Criar novo hash para "admin123"
    const newHash = await bcrypt.hash('admin123', 10);
    console.log('Novo hash gerado:', newHash.substring(0, 30) + '...');
    
    // Atualizar no banco
    await connection.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newHash, user.id]
    );
    
    console.log('✅ Senha atualizada com sucesso!');
    console.log('Agora você pode fazer login com:');
    console.log('  Email: admin@sistema.com');
    console.log('  Senha: admin123');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testBcryptPassword();