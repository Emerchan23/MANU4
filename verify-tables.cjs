const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyTables() {
  let connection;
  
  try {
    console.log('🔍 Verificando tabelas de manutenção...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    // Verificar tabelas de manutenção
    const [tables] = await connection.execute('SHOW TABLES LIKE "maintenance_%"');
    console.log('\n📋 Tabelas de manutenção encontradas:');
    tables.forEach(t => console.log(`  - ${Object.values(t)[0]}`));
    
    // Verificar dados na maintenance_plans
    const [plans] = await connection.execute('SELECT id, name, maintenance_type FROM maintenance_plans LIMIT 5');
    console.log('\n📊 Planos de manutenção:');
    plans.forEach(p => console.log(`  ${p.id}: ${p.name} (${p.maintenance_type})`));
    
    // Verificar estrutura da maintenance_schedules
    const [scheduleColumns] = await connection.execute('DESCRIBE maintenance_schedules');
    console.log('\n🏗️ Estrutura da tabela maintenance_schedules:');
    scheduleColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    console.log('\n✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyTables();