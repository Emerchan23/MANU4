const mysql = require('mysql2/promise');

async function fixStatusProperly() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });
  
  console.log('=== CORRIGINDO STATUS DEFINITIVAMENTE ===');
  
  // Verificar status atual
  const [current] = await connection.execute('SELECT id, status FROM service_orders WHERE id IN (55, 57)');
  console.log('Status atual:', current);
  
  // Update direto para cada ID
  const [directUpdate1] = await connection.execute('UPDATE service_orders SET status = ? WHERE id = ?', ['ATRASADA', 55]);
  const [directUpdate2] = await connection.execute('UPDATE service_orders SET status = ? WHERE id = ?', ['ATRASADA', 57]);
  console.log('Updates diretos:', directUpdate1.affectedRows, directUpdate2.affectedRows);
  
  // Verificar final
  const [final] = await connection.execute('SELECT id, status, actual_cost FROM service_orders WHERE status = ?', ['ATRASADA']);
  console.log('Ordens com status ATRASADA:', final);
  
  await connection.end();
}

fixStatusProperly().catch(console.error);