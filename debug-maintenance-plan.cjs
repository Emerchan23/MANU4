const mysql = require('mysql2/promise');

async function debugMaintenancePlan() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco de dados');
    
    // 1. Verificar agendamentos com maintenance_plan_id
    console.log('\n📋 1. Verificando agendamentos com maintenance_plan_id:');
    const [schedules] = await connection.execute(`
      SELECT 
        id,
        maintenance_plan_id,
        description,
        status
      FROM maintenance_schedules 
      WHERE maintenance_plan_id IS NOT NULL
      ORDER BY id DESC 
      LIMIT 5
    `);
    
    if (schedules.length > 0) {
      schedules.forEach(schedule => {
        console.log(`  ID: ${schedule.id}, Plan ID: ${schedule.maintenance_plan_id}, Status: ${schedule.status}`);
      });
    } else {
      console.log('  ❌ Nenhum agendamento com maintenance_plan_id encontrado!');
    }
    
    // 2. Verificar planos de manutenção disponíveis
    console.log('\n📋 2. Verificando planos de manutenção disponíveis:');
    const [plans] = await connection.execute(`
      SELECT id, name, description
      FROM maintenance_plans 
      ORDER BY id
      LIMIT 10
    `);
    
    if (plans.length > 0) {
      plans.forEach(plan => {
        console.log(`  ID: ${plan.id}, Nome: '${plan.name}', Desc: ${plan.description?.substring(0, 50)}...`);
      });
    } else {
      console.log('  ❌ Nenhum plano de manutenção encontrado!');
    }
    
    // 3. Testar o JOIN exato da API
    console.log('\n📋 3. Testando JOIN da API (últimos 5 agendamentos):');
    const [apiResult] = await connection.execute(`
      SELECT 
        ms.id,
        ms.maintenance_plan_id,
        ms.description,
        ms.status,
        mp.name as maintenance_plan_name
      FROM maintenance_schedules ms
      LEFT JOIN maintenance_plans mp ON ms.maintenance_plan_id = mp.id
      ORDER BY ms.id DESC 
      LIMIT 5
    `);
    
    apiResult.forEach(result => {
      console.log(`  ID: ${result.id}, Plan ID: ${result.maintenance_plan_id}, Plan Name: '${result.maintenance_plan_name || 'NULL'}', Status: ${result.status}`);
    });
    
    // 4. Verificar se há algum problema com os IDs
    console.log('\n📋 4. Verificando correspondência entre IDs:');
    const [mismatch] = await connection.execute(`
      SELECT 
        ms.id as schedule_id,
        ms.maintenance_plan_id,
        mp.id as plan_exists
      FROM maintenance_schedules ms
      LEFT JOIN maintenance_plans mp ON ms.maintenance_plan_id = mp.id
      WHERE ms.maintenance_plan_id IS NOT NULL
      AND mp.id IS NULL
      LIMIT 5
    `);
    
    if (mismatch.length > 0) {
      console.log('  ❌ Agendamentos com maintenance_plan_id inválido:');
      mismatch.forEach(item => {
        console.log(`    Schedule ID: ${item.schedule_id}, Plan ID: ${item.maintenance_plan_id} (não existe)`);
      });
    } else {
      console.log('  ✅ Todos os maintenance_plan_id são válidos');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugMaintenancePlan();