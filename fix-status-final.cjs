const mysql = require('mysql2/promise');

async function fixStatus() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });
  
  // Atualizar status vazio para ATRASADA
  const [result] = await connection.execute("UPDATE service_orders SET status = 'ATRASADA' WHERE status = '' OR status IS NULL");
  console.log('Status corrigidos:', result.affectedRows);
  
  // Verificar
  const [orders] = await connection.execute("SELECT id, status, actual_cost FROM service_orders WHERE status = 'ATRASADA'");
  console.log('Ordens atrasadas:', orders);
  
  await connection.end();
}

fixStatus().catch(console.error);