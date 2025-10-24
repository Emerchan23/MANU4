const mysql = require('mysql2/promise');

async function analisarOrdensRestantes() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });
  
  console.log('=== ANÁLISE DAS ORDENS RESTANTES ===');
  
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
      equipment_id,
      company_id,
      created_by
    FROM service_orders 
    ORDER BY id
  `);
  
  console.log('ANÁLISE DETALHADA DAS ORDENS RESTANTES:');
  
  for (const order of orders) {
    console.log(`\n📋 ORDEM ID: ${order.id} - ${order.order_number}`);
    console.log(`Status: ${order.status}`);
    console.log(`Descrição completa: ${order.description}`);
    console.log(`Custos - Estimado: R$ ${order.estimated_cost}, Real: R$ ${order.actual_cost}`);
    console.log(`Criado em: ${order.created_at}`);
    console.log(`Atualizado em: ${order.updated_at}`);
    console.log(`Agendado para: ${order.scheduled_date}`);
    console.log(`Equipment ID: ${order.equipment_id}, Company ID: ${order.company_id}`);
    console.log(`Criado por usuário ID: ${order.created_by}`);
    
    // Verificar se parece ser dados reais ou de teste
    const isTest = order.description.toLowerCase().includes('teste') || 
                   order.description.toLowerCase().includes('test') ||
                   order.order_number.includes('TEST');
    
    if (isTest) {
      console.log('⚠️  POSSÍVEL DADO DE TESTE');
    } else {
      console.log('✅ PARECE SER DADO REAL');
    }
    
    console.log('---');
  }
  
  console.log(`\n📊 RESUMO: ${orders.length} ordens restantes no sistema`);
  
  // Verificar equipamentos e empresas relacionados
  if (orders.length > 0) {
    console.log('\n=== VERIFICANDO EQUIPAMENTOS E EMPRESAS ===');
    
    const equipmentIds = [...new Set(orders.map(o => o.equipment_id))];
    const companyIds = [...new Set(orders.map(o => o.company_id))];
    
    for (const eqId of equipmentIds) {
      const [equipment] = await connection.execute('SELECT name, code FROM equipment WHERE id = ?', [eqId]);
      if (equipment.length > 0) {
        console.log(`Equipamento ID ${eqId}: ${equipment[0].name} (Código: ${equipment[0].code})`);
      }
    }
    
    for (const compId of companyIds) {
      const [company] = await connection.execute('SELECT name FROM companies WHERE id = ?', [compId]);
      if (company.length > 0) {
        console.log(`Empresa ID ${compId}: ${company[0].name}`);
      }
    }
  }
  
  await connection.end();
}

analisarOrdensRestantes().catch(console.error);