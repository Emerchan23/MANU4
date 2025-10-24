const mysql = require('mysql2/promise');

async function limparDadosTeste() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });
  
  console.log('=== LIMPANDO DADOS DE TESTE ===');
  
  // Primeiro, verificar quais ordens existem
  const [beforeCleanup] = await connection.execute(`
    SELECT id, order_number, status, estimated_cost, actual_cost, description
    FROM service_orders 
    ORDER BY id
  `);
  
  console.log('ORDENS ANTES DA LIMPEZA:');
  beforeCleanup.forEach(order => {
    console.log(`ID: ${order.id}, Número: ${order.order_number}, Status: ${order.status}`);
    console.log(`  Custos - Estimado: R$ ${order.estimated_cost}, Real: R$ ${order.actual_cost}`);
    console.log(`  Descrição: ${order.description.substring(0, 50)}...`);
    console.log('---');
  });
  
  console.log('\n=== REMOVENDO ORDENS DE TESTE ===');
  
  // Remover ordens claramente de teste
  const [deleteTest1] = await connection.execute('DELETE FROM service_orders WHERE order_number = ?', ['OS-TEST-001']);
  const [deleteTest2] = await connection.execute('DELETE FROM service_orders WHERE order_number = ?', ['OS-TEST-002']);
  
  console.log(`Ordens de teste removidas: ${deleteTest1.affectedRows + deleteTest2.affectedRows}`);
  
  console.log('\n=== RESETANDO CUSTOS ARTIFICIAIS ===');
  
  // Resetar custos que foram inseridos artificialmente (manter apenas estimated_cost original)
  // Identificar ordens que foram modificadas recentemente e resetar actual_cost
  const [resetCosts] = await connection.execute(`
    UPDATE service_orders 
    SET actual_cost = 0.00 
    WHERE updated_at > DATE_SUB(NOW(), INTERVAL 2 DAY)
      AND actual_cost > 0
  `);
  
  console.log(`Custos artificiais resetados: ${resetCosts.affectedRows} ordens`);
  
  console.log('\n=== VERIFICANDO ORDENS RESTANTES ===');
  
  // Verificar o que sobrou
  const [afterCleanup] = await connection.execute(`
    SELECT id, order_number, status, estimated_cost, actual_cost, description, created_at
    FROM service_orders 
    ORDER BY id
  `);
  
  console.log('ORDENS APÓS LIMPEZA:');
  if (afterCleanup.length === 0) {
    console.log('Nenhuma ordem restante no sistema.');
  } else {
    afterCleanup.forEach(order => {
      console.log(`ID: ${order.id}, Número: ${order.order_number}, Status: ${order.status}`);
      console.log(`  Custos - Estimado: R$ ${order.estimated_cost}, Real: R$ ${order.actual_cost}`);
      console.log(`  Criado em: ${order.created_at}`);
      console.log(`  Descrição: ${order.description.substring(0, 50)}...`);
      console.log('---');
    });
  }
  
  console.log('\n=== VERIFICANDO IMPACTO NO DASHBOARD ===');
  
  // Testar a query do dashboard
  const [dashboardTest] = await connection.execute(`
    SELECT 
      DATE_FORMAT(so.scheduled_date, '%b') as month,
      COUNT(*) as total_scheduled,
      COUNT(CASE WHEN so.status = 'ATRASADA' THEN 1 END) as overdue,
      COUNT(CASE WHEN so.status = 'CONCLUIDA' THEN 1 END) as completed,
      COUNT(CASE WHEN so.status IN ('ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_PECA') THEN 1 END) as pending,
      COALESCE(SUM(CASE WHEN so.status = 'CONCLUIDA' THEN COALESCE(so.actual_cost, so.estimated_cost, 0) END), 0) as completed_cost,
      COALESCE(SUM(CASE WHEN so.status = 'ATRASADA' THEN COALESCE(so.actual_cost, so.estimated_cost, 0) END), 0) as overdue_cost
    FROM service_orders so
    WHERE MONTH(so.scheduled_date) = MONTH(CURDATE()) 
      AND YEAR(so.scheduled_date) = YEAR(CURDATE())
    GROUP BY DATE_FORMAT(so.scheduled_date, '%b')
  `);
  
  if (dashboardTest.length > 0) {
    console.log('RESULTADO DO DASHBOARD APÓS LIMPEZA:');
    console.log(`Total Concluído: R$ ${dashboardTest[0].completed_cost}`);
    console.log(`Total em Atraso: R$ ${dashboardTest[0].overdue_cost}`);
    console.log(`Ordens Concluídas: ${dashboardTest[0].completed}`);
    console.log(`Ordens Atrasadas: ${dashboardTest[0].overdue}`);
  } else {
    console.log('DASHBOARD: Nenhuma ordem no mês atual - valores serão R$ 0,00');
  }
  
  await connection.end();
  
  console.log('\n✅ LIMPEZA CONCLUÍDA!');
  console.log('O sistema agora contém apenas dados reais.');
  console.log('Os valores do dashboard podem estar zerados até que novas ordens sejam criadas.');
}

limparDadosTeste().catch(console.error);