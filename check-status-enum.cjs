const mysql = require('mysql2/promise');

async function checkStatusEnum() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  try {
    // Verificar ENUM do status na tabela service_orders
    const [columns] = await connection.execute(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'hospital_maintenance' 
      AND TABLE_NAME = 'service_orders' 
      AND COLUMN_NAME = 'status'
    `);
    
    console.log('📊 ENUM do status na tabela service_orders:');
    console.log(columns[0]?.COLUMN_TYPE || 'Coluna não encontrada');
    
    // Verificar valores únicos de status existentes
    const [statusValues] = await connection.execute(`
      SELECT DISTINCT status, COUNT(*) as count
      FROM service_orders 
      GROUP BY status
      ORDER BY status
    `);
    
    console.log('\n📊 Valores de status existentes no banco:');
    statusValues.forEach(row => {
      console.log(`  - ${row.status}: ${row.count} registros`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

checkStatusEnum();