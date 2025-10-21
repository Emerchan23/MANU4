require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkUsersTable() {
  let connection;
  
  try {
    console.log('🔍 Verificando estrutura da tabela users...\n');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sistema_manutencao'
    });

    // Verificar se tabela users existe
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'users'"
    );

    if (tables.length === 0) {
      console.log('❌ Tabela users não existe. Criando...');
      
      await connection.execute(`
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nick VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(100) NOT NULL,
          profile ENUM('admin', 'gestor', 'usuario') DEFAULT 'usuario',
          active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ Tabela users criada com sucesso!');
    } else {
      console.log('✅ Tabela users existe');
    }

    // Verificar estrutura da tabela
    const [structure] = await connection.execute('DESCRIBE users');
    console.log('\n📋 Estrutura da tabela users:');
    structure.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    // Verificar usuários existentes
    const [users] = await connection.execute('SELECT nick, name, profile, active FROM users');
    console.log(`\n👥 Usuários existentes: ${users.length}`);
    
    if (users.length > 0) {
      users.forEach(user => {
        console.log(`   - ${user.nick} (${user.name}) - ${user.profile} - ${user.active ? 'Ativo' : 'Inativo'}`);
      });
    }

    // Verificar se existe usuário admin
    const [adminUsers] = await connection.execute(
      "SELECT * FROM users WHERE profile = 'admin' AND active = TRUE"
    );

    if (adminUsers.length === 0) {
      console.log('\n⚠️  Nenhum usuário admin ativo encontrado!');
      return false;
    } else {
      console.log(`\n✅ ${adminUsers.length} usuário(s) admin ativo(s) encontrado(s)`);
      return true;
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkUsersTable().then(hasAdmin => {
  if (!hasAdmin) {
    console.log('\n🔧 Execute o próximo script para criar usuário admin padrão');
  }
});