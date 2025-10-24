const mysql = require('mysql2/promise');

async function analisarOrigemDados() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });
  
  console.log('=== ANÁLISE DETALHADA DA ORIGEM DOS DADOS ===');
  
  // Verificar todas as ordens com suas datas de criação e atualização
  const [orders] = await connection.execute(`
    SELECT 
      id, 
      order_number,
      status,
      description,
      estimated_cost,
      actual_cost,
      created_at,
      updated_at,
      scheduled_date,
      TIMESTAMPDIFF(MINUTE, created_at, updated_at) as minutes_between_create_update
    FROM service_orders 
    ORDER BY created_at DESC
  `);
  
  console.log('ANÁLISE TEMPORAL DAS ORDENS:');
  orders.forEach(order => {
    console.log(`\nID: ${order.id} - ${order.order_number}`);
    console.log(`Status: ${order.status}`);
    console.log(`Descrição: ${order.description.substring(0, 60)}...`);
    console.log(`Custos - Estimado: R$ ${order.estimated_cost}, Real: R$ ${order.actual_cost}`);
    console.log(`Criado em: ${order.created_at}`);
    console.log(`Atualizado em: ${order.updated_at}`);
    console.log(`Agendado para: ${order.scheduled_date}`);
    console.log(`Tempo entre criação e última atualização: ${order.minutes_between_create_update} minutos`);
    
    // Identificar possíveis dados de teste
    if (order.order_number.includes('TEST') || order.description.includes('teste')) {
      console.log('⚠️  POSSÍVEL DADO DE TESTE IDENTIFICADO');
    }
    
    if (order.minutes_between_create_update > 60) {
      console.log('⚠️  ORDEM MODIFICADA APÓS CRIAÇÃO (pode indicar correção manual)');
    }
    
    console.log('---');
  });
  
  console.log('\n=== RESUMO DA ANÁLISE ===');
  
  const testOrders = orders.filter(o => o.order_number.includes('TEST') || o.description.includes('teste'));
  const modifiedOrders = orders.filter(o => o.minutes_between_create_update > 60);
  const ordersWithCosts = orders.filter(o => o.actual_cost > 0 || o.estimated_cost > 0);
  
  console.log(`Total de ordens: ${orders.length}`);
  console.log(`Ordens com indicação de teste: ${testOrders.length}`);
  console.log(`Ordens modificadas após criação: ${modifiedOrders.length}`);
  console.log(`Ordens com custos: ${ordersWithCosts.length}`);
  
  if (testOrders.length > 0) {
    console.log('\n⚠️  ORDENS DE TESTE IDENTIFICADAS:');
    testOrders.forEach(order => {
      console.log(`- ID ${order.id}: ${order.order_number} (R$ ${order.actual_cost})`);
    });
  }
  
  await connection.end();
}

analisarOrigemDados().catch(console.error);