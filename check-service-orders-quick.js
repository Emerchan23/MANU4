import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function checkServiceOrdersTable() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao banco de dados...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance',
      port: process.env.DB_PORT || 3306
    });
    
    console.log('✅ Conectado ao banco de dados');
    
    // Verificar estrutura da tabela service_orders
    console.log('\n📋 Estrutura da tabela service_orders:');
    const [structure] = await connection.execute('DESCRIBE service_orders');
    
    structure.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${column.Key ? `[${column.Key}]` : ''}`);
    });
    
    // Verificar dados de exemplo
    console.log('\n📊 Dados de exemplo (primeiros 3 registros):');
    const [sampleData] = await connection.execute('SELECT * FROM service_orders LIMIT 3');
    
    if (sampleData.length > 0) {
      console.log('Colunas disponíveis:', Object.keys(sampleData[0]).join(', '));
      sampleData.forEach((row, index) => {
        console.log(`Registro ${index + 1}:`, row);
      });
    } else {
      console.log('Nenhum registro encontrado na tabela.');
    }
    
    console.log('\n✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkServiceOrdersTable();