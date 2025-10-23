import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

async function checkServiceOrdersStructure() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');

    // Verificar estrutura da tabela service_orders
    console.log('\n📋 Estrutura da tabela service_orders:');
    const [columns] = await connection.execute(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        COLUMN_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMN_KEY,
        EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'service_orders'
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);

    columns.forEach(col => {
      console.log(`   ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    // Verificar especificamente os campos relacionados a maintenance_type
    console.log('\n🔍 Campos relacionados a maintenance_type:');
    const maintenanceFields = columns.filter(col => 
      col.COLUMN_NAME.includes('maintenance') || 
      col.COLUMN_NAME.includes('type')
    );
    
    maintenanceFields.forEach(col => {
      console.log(`   ✓ ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}`);
    });

    // Verificar dados de exemplo
    console.log('\n📊 Dados de exemplo da tabela service_orders:');
    const [orders] = await connection.execute(`
      SELECT id, maintenance_type_id, type, status, created_at
      FROM service_orders 
      LIMIT 3
    `);

    orders.forEach(order => {
      console.log(`   ID: ${order.id}, maintenance_type_id: ${order.maintenance_type_id}, type: ${order.type}, status: ${order.status}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão encerrada');
    }
  }
}

checkServiceOrdersStructure();