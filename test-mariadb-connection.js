import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Carregar variáveis de ambiente ANTES de qualquer coisa
dotenv.config();

async function testMariaDBConnection() {
  console.log('🔍 Testando conexão com MariaDB...');
  console.log('\n📋 Variáveis de ambiente:');
  console.log(`DB_HOST: ${process.env.DB_HOST}`);
  console.log(`DB_USER: ${process.env.DB_USER}`);
  console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? '[DEFINIDA]' : '[NÃO DEFINIDA]'}`);
  console.log(`DB_NAME: ${process.env.DB_NAME}`);
  console.log(`DB_PORT: ${process.env.DB_PORT}`);
  console.log(`DB_DATA_PATH: ${process.env.DB_DATA_PATH}`);
  
  // Configuração do banco de dados
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT) || 3306,
    charset: 'utf8mb4',
    timezone: '+00:00'
  };
  
  console.log('\n🔧 Configuração de conexão:');
  console.log(`Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`User: ${dbConfig.user}`);
  console.log(`Password: ${dbConfig.password ? '[DEFINIDA]' : '[VAZIA]'}`);
  
  try {
    // Testar conexão básica sem especificar database
    console.log('\n1. Testando conexão básica com MySQL/MariaDB...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexão com MariaDB estabelecida com sucesso!');
    
    // Verificar se o banco de dados existe
    console.log('\n2. Verificando banco de dados...');
    const [databases] = await connection.execute('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === 'hospital_maintenance');
    console.log(`Database 'hospital_maintenance' existe: ${dbExists ? '✅ SIM' : '❌ NÃO'}`);
    
    if (!dbExists) {
      console.log('💡 Criando banco de dados hospital_maintenance...');
      await connection.execute('CREATE DATABASE IF NOT EXISTS hospital_maintenance');
      console.log('✅ Banco de dados criado!');
    }
    
    // Conectar ao banco específico
    await connection.query('USE hospital_maintenance');
    
    // Verificar tabelas
    console.log('\n3. Verificando tabelas...');
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tabelas encontradas:');
    if (tables.length === 0) {
      console.log('❌ Nenhuma tabela encontrada!');
    } else {
      tables.forEach(table => {
        console.log(`  - ${Object.values(table)[0]}`);
      });
    }
    
    // Verificar especificamente a tabela users
    console.log('\n4. Verificando tabela users...');
    const userTableExists = tables.some(table => Object.values(table)[0] === 'users');
    console.log(`Tabela 'users' existe: ${userTableExists ? '✅ SIM' : '❌ NÃO'}`);
    
    if (userTableExists) {
      // Verificar estrutura da tabela users
      console.log('\n5. Estrutura da tabela users:');
      const [userTableStructure] = await connection.query('DESCRIBE users');
      userTableStructure.forEach(column => {
        console.log(`  - ${column.Field} (${column.Type}) ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key ? column.Key : ''}`);
      });
      
      // Verificar usuários existentes
      console.log('\n6. Usuários cadastrados:');
      const [users] = await connection.query('SELECT id, nick, name, role, is_active FROM users');
      if (users.length === 0) {
        console.log('❌ Nenhum usuário encontrado na tabela!');
        console.log('💡 Será necessário criar usuários de teste.');
      } else {
        users.forEach(user => {
          console.log(`  - ID: ${user.id}, Nick: ${user.nick}, Nome: ${user.name}, Role: ${user.role}, Ativo: ${user.is_active}`);
        });
      }
    } else {
      console.log('❌ ERRO: Tabela users não encontrada!');
      console.log('💡 Será necessário criar a tabela users.');
      
      // Criar tabela users básica
      console.log('\n🔨 Criando tabela users...');
      const createUserTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nick VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(100) NOT NULL,
          role ENUM('admin', 'gestor', 'usuario') DEFAULT 'usuario',
          sector_id INT DEFAULT NULL,
          permissions JSON DEFAULT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `;
      
      await connection.query(createUserTable);
      console.log('✅ Tabela users criada com sucesso!');
      
      // Criar usuários de teste
      console.log('\n👤 Criando usuários de teste...');
      const bcrypt = await import('bcrypt');
      const adminPassword = await bcrypt.hash('admin123', 10);
      const userPassword = await bcrypt.hash('usuario123', 10);
      
      await connection.execute(`
        INSERT INTO users (nick, password, name, role, permissions) VALUES 
        ('admin', ?, 'Administrador', 'admin', '{}'),
        ('usuario', ?, 'Usuário Comum', 'usuario', '{}')
        ON DUPLICATE KEY UPDATE name = VALUES(name)
      `, [adminPassword, userPassword]);
      
      console.log('✅ Usuários de teste criados:');
      console.log('  - admin / admin123 (role: admin)');
      console.log('  - usuario / usuario123 (role: usuario)');
    }
    
    await connection.end();
    console.log('\n✅ Conexão fechada com sucesso.');
    
  } catch (error) {
    console.error('❌ ERRO na conexão com MariaDB:', error.message);
    console.error('Código do erro:', error.code);
    console.error('Detalhes:', error.sqlMessage || error.message);
    
    // Diagnósticos adicionais
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔍 DIAGNÓSTICO:');
      console.log('- Verifique se o XAMPP está rodando');
      console.log('- Verifique se o MySQL/MariaDB está ativo no XAMPP');
      console.log('- Verifique se a porta 3306 está disponível');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n🔍 DIAGNÓSTICO:');
      console.log('- Verifique as credenciais do banco de dados');
      console.log('- Verifique se o usuário tem permissões adequadas');
    }
  }
}

// Executar teste
testMariaDBConnection().then(() => {
  console.log('\n🏁 Teste de conexão finalizado.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});