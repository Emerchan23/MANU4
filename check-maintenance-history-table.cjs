require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkMaintenanceHistoryTable() {
  let connection;
  try {
    console.log('🔍 Conectando ao banco de dados...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance',
      charset: 'utf8mb4'
    });
    
    console.log('✅ Conectado ao banco de dados!');
    
    // Verificar se a tabela existe
    console.log('\n🔍 Verificando se a tabela maintenance_history existe...');
    const [tables] = await connection.execute('SHOW TABLES LIKE "maintenance_history"');
    
    if (tables.length === 0) {
      console.log('❌ Tabela maintenance_history NÃO EXISTE!');
      return;
    }
    
    console.log('✅ Tabela maintenance_history existe!');
    
    // Verificar estrutura
    console.log('\n📋 Estrutura da tabela maintenance_history:');
    const [structure] = await connection.execute('DESCRIBE maintenance_history');
    structure.forEach(column => {
      console.log(`   ${column.Field}: ${column.Type} (${column.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // Verificar dados de exemplo
    console.log('\n📊 Dados de exemplo da tabela maintenance_history:');
    const [history] = await connection.execute(`
      SELECT id, equipment_id, created_at
      FROM maintenance_history 
      LIMIT 3
    `);
    
    if (history.length > 0) {
      history.forEach(record => {
        console.log(`   ID: ${record.id}, Equipment: ${record.equipment_id}, Created: ${record.created_at}`);
      });
    } else {
      console.log('   Nenhum histórico encontrado na tabela.');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada.');
    }
  }
}

checkMaintenanceHistoryTable();