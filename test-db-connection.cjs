const mysql = require('mysql2/promise');

async function testConnection() {
  const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance',
    charset: 'utf8mb4',
    timezone: '+00:00'
  };

  try {
    console.log('🔍 Testando conexão com o banco de dados...');
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Testar se a tabela service_orders existe
    console.log('🔍 Verificando se a tabela service_orders existe...');
    const [tables] = await connection.execute("SHOW TABLES LIKE 'service_orders'");
    
    if (tables.length > 0) {
      console.log('✅ Tabela service_orders encontrada!');
      
      // Verificar estrutura da tabela
      console.log('🔍 Verificando estrutura da tabela service_orders...');
      const [columns] = await connection.execute("DESCRIBE service_orders");
      console.log('📋 Colunas da tabela service_orders:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
      });
      
      // Contar registros
      console.log('🔍 Contando registros na tabela service_orders...');
      const [count] = await connection.execute("SELECT COUNT(*) as total FROM service_orders");
      console.log(`📊 Total de registros: ${count[0].total}`);
      
      if (count[0].total > 0) {
        // Mostrar alguns registros
        console.log('🔍 Primeiros 5 registros:');
        const [records] = await connection.execute("SELECT * FROM service_orders LIMIT 5");
        console.log(records);
      }
    } else {
      console.log('❌ Tabela service_orders não encontrada!');
      
      // Listar todas as tabelas
      console.log('🔍 Listando todas as tabelas do banco:');
      const [allTables] = await connection.execute("SHOW TABLES");
      console.log('📋 Tabelas encontradas:');
      allTables.forEach(table => {
        console.log(`  - ${Object.values(table)[0]}`);
      });
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco:', error);
  }
}

testConnection();