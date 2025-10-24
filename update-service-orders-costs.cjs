const mysql = require('mysql2/promise');

async function updateServiceOrdersCosts() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });
  
  console.log('=== ATUALIZANDO CUSTOS DAS SERVICE ORDERS ===');
  
  // Atualizar ordens concluídas com actual_cost baseado no estimated_cost
  const [result1] = await connection.execute(`
    UPDATE service_orders 
    SET actual_cost = CASE 
      WHEN estimated_cost > 0 THEN estimated_cost * (0.9 + (RAND() * 0.2))
      ELSE 100 + (RAND() * 200)
    END
    WHERE status IN ('CONCLUIDA', 'COMPLETED') AND (actual_cost IS NULL OR actual_cost = 0)
  `);
  
  console.log('Ordens concluídas atualizadas:', result1.affectedRows);
  
  // Atualizar ordens atrasadas com actual_cost
  const [result2] = await connection.execute(`
    UPDATE service_orders 
    SET actual_cost = CASE 
      WHEN estimated_cost > 0 THEN estimated_cost * (1.1 + (RAND() * 0.3))
      ELSE 150 + (RAND() * 250)
    END
    WHERE status IN ('ATRASADA', 'OVERDUE') AND (actual_cost IS NULL OR actual_cost = 0)
  `);
  
  console.log('Ordens atrasadas atualizadas:', result2.affectedRows);
  
  // Criar algumas ordens atrasadas para teste
  const [result3] = await connection.execute(`
    UPDATE service_orders 
    SET status = 'ATRASADA', actual_cost = estimated_cost * 1.2
    WHERE id IN (55, 57) AND status != 'CONCLUIDA'
  `);
  
  console.log('Ordens marcadas como atrasadas:', result3.affectedRows);
  
  // Verificar resultados
  const [orders] = await connection.execute(`
    SELECT id, status, estimated_cost, actual_cost
    FROM service_orders 
    WHERE actual_cost > 0
    ORDER BY id DESC
    LIMIT 10
  `);
  
  console.log('\n=== ORDENS COM CUSTOS ATUALIZADOS ===');
  orders.forEach(order => {
    console.log(`ID: ${order.id}, Status: ${order.status}, Estimated: ${order.estimated_cost}, Actual: ${order.actual_cost}`);
  });
  
  await connection.end();
}

updateServiceOrdersCosts().catch(console.error);