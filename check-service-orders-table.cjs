const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkServiceOrdersTable() {
  console.log('🔍 Verificando estrutura da tabela service_orders...');
  
  // Configuração do banco de dados
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_maintenance',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',
    timezone: '+00:00'
  };

  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');
    
    // 1. Verificar se a tabela existe
    console.log('\n📋 Verificando se a tabela service_orders existe...');
    const [tables] = await connection.execute(`
      SHOW TABLES LIKE 'service_orders'
    `);
    
    if (tables.length === 0) {
      console.log('❌ Tabela service_orders não existe!');
      return;
    }
    
    console.log('✅ Tabela service_orders existe');
    
    // 2. Verificar estrutura da tabela
    console.log('\n📋 Verificando estrutura da tabela service_orders...');
    const [columns] = await connection.execute('DESCRIBE service_orders');
    
    console.log('Colunas da tabela:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default !== null ? `DEFAULT: ${col.Default}` : ''}`);
    });
    
    // 3. Verificar se a coluna 'type' existe
    const typeColumn = columns.find(col => col.Field === 'type');
    if (!typeColumn) {
      console.log('\n❌ Coluna "type" não existe na tabela service_orders!');
      console.log('🔧 Adicionando coluna "type"...');
      
      await connection.execute(`
        ALTER TABLE service_orders 
        ADD COLUMN type ENUM('PREVENTIVA', 'CORRETIVA', 'PREDITIVA', 'EMERGENCIAL') DEFAULT 'PREVENTIVA'
      `);
      
      console.log('✅ Coluna "type" adicionada com sucesso!');
    } else {
      console.log('\n✅ Coluna "type" existe:', typeColumn.Type);
    }
    
    // 4. Verificar se a coluna 'cost' existe
    const costColumn = columns.find(col => col.Field === 'cost');
    if (!costColumn) {
      console.log('\n❌ Coluna "cost" não existe na tabela service_orders!');
      console.log('🔧 Adicionando coluna "cost"...');
      
      await connection.execute(`
        ALTER TABLE service_orders 
        ADD COLUMN cost DECIMAL(10,2) DEFAULT 0.00
      `);
      
      console.log('✅ Coluna "cost" adicionada com sucesso!');
    } else {
      console.log('\n✅ Coluna "cost" existe:', costColumn.Type);
    }
    
    // 5. Verificar estrutura final
    console.log('\n📋 Estrutura final da tabela service_orders:');
    const [finalColumns] = await connection.execute('DESCRIBE service_orders');
    
    finalColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default !== null ? `DEFAULT: ${col.Default}` : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('❌ Stack trace:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada.');
    }
  }
}

checkServiceOrdersTable();