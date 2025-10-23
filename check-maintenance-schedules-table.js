require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkMaintenanceSchedulesTable() {
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
    console.log('\n🔍 Verificando se a tabela maintenance_schedules existe...');
    const [tables] = await connection.execute('SHOW TABLES LIKE "maintenance_schedules"');
    
    if (tables.length === 0) {
      console.log('❌ Tabela maintenance_schedules NÃO EXISTE!');
      return;
    }
    
    console.log('✅ Tabela maintenance_schedules existe!');
    
    // Verificar estrutura
    console.log('\n📋 Estrutura da tabela maintenance_schedules:');
    const [structure] = await connection.execute('DESCRIBE maintenance_schedules');
    structure.forEach(column => {
      console.log(`   ${column.Field}: ${column.Type} (${column.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // Verificar dados de exemplo
    console.log('\n📊 Dados de exemplo da tabela maintenance_schedules:');
    const [schedules] = await connection.execute(`
      SELECT id, equipment_id, scheduled_date, status, maintenance_type, created_at
      FROM maintenance_schedules 
      LIMIT 3
    `);
    
    if (schedules.length > 0) {
      schedules.forEach(schedule => {
        console.log(`   ID: ${schedule.id}, Equipment: ${schedule.equipment_id}, Date: ${schedule.scheduled_date}, Status: ${schedule.status}`);
      });
    } else {
      console.log('   Nenhum agendamento encontrado na tabela.');
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

checkMaintenanceSchedulesTable();