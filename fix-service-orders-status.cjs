const mysql = require('mysql2/promise');

async function fixServiceOrdersStatus() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });
  
  console.log('=== CORRIGINDO STATUS DAS SERVICE ORDERS ===');
  
  // Corrigir status vazio para ATRASADA
  const [result1] = await connection.execute(`
    UPDATE service_orders 
    SET status = 'ATRASADA'
    WHERE status = '' OR status IS NULL
  `);
  
  console.log('Status vazios corrigidos:', result1.affectedRows);
  
  // Verificar resultados
  const [orders] = await connection.execute(`
    SELECT id, status, estimated_cost, actual_cost
    FROM service_orders 
    ORDER BY id DESC
    LIMIT 10
  `);
  
  console.log('\n=== STATUS ATUALIZADOS ===');
  orders.forEach(order => {
    console.log(`ID: ${order.id}, Status: ${order.status}, Estimated: ${order.estimated_cost}, Actual: ${order.actual_cost}`);
  });
  
  await connection.end();
}

fixServiceOrdersStatus().catch(console.error);