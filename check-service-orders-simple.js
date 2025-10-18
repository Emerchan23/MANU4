require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkServiceOrders() {
  let connection;
  try {
    console.log('🔍 Conectando ao banco de dados...');
    console.log('Host:', process.env.DB_HOST || 'localhost');
    console.log('Database:', process.env.DB_NAME || 'hospital_maintenance');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance',
      charset: 'utf8mb4'
    });
    
    console.log('✅ Conectado ao banco de dados!');
    
    // Verificar se a tabela existe
    console.log('\n🔍 Verificando se a tabela service_orders existe...');
    const [tables] = await connection.execute('SHOW TABLES LIKE "service_orders"');
    
    if (tables.length === 0) {
      console.log('❌ Tabela service_orders NÃO EXISTE!');
      console.log('\n🔍 Listando todas as tabelas disponíveis:');
      const [allTables] = await connection.execute('SHOW TABLES');
      allTables.forEach(table => {
        console.log('  -', Object.values(table)[0]);
      });
    } else {
      console.log('✅ Tabela service_orders existe!');
      
      // Verificar estrutura
      console.log('\n📋 Estrutura da tabela:');
      const [structure] = await connection.execute('DESCRIBE service_orders');
      structure.forEach(column => {
        console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'NO' ? '(NOT NULL)' : ''}`);
      });
      
      // Contar registros
      console.log('\n📊 Contando registros...');
      const [count] = await connection.execute('SELECT COUNT(*) as total FROM service_orders');
      console.log(`  Total de registros: ${count[0].total}`);
      
      // Mostrar alguns registros
      if (count[0].total > 0) {
        console.log('\n📄 Primeiros 3 registros:');
        const [rows] = await connection.execute('SELECT * FROM service_orders LIMIT 3');
        rows.forEach((row, index) => {
          console.log(`\n  Registro ${index + 1}:`);
          console.log('    ID:', row.id);
          console.log('    Order Number:', row.order_number);
          console.log('    Equipment ID:', row.equipment_id);
          console.log('    Status:', row.status);
          console.log('    Priority:', row.priority);
          console.log('    Created At:', row.created_at);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Código:', error.code);
    console.error('SQL State:', error.sqlState);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada.');
    }
  }
}

checkServiceOrders();
