const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createTestUser() {
  let connection;
  
  try {
    console.log('🔌 Conectando ao banco de dados MariaDB...');
    
    // Configuração da conexão (usando as mesmas configurações do projeto)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance',
      port: 3306
    });

    console.log('✅ Conectado ao banco de dados');

    // Gerar hash da senha
    const password = 'teste123';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    console.log('🔐 Hash da senha gerado:', passwordHash);

    // Dados do usuário de teste
    const userData = {
      username: 'teste.usuario',
      email: 'teste@exemplo.com',
      password_hash: passwordHash,
      full_name: 'Usuário de Teste',
      is_active: true,
      is_admin: false
    };

    console.log('👤 Dados do usuário a ser criado:', {
      ...userData,
      password_hash: '[HASH OCULTO]'
    });

    // Verificar se o usuário já existe
    const [existingUsers] = await connection.execute(
      'SELECT id, username, email FROM users WHERE username = ? OR email = ?',
      [userData.username, userData.email]
    );

    if (existingUsers.length > 0) {
      console.log('⚠️ Usuário já existe:', existingUsers[0]);
      console.log('🗑️ Removendo usuário existente...');
      
      // Remover roles do usuário
      await connection.execute(
        'DELETE FROM user_roles WHERE user_id = ?',
        [existingUsers[0].id]
      );
      
      // Remover usuário
      await connection.execute(
        'DELETE FROM users WHERE id = ?',
        [existingUsers[0].id]
      );
      
      console.log('✅ Usuário existente removido');
    }

    // Inserir novo usuário
    const [result] = await connection.execute(
      `INSERT INTO users (username, email, password_hash, full_name, is_active, is_admin, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        userData.username,
        userData.email,
        userData.password_hash,
        userData.full_name,
        userData.is_active,
        userData.is_admin
      ]
    );

    const userId = result.insertId;
    console.log('✅ Usuário criado com sucesso! ID:', userId);

    // Buscar o usuário criado para confirmar
    const [createdUser] = await connection.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    console.log('📋 Usuário criado:', {
      id: createdUser[0].id,
      username: createdUser[0].username,
      email: createdUser[0].email,
      full_name: createdUser[0].full_name,
      is_active: createdUser[0].is_active,
      is_admin: createdUser[0].is_admin,
      created_at: createdUser[0].created_at
    });

    return userId;

  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error.message);
    console.error('📊 Stack trace:', error.stack);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

// Executar a função
createTestUser()
  .then((userId) => {
    console.log(`🎉 Usuário de teste criado com sucesso! ID: ${userId}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha ao criar usuário de teste:', error.message);
    process.exit(1);
  });