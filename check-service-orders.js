const mysql = require('mysql2/promise');

async function checkServiceOrders() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'maintenance_system'
  });
  
  console.log('=== VERIFICANDO SERVICE_ORDERS ===');
  const [orders] = await connection.execute(`
    SELECT id, order_number, status, estimated_cost, actual_cost, completion_date, created_at
    FROM service_orders 
    ORDER BY created_at DESC 
    LIMIT 10
  `);
  
  console.log('Service Orders encontradas:');
  orders.forEach(order => {
    console.log(`ID: ${order.id}, Status: ${order.status}, Estimated: ${order.estimated_cost}, Actual: ${order.actual_cost}`);
  });
  
  console.log('\n=== TESTANDO QUERY MONTHLY STATS ===');
  const [monthlyStats] = await connection.execute(`
    SELECT 
      DATE_FORMAT(COALESCE(so.completion_date, so.created_at), '%b') as month,
      COUNT(DISTINCT so.id) as total_scheduled,
      SUM(CASE WHEN so.status IN ('ATRASADA', 'OVERDUE') THEN 1 ELSE 0 END) as overdue,
      SUM(CASE WHEN so.status IN ('CONCLUIDA', 'COMPLETED') THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN so.status IN ('CONCLUIDA', 'COMPLETED') THEN COALESCE(so.actual_cost, so.estimated_cost, 0) ELSE 0 END) as completed_cost,
      SUM(CASE WHEN so.status IN ('ATRASADA', 'OVERDUE') THEN COALESCE(so.actual_cost, so.estimated_cost, 0) ELSE 0 END) as overdue_cost
    FROM service_orders so
    GROUP BY YEAR(COALESCE(so.completion_date, so.created_at)), MONTH(COALESCE(so.completion_date, so.created_at))
    ORDER BY COALESCE(so.completion_date, so.created_at) DESC
  `);
  
  console.log('Monthly Stats:');
  monthlyStats.forEach(stat => {
    console.log(`Mês: ${stat.month}, Completed Cost: ${stat.completed_cost}, Overdue Cost: ${stat.overdue_cost}`);
  });
  
  console.log('\n=== VERIFICANDO ORDENS COM ACTUAL_COST ===');
  const [ordersWithCost] = await connection.execute(`
    SELECT id, order_number, status, estimated_cost, actual_cost
    FROM service_orders 
    WHERE actual_cost IS NOT NULL AND actual_cost > 0
    ORDER BY created_at DESC
  `);
  
  console.log('Ordens com actual_cost:');
  ordersWithCost.forEach(order => {
    console.log(`ID: ${order.id}, Status: ${order.status}, Estimated: ${order.estimated_cost}, Actual: ${order.actual_cost}`);
  });
  
  await connection.end();
}

checkServiceOrders().catch(console.error);