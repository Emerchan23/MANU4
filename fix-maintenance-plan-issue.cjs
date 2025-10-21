const mysql = require('mysql2/promise');

async function fixMaintenancePlanIssue() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco de dados');
    
    // 1. Verificar estrutura das tabelas
    console.log('\n📋 1. Verificando estrutura da tabela maintenance_schedules:');
    const [scheduleStructure] = await connection.execute(`DESCRIBE maintenance_schedules`);
    scheduleStructure.forEach(column => {
      if (column.Field === 'maintenance_plan_id') {
        console.log(`  ✅ Campo maintenance_plan_id encontrado: ${column.Type}, NULL: ${column.Null}, Default: ${column.Default}`);
      }
    });
    
    console.log('\n📋 2. Verificando estrutura da tabela maintenance_plans:');
    const [planStructure] = await connection.execute(`DESCRIBE maintenance_plans`);
    planStructure.forEach(column => {
      if (column.Field === 'id' || column.Field === 'name') {
        console.log(`  Campo ${column.Field}: ${column.Type}, NULL: ${column.Null}, Key: ${column.Key}`);
      }
    });
    
    // 2. Testar JOIN manualmente com dados específicos
    console.log('\n📋 3. Testando JOIN manual com agendamento ID 53:');
    const [manualJoin] = await connection.execute(`
      SELECT 
        ms.id,
        ms.maintenance_plan_id,
        mp.id as plan_id,
        mp.name as plan_name
      FROM maintenance_schedules ms
      LEFT JOIN maintenance_plans mp ON ms.maintenance_plan_id = mp.id
      WHERE ms.id = 53
    `);
    
    if (manualJoin.length > 0) {
      const result = manualJoin[0];
      console.log(`  Schedule ID: ${result.id}`);
      console.log(`  maintenance_plan_id: ${result.maintenance_plan_id}`);
      console.log(`  plan_id: ${result.plan_id}`);
      console.log(`  plan_name: '${result.plan_name}'`);
    }
    
    // 3. Verificar se o plano ID 1 existe
    console.log('\n📋 4. Verificando se o plano ID 1 existe:');
    const [planCheck] = await connection.execute(`
      SELECT id, name, description
      FROM maintenance_plans 
      WHERE id = 1
    `);
    
    if (planCheck.length > 0) {
      console.log(`  ✅ Plano ID 1 encontrado: '${planCheck[0].name}'`);
    } else {
      console.log('  ❌ Plano ID 1 não encontrado!');
    }
    
    // 4. Atualizar alguns agendamentos para teste
    console.log('\n📋 5. Atualizando agendamentos para teste:');
    
    // Atualizar os últimos 3 agendamentos para ter maintenance_plan_id = 1
    const [updateResult] = await connection.execute(`
      UPDATE maintenance_schedules 
      SET maintenance_plan_id = 1 
      WHERE id IN (
        SELECT * FROM (
          SELECT id FROM maintenance_schedules 
          ORDER BY id DESC 
          LIMIT 3
        ) as temp
      )
    `);
    
    console.log(`  ✅ ${updateResult.affectedRows} agendamentos atualizados com maintenance_plan_id = 1`);
    
    // 5. Testar novamente o JOIN
    console.log('\n📋 6. Testando JOIN após atualização:');
    const [finalTest] = await connection.execute(`
      SELECT 
        ms.id,
        ms.maintenance_plan_id,
        mp.name as maintenance_plan_name
      FROM maintenance_schedules ms
      LEFT JOIN maintenance_plans mp ON ms.maintenance_plan_id = mp.id
      WHERE ms.maintenance_plan_id IS NOT NULL
      ORDER BY ms.id DESC 
      LIMIT 5
    `);
    
    finalTest.forEach(result => {
      console.log(`  ID: ${result.id}, Plan ID: ${result.maintenance_plan_id}, Plan Name: '${result.maintenance_plan_name || 'NULL'}'`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixMaintenancePlanIssue();