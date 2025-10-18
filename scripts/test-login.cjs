const crypto = require('crypto');
const mysql = require('mysql2/promise');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function testLogin() {
  let connection;

  try {
    console.log('🔐 Testando Sistema de Login...\n');

    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('✅ Conectado ao banco de dados\n');

    const [rows] = await connection.query(
      'SELECT id, username, email, password_hash, full_name, is_active, is_admin FROM users WHERE username = ?',
      ['admin']
    );

    if (rows.length === 0) {
      console.log('❌ Usuário admin não encontrado!');
      return;
    }

    const user = rows[0];
    console.log('✅ Usuário encontrado:');
    console.log('   ID:', user.id);
    console.log('   Username:', user.username);
    console.log('   Email:', user.email);
    console.log('   Ativo:', user.is_active ? 'Sim' : 'Não');
    console.log('   Admin:', user.is_admin ? 'Sim' : 'Não');

    const testHash = hashPassword('admin123');
    const passwordMatch = user.password_hash === testHash;
    
    console.log('\n🔑 Teste de senha:');
    console.log('   Resultado:', passwordMatch ? '✅ VÁLIDA' : '❌ INVÁLIDA');

    if (!passwordMatch) {
      console.log('\n🔧 Atualizando senha...');
      await connection.query(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [testHash, user.id]
      );
      console.log('✅ Senha atualizada!');
    }

    console.log('\n📝 Credenciais:');
    console.log('   Username: admin');
    console.log('   Email: admin@sistema.com');
    console.log('   Senha: admin123');
    console.log('\n🌐 Acesse: http://localhost:3000/login\n');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testLogin();
