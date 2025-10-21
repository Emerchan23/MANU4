const mysql = require('mysql2/promise');

async function debugQuery() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('🔍 Testando a query da API...');
    
    // Query original da API
    const [result1] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM maintenance_schedules ms 
      LEFT JOIN equipment e ON ms.equipment_id = e.id 
      WHERE ms.status IN ('AGENDADA', 'SCHEDULED') AND e.company_id = ?
    `, [1]);
    
    console.log('📊 Query com JOIN (API atual):', result1[0].count);
    
    // Query sem JOIN para testar
    const [result2] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM maintenance_schedules ms 
      WHERE ms.status IN ('AGENDADA', 'SCHEDULED') AND ms.company_id = ?
    `, [1]);
    
    console.log('📊 Query sem JOIN (direto na tabela):', result2[0].count);
    
    // Verificar equipamentos
    const [equipments] = await connection.execute('SELECT id, company_id FROM equipment WHERE id IN (1,2,3,4)');
    console.log('🔧 Equipamentos (IDs 1-4):', equipments);
    
    // Verificar dados específicos
    const [schedules] = await connection.execute(`
      SELECT ms.id, ms.status, ms.company_id, ms.equipment_id, e.company_id as eq_company_id
      FROM maintenance_schedules ms 
      LEFT JOIN equipment e ON ms.equipment_id = e.id 
      WHERE ms.company_id = ?
    `, [1]);
    
    console.log('📋 Agendamentos para company_id = 1:', schedules);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

debugQuery();