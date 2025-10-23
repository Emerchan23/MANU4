const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function createTestUser() {
  let connection;
  
  try {
    // Conectar ao banco de dados
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('✅ Conectado ao banco de dados MariaDB');

    // Gerar hash da senha 'teste123'
    const passwordHash = await bcrypt.hash('teste123', 10);
    console.log('✅ Hash da senha gerado');

    // Inserir usuário de teste
    const insertQuery = `
      INSERT INTO users (username, email, password_hash, full_name, is_active, is_admin)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const userData = [
      'teste.usuario',
      'teste@exemplo.com', 
      passwordHash,
      'Usuário de Teste',
      true,
      false
    ];

    const [result] = await connection.execute(insertQuery, userData);
    
    console.log('✅ Usuário de teste criado com sucesso!');
    console.log(`   ID do usuário: ${result.insertId}`);
    console.log(`   Username: teste.usuario`);
    console.log(`   Email: teste@exemplo.com`);
    console.log(`   Nome: Usuário de Teste`);
    console.log(`   Senha: teste123`);

    // Verificar se o usuário foi inserido corretamente
    const [users] = await connection.execute(
      'SELECT id, username, email, full_name, is_active, is_admin, created_at FROM users WHERE username = ?',
      ['teste.usuario']
    );

    if (users.length > 0) {
      console.log('\n✅ Verificação: Usuário encontrado no banco:');
      console.table(users[0]);
      return users[0].id;
    } else {
      console.log('❌ Erro: Usuário não foi encontrado após inserção');
      return null;
    }

  } catch (error) {
    console.error('❌ Erro ao criar usuário de teste:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('⚠️  Usuário já existe. Buscando ID do usuário existente...');
      try {
        const [existingUsers] = await connection.execute(
          'SELECT id, username, email, full_name FROM users WHERE username = ? OR email = ?',
          ['teste.usuario', 'teste@exemplo.com']
        );
        
        if (existingUsers.length > 0) {
          console.log('✅ Usuário existente encontrado:');
          console.table(existingUsers[0]);
          return existingUsers[0].id;
        }
      } catch (searchError) {
        console.error('❌ Erro ao buscar usuário existente:', searchError);
      }
    }
    
    return null;
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Conexão com banco fechada');
    }
  }
}

// Executar a função
createTestUser().then((userId) => {
  if (userId) {
    console.log(`\n🎉 Usuário de teste pronto! ID: ${userId}`);
    console.log('Agora você pode testar a edição deste usuário.');
  } else {
    console.log('\n❌ Falha ao criar/encontrar usuário de teste');
  }
}).catch(console.error);