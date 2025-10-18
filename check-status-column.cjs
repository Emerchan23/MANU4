const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  charset: 'utf8mb4'
};

async function checkStatusColumn() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    console.log('🔍 Verificando estrutura da coluna status na tabela maintenance_schedules...');
    
    const [columns] = await connection.execute(
      `SELECT COLUMN_TYPE, COLUMN_DEFAULT, IS_NULLABLE 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = 'hospital_maintenance' 
       AND TABLE_NAME = 'maintenance_schedules' 
       AND COLUMN_NAME = 'status'`
    );
    
    console.log('📊 Estrutura da coluna status:', columns[0]);
    
    console.log('\n🔍 Verificando valores únicos de status na tabela...');
    const [statusValues] = await connection.execute(
      `SELECT DISTINCT status, COUNT(*) as count 
       FROM maintenance_schedules 
       GROUP BY status`
    );
    
    console.log('📊 Valores de status existentes:', statusValues);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkStatusColumn();