const mysql = require('mysql2/promise');

async function checkSchedules() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root', 
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('📊 Verificando agendamentos na tabela maintenance_schedules:');
    
    const [all] = await connection.execute('SELECT COUNT(*) as count FROM maintenance_schedules');
    console.log('Total de agendamentos:', all[0].count);
    
    const [upcoming] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM maintenance_schedules 
      WHERE scheduled_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
      AND status IN ('AGENDADA', 'SCHEDULED', 'pending', 'agendado')
    `);
    console.log('Próximos 7 dias:', upcoming[0].count);
    
    const [sample] = await connection.execute(`
      SELECT id, status, scheduled_date, description 
      FROM maintenance_schedules 
      ORDER BY scheduled_date ASC 
      LIMIT 5
    `);
    console.log('Amostra de agendamentos:');
    sample.forEach(s => {
      console.log(`  ID: ${s.id}, Status: ${s.status}, Data: ${s.scheduled_date}, Desc: ${s.description}`);
    });
    
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkSchedules();