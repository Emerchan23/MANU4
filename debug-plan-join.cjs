const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

async function debugPlanJoin() {
  let connection;
  
  try {
    console.log('🔄 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    
    // Testar JOIN simples
    console.log('\n🔍 Testando JOIN com maintenance_plans...');
    const [apiResult] = await connection.execute(`
      SELECT 
        ms.id,
        ms.maintenance_plan_id,
        mp.name as maintenance_plan_name
      FROM maintenance_schedules ms
      LEFT JOIN maintenance_plans mp ON ms.maintenance_plan_id = mp.id
      WHERE ms.id = 53
    `);
    
    console.log('Resultado para agendamento #53:', apiResult);
    
    // Verificar se o plano existe
    if (apiResult.length > 0 && apiResult[0].maintenance_plan_id) {
      console.log('\n📋 Verificando se o plano existe...');
      const [planCheck] = await connection.execute(`
        SELECT id, name FROM maintenance_plans WHERE id = ?
      `, [apiResult[0].maintenance_plan_id]);
      
      console.log('Plano encontrado:', planCheck);
    }
    
    // Verificar todos os planos
    console.log('\n📋 Todos os planos de manutenção:');
    const [allPlans] = await connection.execute(`
      SELECT id, name FROM maintenance_plans ORDER BY id
    `);
    
    console.log('Total de planos:', allPlans.length);
    allPlans.forEach(plan => {
      console.log(`- ID: ${plan.id}, Nome: ${plan.name}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugPlanJoin();