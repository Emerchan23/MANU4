import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Carregar variáveis de ambiente
dotenv.config();

async function testDatabaseConnection() {
  console.log('🔍 Testando conectividade com MariaDB...');
  console.log(`📍 DB_DATA_PATH: ${process.env.DB_DATA_PATH}`);
  console.log(`📍 DB_HOST: ${process.env.DB_HOST}`);
  console.log(`📍 DB_NAME: ${process.env.DB_NAME}`);
  console.log(`📍 DB_USER: ${process.env.DB_USER}`);
  console.log(`📍 DB_PORT: ${process.env.DB_PORT}`);
  
  // Configuração do banco
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_maintenance',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',
    timezone: '+00:00'
  };
  
  console.log('\n📋 Configuração do banco:');
  console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   User: ${dbConfig.user}`);
  
  let connection;
  
  try {
    // Teste 1: Conectar ao banco
    console.log('\n1. Testando conexão com MariaDB...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Teste 2: Verificar versão do MariaDB
    console.log('\n2. Verificando versão do banco...');
    const [versionResult] = await connection.execute('SELECT VERSION() as version');
    console.log(`✅ Versão: ${versionResult[0].version}`);
    
    // Teste 3: Verificar banco atual
    console.log('\n3. Verificando banco de dados atual...');
    const [dbResult] = await connection.execute('SELECT DATABASE() as current_db');
    console.log(`✅ Banco atual: ${dbResult[0].current_db}`);
    
    // Teste 4: Listar tabelas
    console.log('\n4. Listando tabelas existentes...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`✅ Tabelas encontradas: ${tables.length}`);
    
    if (tables.length > 0) {
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`   - ${tableName}`);
      });
    } else {
      console.log('   ⚠️ Nenhuma tabela encontrada no banco');
    }
    
    // Teste 5: Verificar estrutura das principais tabelas
    console.log('\n5. Verificando estrutura das principais tabelas...');
    const mainTables = ['equipment', 'sectors', 'companies', 'service_orders', 'requests', 'alerts', 'notifications'];
    
    for (const tableName of mainTables) {
      try {
        const [structure] = await connection.execute(`DESCRIBE ${tableName}`);
        console.log(`✅ Tabela '${tableName}': ${structure.length} colunas`);
        
        // Contar registros
        const [countResult] = await connection.execute(`SELECT COUNT(*) as total FROM ${tableName}`);
        console.log(`   📊 Registros: ${countResult[0].total}`);
      } catch (error) {
        console.log(`❌ Tabela '${tableName}': ${error.message}`);
      }
    }
    
    console.log('\n🎉 Teste de conectividade concluído com sucesso!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro na conectividade:', error.message);
    console.error('📋 Detalhes do erro:', error.code);
    return false;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada.');
    }
  }
}

// Executar teste
testDatabaseConnection()
  .then(success => {
    console.log(`\n📊 Resultado final: ${success ? 'SUCESSO' : 'FALHA'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });