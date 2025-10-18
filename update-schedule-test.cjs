const mysql = require('mysql2/promise');

async function updateSchedule() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });
  
  // Atualizar agendamento 30 com dados de teste
  await connection.execute(
    'UPDATE maintenance_schedules SET estimated_cost = ?, observations = ?, company_id = ? WHERE id = ?',
    [150.50, 'Observação de teste para verificar se aparece no formulário', 1, 30]
  );
  
  console.log('Agendamento 30 atualizado com dados de teste');
  
  // Verificar se foi atualizado
  const [rows] = await connection.execute(
    'SELECT id, estimated_cost, observations, company_id FROM maintenance_schedules WHERE id = ?',
    [30]
  );
  
  console.log('Dados atualizados:', rows[0]);
  await connection.end();
}

updateSchedule().catch(console.error);