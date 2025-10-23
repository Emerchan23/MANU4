const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function createTestUser() {
  let connection;
  
  try {
    console.log('🔍 Criando usuário de teste no banco MariaDB...\n');
    
    // Conectar ao banco de dados
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco de dados\n');
    
    // Gerar hash da senha
    const password = 'teste123';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    console.log('🔐 Hash da senha gerado\n');
    
    // Verificar se o usuário já existe
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      ['teste.usuario', 'teste@exemplo.com']
    );
    
    if (existingUsers.length > 0) {
      console.log('⚠️ Usuário já existe, removendo primeiro...');
      await connection.execute(
        'DELETE FROM users WHERE username = ? OR email = ?',
        ['teste.usuario', 'teste@exemplo.com']
      );
    }
    
    // Inserir o usuário de teste
    const [result] = await connection.execute(`
      INSERT INTO users (
        username, 
        email, 
        password_hash, 
        full_name, 
        is_active, 
        is_admin,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      'teste.usuario',
      'teste@exemplo.com', 
      passwordHash,
      'Usuário de Teste',
      true,
      false
    ]);
    
    console.log('✅ Usuário de teste criado com sucesso!');
    console.log(`   ID: ${result.insertId}`);
    console.log(`   Username: teste.usuario`);
    console.log(`   Email: teste@exemplo.com`);
    console.log(`   Password: teste123`);
    console.log(`   Full Name: Usuário de Teste`);
    console.log(`   Is Active: true`);
    console.log(`   Is Admin: false\n`);
    
    // Verificar se foi inserido corretamente
    const [newUser] = await connection.execute(
      'SELECT * FROM users WHERE id = ?',
      [result.insertId]
    );
    
    if (newUser.length > 0) {
      console.log('✅ Verificação: Usuário encontrado no banco');
      console.log('   Dados completos:', newUser[0]);
    } else {
      console.log('❌ Erro: Usuário não encontrado após inserção');
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada');
    }
  }
}

// Executar o script
createTestUser();