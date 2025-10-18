import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkServiceOrdersTable() {
  let connection;
  
  try {
    console.log('🔌 Conectando ao banco de dados...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance',
    });
    
    console.log('✅ Conectado ao banco de dados\n');
    
    // Verificar estrutura da tabela service_orders
    console.log('📋 Estrutura da tabela service_orders:');
    console.log('='.repeat(80));
    const [columns] = await connection.execute('DESCRIBE service_orders');
    console.table(columns);
    
    // Verificar se existem registros
    console.log('\n📊 Contagem de registros:');
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM service_orders');
    console.log(`Total de ordens de serviço: ${count[0].total}`);
    
    // Verificar alguns registros de exemplo
    if (count[0].total > 0) {
      console.log('\n📄 Exemplo de registros (últimos 3):');
      console.log('='.repeat(80));
      const [rows] = await connection.execute(`
        SELECT 
          id, 
          order_number, 
          type, 
          maintenance_type_id,
          company_id, 
          cost, 
          observations,
          created_at,
          updated_at
        FROM service_orders 
        ORDER BY id DESC 
        LIMIT 3
      `);
      console.table(rows);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada');
    }
  }
}

checkServiceOrdersTable();
