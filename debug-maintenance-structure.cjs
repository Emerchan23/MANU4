const mysql = require('mysql2/promise');

async function checkMaintenanceSchedulesStructure() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_maintenance'
  });

  try {
    console.log('🔍 Verificando estrutura da tabela maintenance_schedules...');
    
    // Verificar estrutura da tabela
    const [columns] = await connection.execute('DESCRIBE maintenance_schedules');
    console.log('📊 Colunas da tabela maintenance_schedules:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    console.log('\n🔍 Verificando dados de exemplo...');
    
    // Buscar alguns registros para ver os dados
    const [schedules] = await connection.execute(`
      SELECT 
        id, 
        maintenance_type, 
        maintenance_plan_id,
        status,
        equipment_id
      FROM maintenance_schedules 
      LIMIT 5
    `);
    
    console.log('📊 Exemplos de agendamentos:');
    schedules.forEach(schedule => {
      console.log(`  ID: ${schedule.id}, Type: ${schedule.maintenance_type}, Plan ID: ${schedule.maintenance_plan_id}, Status: ${schedule.status}`);
    });
    
    console.log('\n🔍 Verificando planos de manutenção...');
    
    // Verificar planos de manutenção
    const [plans] = await connection.execute(`
      SELECT id, name, maintenance_type, description 
      FROM maintenance_plans 
      LIMIT 5
    `);
    
    console.log('📊 Exemplos de planos de manutenção:');
    plans.forEach(plan => {
      console.log(`  ID: ${plan.id}, Name: ${plan.name}, Type: ${plan.maintenance_type}`);
    });
    
    console.log('\n🔍 Verificando tipos de manutenção...');
    
    // Verificar tipos de manutenção
    const [types] = await connection.execute(`
      SELECT id, name, description 
      FROM maintenance_types 
      LIMIT 10
    `);
    
    console.log('📊 Tipos de manutenção disponíveis:');
    types.forEach(type => {
      console.log(`  ID: ${type.id}, Name: ${type.name}, Description: ${type.description}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

checkMaintenanceSchedulesStructure();