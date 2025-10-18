const mysql = require('mysql2/promise');

async function checkTriggers() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  try {
    console.log('🔍 Verificando triggers na tabela service_orders...');
    
    // Verificar triggers
    const [triggers] = await connection.execute('SHOW TRIGGERS LIKE "service_orders"');
    
    if (triggers.length > 0) {
      console.log('📋 Triggers encontrados:');
      triggers.forEach(trigger => {
        console.log('  -', trigger.Trigger, ':', trigger.Event, trigger.Timing);
        console.log('    Statement:', trigger.Statement.substring(0, 200) + '...');
      });
    } else {
      console.log('  Nenhum trigger encontrado');
    }
    
    // Verificar se há algum default ou constraint que possa estar alterando os valores
    console.log('\n🔧 Verificando constraints e defaults...');
    const [constraints] = await connection.execute(`
      SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE, TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = 'hospital_maintenance' AND TABLE_NAME = 'service_orders'
    `);
    
    if (constraints.length > 0) {
      console.log('📋 Constraints encontrados:');
      constraints.forEach(constraint => {
        console.log('  -', constraint.CONSTRAINT_NAME, ':', constraint.CONSTRAINT_TYPE);
      });
    } else {
      console.log('  Nenhum constraint encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

checkTriggers();