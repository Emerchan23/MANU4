const mysql = require('mysql2/promise');

async function checkDatabaseStructure() {
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

    // 1. Verificar se a tabela users existe
    console.log('\n📋 Verificando estrutura da tabela users...');
    try {
      const [tables] = await connection.execute("SHOW TABLES LIKE 'users'");
      if (tables.length === 0) {
        console.log('❌ Tabela users NÃO existe!');
        return;
      }
      console.log('✅ Tabela users existe');
    } catch (error) {
      console.log('❌ Erro ao verificar tabela users:', error.message);
      return;
    }

    // 2. Verificar estrutura da tabela users
    console.log('\n🔍 Estrutura da tabela users:');
    try {
      const [columns] = await connection.execute("DESCRIBE users");
      console.table(columns);
    } catch (error) {
      console.log('❌ Erro ao descrever tabela users:', error.message);
    }

    // 3. Verificar se existem usuários
    console.log('\n👥 Verificando usuários existentes...');
    try {
      const [users] = await connection.execute("SELECT id, username, email, full_name, is_active FROM users LIMIT 5");
      if (users.length === 0) {
        console.log('❌ Nenhum usuário encontrado na tabela!');
      } else {
        console.log(`✅ Encontrados ${users.length} usuários:`);
        console.table(users);
      }
    } catch (error) {
      console.log('❌ Erro ao buscar usuários:', error.message);
    }

    // 4. Verificar outras tabelas relacionadas à autenticação
    console.log('\n🔐 Verificando outras tabelas de autenticação...');
    const authTables = ['roles', 'user_roles', 'sessions', 'permissions'];
    
    for (const tableName of authTables) {
      try {
        const [tables] = await connection.execute(`SHOW TABLES LIKE '${tableName}'`);
        if (tables.length > 0) {
          console.log(`✅ Tabela ${tableName} existe`);
          const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
          console.log(`   📊 Registros: ${count[0].count}`);
        } else {
          console.log(`❌ Tabela ${tableName} NÃO existe`);
        }
      } catch (error) {
        console.log(`❌ Erro ao verificar tabela ${tableName}:`, error.message);
      }
    }

    // 5. Verificar se há um usuário admin padrão
    console.log('\n👑 Verificando usuário admin...');
    try {
      const [adminUsers] = await connection.execute(
        "SELECT id, username, email, full_name, is_active FROM users WHERE username = 'admin' OR email = 'admin@hospital.com'"
      );
      if (adminUsers.length === 0) {
        console.log('❌ Nenhum usuário admin encontrado!');
      } else {
        console.log('✅ Usuário admin encontrado:');
        console.table(adminUsers);
      }
    } catch (error) {
      console.log('❌ Erro ao buscar usuário admin:', error.message);
    }

  } catch (error) {
    console.log('❌ Erro de conexão com o banco:', error.message);
    console.log('🔧 Verifique as configurações do banco no arquivo .env');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar verificação
checkDatabaseStructure().catch(console.error);