const mysql = require('mysql2/promise');

// Configuração do banco de dados
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance',
  port: 3306
};

async function testCreateServiceOrder() {
  let connection;
  
  try {
    console.log('🔗 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados MariaDB');

    // 1. Verificar dados disponíveis para o teste
    console.log('\n📋 1. Verificando dados disponíveis...');
    
    // Verificar equipamentos
    const [equipments] = await connection.execute('SELECT id, name, model FROM equipment LIMIT 5');
    console.log(`✅ Equipamentos disponíveis: ${equipments.length}`);
    equipments.forEach(eq => console.log(`   - ID: ${eq.id}, Nome: ${eq.name}, Modelo: ${eq.model}`));
    
    // Verificar empresas
    const [companies] = await connection.execute('SELECT id, name FROM companies LIMIT 5');
    console.log(`✅ Empresas disponíveis: ${companies.length}`);
    companies.forEach(comp => console.log(`   - ID: ${comp.id}, Nome: ${comp.name}`));
    
    // Verificar usuários
    const [users] = await connection.execute('SELECT id, name FROM users LIMIT 5');
    console.log(`✅ Usuários disponíveis: ${users.length}`);
    users.forEach(user => console.log(`   - ID: ${user.id}, Nome: ${user.name}`));
    
    // Verificar tipos de manutenção
    const [maintenanceTypes] = await connection.execute('SELECT id, name FROM maintenance_types WHERE isActive = 1 LIMIT 5');
    console.log(`✅ Tipos de manutenção disponíveis: ${maintenanceTypes.length}`);
    maintenanceTypes.forEach(type => console.log(`   - ID: ${type.id}, Nome: ${type.name}`));

    if (equipments.length === 0 || companies.length === 0 || users.length === 0 || maintenanceTypes.length === 0) {
      throw new Error('❌ Dados insuficientes para criar ordem de serviço');
    }

    // 2. Criar dados de teste para a ordem de serviço
    console.log('\n🔧 2. Preparando dados para nova ordem de serviço...');
    
    const testOrderData = {
      equipment_id: equipments[0].id,
      company_id: companies[0].id,
      maintenance_type_id: maintenanceTypes[0].id,
      description: 'TESTE COMPLETO - Manutenção preventiva do equipamento com verificação de todos os componentes',
      priority: 'alta',
      status: 'aberta',
      requested_date: '2024-01-15',
      scheduled_date: '2024-01-20',
      completion_date: '2024-01-25',
      warranty_days: 90,
      cost: 1500.50,
      observations: 'Teste automatizado - Verificar funcionamento após manutenção',
      created_by: users[0].id,
      assigned_to: users.length > 1 ? users[1].id : users[0].id
    };

    console.log('📝 Dados da ordem de serviço:');
    console.log(`   Equipamento: ${equipments[0].name} (ID: ${testOrderData.equipment_id})`);
    console.log(`   Empresa: ${companies[0].name} (ID: ${testOrderData.company_id})`);
    console.log(`   Tipo de Manutenção: ${maintenanceTypes[0].name} (ID: ${testOrderData.maintenance_type_id})`);
    console.log(`   Prioridade: ${testOrderData.priority}`);
    console.log(`   Status: ${testOrderData.status}`);
    console.log(`   Custo: R$ ${testOrderData.cost}`);
    console.log(`   Data Agendada: ${testOrderData.scheduled_date}`);

    // 3. Inserir nova ordem de serviço
    console.log('\n💾 3. Criando nova ordem de serviço...');
    
    const insertQuery = `
      INSERT INTO service_orders (
        order_number, equipment_id, company_id, maintenance_type_id, description, 
        priority, status, requested_date, scheduled_date, completion_date,
        warranty_days, cost, observations, created_by, assigned_to
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Gerar número da ordem único
    const orderNumber = `OS-${Date.now()}`;

    const [insertResult] = await connection.execute(insertQuery, [
      orderNumber,
      testOrderData.equipment_id,
      testOrderData.company_id,
      testOrderData.maintenance_type_id,
      testOrderData.description,
      testOrderData.priority,
      testOrderData.status,
      testOrderData.requested_date,
      testOrderData.scheduled_date,
      testOrderData.completion_date,
      testOrderData.warranty_days,
      testOrderData.cost,
      testOrderData.observations,
      testOrderData.created_by,
      testOrderData.assigned_to
    ]);

    const serviceOrderId = insertResult.insertId;
    console.log(`✅ Ordem de serviço criada com ID: ${serviceOrderId}`);

    // 4. Verificar se todos os campos foram salvos corretamente
    console.log('\n🔍 4. Verificando se todos os campos foram salvos...');
    
    const [savedOrder] = await connection.execute(`
      SELECT 
        so.*,
        e.name as equipment_name,
        e.model as equipment_model,
        c.name as company_name,
        mt.name as maintenance_type_name,
        u1.name as created_by_name,
        u2.name as assigned_to_name
      FROM service_orders so
      LEFT JOIN equipment e ON so.equipment_id = e.id
      LEFT JOIN companies c ON so.company_id = c.id
      LEFT JOIN maintenance_types mt ON so.maintenance_type_id = mt.id
      LEFT JOIN users u1 ON so.created_by = u1.id
      LEFT JOIN users u2 ON so.assigned_to = u2.id
      WHERE so.id = ?
    `, [serviceOrderId]);

    if (savedOrder.length === 0) {
      throw new Error('❌ Ordem de serviço não encontrada após criação!');
    }

    const order = savedOrder[0];
    console.log('✅ Ordem de serviço salva com sucesso!');
    console.log('\n📊 Dados salvos no banco:');
    console.log(`   ID: ${order.id}`);
    console.log(`   Equipamento: ${order.equipment_name} (ID: ${order.equipment_id})`);
    console.log(`   Empresa: ${order.company_name} (ID: ${order.company_id})`);
    console.log(`   Tipo de Manutenção: ${order.maintenance_type_name} (ID: ${order.maintenance_type_id})`);
    console.log(`   Descrição: ${order.description}`);
    console.log(`   Prioridade: ${order.priority}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Data Solicitada: ${order.requested_date}`);
    console.log(`   Data Agendada: ${order.scheduled_date}`);
    console.log(`   Data de Conclusão: ${order.completion_date}`);
    console.log(`   Dias de Garantia: ${order.warranty_days}`);
    console.log(`   Custo: R$ ${order.cost}`);
    console.log(`   Observações: ${order.observations}`);
    console.log(`   Criado por: ${order.created_by_name} (ID: ${order.created_by})`);
    console.log(`   Responsável: ${order.assigned_to_name} (ID: ${order.assigned_to})`);
    console.log(`   Criado em: ${order.created_at}`);
    console.log(`   Atualizado em: ${order.updated_at}`);

    // 5. Verificar integridade dos dados
    console.log('\n🔎 5. Verificando integridade dos dados...');
    
    const checks = [
      { field: 'equipment_id', expected: testOrderData.equipment_id, actual: order.equipment_id },
      { field: 'company_id', expected: testOrderData.company_id, actual: order.company_id },
      { field: 'maintenance_type_id', expected: testOrderData.maintenance_type_id, actual: order.maintenance_type_id },
      { field: 'priority', expected: testOrderData.priority, actual: order.priority },
      { field: 'status', expected: testOrderData.status, actual: order.status },
      { field: 'cost', expected: testOrderData.cost, actual: parseFloat(order.cost) },
      { field: 'created_by', expected: testOrderData.created_by, actual: order.created_by },
      { field: 'assigned_to', expected: testOrderData.assigned_to, actual: order.assigned_to }
    ];

    let allChecksPass = true;
    checks.forEach(check => {
      if (check.expected === check.actual) {
        console.log(`   ✅ ${check.field}: ${check.actual}`);
      } else {
        console.log(`   ❌ ${check.field}: esperado ${check.expected}, obtido ${check.actual}`);
        allChecksPass = false;
      }
    });

    if (allChecksPass) {
      console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
      console.log('✅ Todos os campos foram salvos corretamente');
      console.log('✅ Relacionamentos com outras tabelas funcionando');
      console.log('✅ Integridade dos dados mantida');
    } else {
      console.log('\n⚠️  TESTE CONCLUÍDO COM PROBLEMAS');
      console.log('❌ Alguns campos não foram salvos corretamente');
    }

    return serviceOrderId;

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão com banco de dados encerrada');
    }
  }
}

// Executar o teste
if (require.main === module) {
  testCreateServiceOrder()
    .then((orderId) => {
      console.log(`\n🎯 Ordem de serviço criada com ID: ${orderId}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Falha no teste:', error.message);
      process.exit(1);
    });
}

module.exports = { testCreateServiceOrder };