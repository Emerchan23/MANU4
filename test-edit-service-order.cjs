const mysql = require('mysql2/promise');

// Configuração do banco de dados
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance',
  port: 3306
};

async function testEditServiceOrder() {
  let connection;
  
  try {
    console.log('🔗 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados MariaDB');

    // 1. Buscar a ordem de serviço criada recentemente (ID 60)
    console.log('\n🔍 1. Buscando ordem de serviço para teste de edição...');
    
    const [orders] = await connection.execute(`
      SELECT 
        so.*,
        e.name as equipment_name,
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
      WHERE so.id = 60
    `);

    if (orders.length === 0) {
      throw new Error('❌ Ordem de serviço ID 60 não encontrada');
    }

    const originalOrder = orders[0];
    console.log('✅ Ordem de serviço encontrada:');
    console.log(`   ID: ${originalOrder.id}`);
    console.log(`   Equipamento: ${originalOrder.equipment_name}`);
    console.log(`   Empresa: ${originalOrder.company_name}`);
    console.log(`   Tipo: ${originalOrder.maintenance_type_name}`);
    console.log(`   Status: ${originalOrder.status}`);
    console.log(`   Prioridade: ${originalOrder.priority}`);
    console.log(`   Custo: R$ ${originalOrder.cost}`);

    // 2. Buscar dados alternativos para edição
    console.log('\n📋 2. Buscando dados alternativos para edição...');
    
    // Buscar outro equipamento
    const [otherEquipments] = await connection.execute('SELECT id, name FROM equipment WHERE id != ? LIMIT 1', [originalOrder.equipment_id]);
    
    // Buscar outra empresa
    const [otherCompanies] = await connection.execute('SELECT id, name FROM companies WHERE id != ? LIMIT 1', [originalOrder.company_id]);
    
    // Buscar outro tipo de manutenção
    const [otherMaintenanceTypes] = await connection.execute('SELECT id, name FROM maintenance_types WHERE id != ? AND isActive = 1 LIMIT 1', [originalOrder.maintenance_type_id]);
    
    // Buscar outro usuário
    const [otherUsers] = await connection.execute('SELECT id, name FROM users WHERE id != ? LIMIT 1', [originalOrder.assigned_to]);

    console.log('✅ Dados alternativos encontrados:');
    if (otherEquipments.length > 0) console.log(`   Novo Equipamento: ${otherEquipments[0].name} (ID: ${otherEquipments[0].id})`);
    if (otherCompanies.length > 0) console.log(`   Nova Empresa: ${otherCompanies[0].name} (ID: ${otherCompanies[0].id})`);
    if (otherMaintenanceTypes.length > 0) console.log(`   Novo Tipo: ${otherMaintenanceTypes[0].name} (ID: ${otherMaintenanceTypes[0].id})`);
    if (otherUsers.length > 0) console.log(`   Novo Responsável: ${otherUsers[0].name} (ID: ${otherUsers[0].id})`);

    // 3. Preparar dados para edição
    console.log('\n🔧 3. Preparando dados para edição...');
    
    const editData = {
      equipment_id: otherEquipments.length > 0 ? otherEquipments[0].id : originalOrder.equipment_id,
      company_id: otherCompanies.length > 0 ? otherCompanies[0].id : originalOrder.company_id,
      maintenance_type_id: otherMaintenanceTypes.length > 0 ? otherMaintenanceTypes[0].id : originalOrder.maintenance_type_id,
      description: 'TESTE EDIÇÃO - Descrição atualizada com novos detalhes da manutenção',
      priority: originalOrder.priority === 'alta' ? 'media' : 'alta',
      status: originalOrder.status === 'aberta' ? 'em_andamento' : 'aberta',
      scheduled_date: '2024-02-15',
      completion_date: '2024-02-20',
      cost: 2500.75,
      observations: 'TESTE EDIÇÃO - Observações atualizadas após modificação',
      assigned_to: otherUsers.length > 0 ? otherUsers[0].id : originalOrder.assigned_to
    };

    console.log('📝 Dados para edição:');
    console.log(`   Nova Prioridade: ${editData.priority}`);
    console.log(`   Novo Status: ${editData.status}`);
    console.log(`   Novo Custo: R$ ${editData.cost}`);
    console.log(`   Nova Data Agendada: ${editData.scheduled_date}`);

    // 4. Executar edição
    console.log('\n💾 4. Executando edição da ordem de serviço...');
    
    const updateQuery = `
      UPDATE service_orders SET
        equipment_id = ?,
        company_id = ?,
        maintenance_type_id = ?,
        description = ?,
        priority = ?,
        status = ?,
        scheduled_date = ?,
        completion_date = ?,
        cost = ?,
        observations = ?,
        assigned_to = ?,
        updated_at = NOW()
      WHERE id = ?
    `;

    const [updateResult] = await connection.execute(updateQuery, [
      editData.equipment_id,
      editData.company_id,
      editData.maintenance_type_id,
      editData.description,
      editData.priority,
      editData.status,
      editData.scheduled_date,
      editData.completion_date,
      editData.cost,
      editData.observations,
      editData.assigned_to,
      originalOrder.id
    ]);

    console.log(`✅ Ordem de serviço atualizada (${updateResult.affectedRows} registro afetado)`);

    // 5. Verificar se as alterações foram salvas
    console.log('\n🔍 5. Verificando se as alterações foram salvas...');
    
    const [updatedOrders] = await connection.execute(`
      SELECT 
        so.*,
        e.name as equipment_name,
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
    `, [originalOrder.id]);

    if (updatedOrders.length === 0) {
      throw new Error('❌ Ordem de serviço não encontrada após edição!');
    }

    const updatedOrder = updatedOrders[0];
    console.log('✅ Dados atualizados no banco:');
    console.log(`   ID: ${updatedOrder.id}`);
    console.log(`   Equipamento: ${updatedOrder.equipment_name} (ID: ${updatedOrder.equipment_id})`);
    console.log(`   Empresa: ${updatedOrder.company_name} (ID: ${updatedOrder.company_id})`);
    console.log(`   Tipo: ${updatedOrder.maintenance_type_name} (ID: ${updatedOrder.maintenance_type_id})`);
    console.log(`   Descrição: ${updatedOrder.description}`);
    console.log(`   Prioridade: ${updatedOrder.priority}`);
    console.log(`   Status: ${updatedOrder.status}`);
    console.log(`   Data Agendada: ${updatedOrder.scheduled_date}`);
    console.log(`   Data de Conclusão: ${updatedOrder.completion_date}`);
    console.log(`   Custo: R$ ${updatedOrder.cost}`);
    console.log(`   Observações: ${updatedOrder.observations}`);
    console.log(`   Responsável: ${updatedOrder.assigned_to_name} (ID: ${updatedOrder.assigned_to})`);
    console.log(`   Atualizado em: ${updatedOrder.updated_at}`);

    // 6. Verificar integridade das alterações
    console.log('\n🔎 6. Verificando integridade das alterações...');
    
    const checks = [
      { field: 'equipment_id', expected: editData.equipment_id, actual: updatedOrder.equipment_id },
      { field: 'company_id', expected: editData.company_id, actual: updatedOrder.company_id },
      { field: 'maintenance_type_id', expected: editData.maintenance_type_id, actual: updatedOrder.maintenance_type_id },
      { field: 'priority', expected: editData.priority, actual: updatedOrder.priority },
      { field: 'status', expected: editData.status, actual: updatedOrder.status },
      { field: 'cost', expected: editData.cost, actual: parseFloat(updatedOrder.cost) },
      { field: 'assigned_to', expected: editData.assigned_to, actual: updatedOrder.assigned_to }
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

    // 7. Comparar com dados originais
    console.log('\n📊 7. Comparação com dados originais...');
    
    const comparisons = [
      { field: 'Prioridade', original: originalOrder.priority, updated: updatedOrder.priority },
      { field: 'Status', original: originalOrder.status, updated: updatedOrder.status },
      { field: 'Custo', original: parseFloat(originalOrder.cost), updated: parseFloat(updatedOrder.cost) },
      { field: 'Equipamento', original: originalOrder.equipment_name, updated: updatedOrder.equipment_name },
      { field: 'Empresa', original: originalOrder.company_name, updated: updatedOrder.company_name },
      { field: 'Tipo', original: originalOrder.maintenance_type_name, updated: updatedOrder.maintenance_type_name }
    ];

    comparisons.forEach(comp => {
      const changed = comp.original !== comp.updated;
      const status = changed ? '🔄 ALTERADO' : '➡️  MANTIDO';
      console.log(`   ${status} ${comp.field}: ${comp.original} → ${comp.updated}`);
    });

    if (allChecksPass) {
      console.log('\n🎉 TESTE DE EDIÇÃO CONCLUÍDO COM SUCESSO!');
      console.log('✅ Todas as alterações foram salvas corretamente');
      console.log('✅ Relacionamentos mantidos após edição');
      console.log('✅ Integridade dos dados preservada');
      console.log('✅ Campo maintenance_type_id funcionando corretamente');
    } else {
      console.log('\n⚠️  TESTE DE EDIÇÃO CONCLUÍDO COM PROBLEMAS');
      console.log('❌ Algumas alterações não foram salvas corretamente');
    }

    return updatedOrder.id;

  } catch (error) {
    console.error('❌ Erro durante o teste de edição:', error.message);
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
  testEditServiceOrder()
    .then((orderId) => {
      console.log(`\n🎯 Teste de edição concluído para ordem ID: ${orderId}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Falha no teste de edição:', error.message);
      process.exit(1);
    });
}

module.exports = { testEditServiceOrder };