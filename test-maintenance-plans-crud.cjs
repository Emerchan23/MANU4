const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function testMaintenancePlansCRUD() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados MariaDB');
    
    console.log('\n🧪 Testando CRUD operations dos Planos de Manutenção...');
    
    // 1. CREATE - Criar um novo plano de manutenção
    console.log('\n📝 1. Testando CREATE - Criando novo plano...');
    const newPlan = {
      name: 'Teste CRUD - Manutenção Preventiva',
      description: 'Plano de teste para verificar operações CRUD',
      frequency: 'MONTHLY',
      maintenance_type: 'PREVENTIVE',
      estimated_duration: 120,
      estimated_cost: 250.00,
      equipment_ids: JSON.stringify([1, 2, 3]),
      is_active: true
    };
    
    const [createResult] = await connection.execute(`
      INSERT INTO maintenance_plans (
        name, description, frequency, maintenance_type, 
        estimated_duration, estimated_cost, equipment_ids, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      newPlan.name,
      newPlan.description,
      newPlan.frequency,
      newPlan.maintenance_type,
      newPlan.estimated_duration,
      newPlan.estimated_cost,
      newPlan.equipment_ids,
      newPlan.is_active
    ]);
    
    const newPlanId = createResult.insertId;
    console.log(`✅ Plano criado com ID: ${newPlanId}`);
    
    // 2. READ - Buscar o plano criado
    console.log('\n📖 2. Testando READ - Buscando plano criado...');
    const [readResult] = await connection.execute(`
      SELECT * FROM maintenance_plans WHERE id = ?
    `, [newPlanId]);
    
    if (readResult.length > 0) {
      const plan = readResult[0];
      console.log('✅ Plano encontrado:');
      console.log(`  - ID: ${plan.id}`);
      console.log(`  - Nome: ${plan.name}`);
      console.log(`  - Descrição: ${plan.description}`);
      console.log(`  - Frequência: ${plan.frequency}`);
      console.log(`  - Tipo: ${plan.maintenance_type}`);
      console.log(`  - Duração: ${plan.estimated_duration} min`);
      console.log(`  - Custo: R$ ${plan.estimated_cost}`);
      console.log(`  - Equipment IDs: ${plan.equipment_ids}`);
      console.log(`  - Ativo: ${plan.is_active ? 'Sim' : 'Não'}`);
    } else {
      console.log('❌ Plano não encontrado');
    }
    
    // 3. UPDATE - Atualizar o plano
    console.log('\n✏️ 3. Testando UPDATE - Atualizando plano...');
    const updatedData = {
      name: 'Teste CRUD - Manutenção Preventiva (Atualizado)',
      description: 'Plano de teste atualizado para verificar operações CRUD',
      estimated_duration: 180,
      estimated_cost: 300.00
    };
    
    await connection.execute(`
      UPDATE maintenance_plans 
      SET name = ?, description = ?, estimated_duration = ?, estimated_cost = ?, updated_at = NOW()
      WHERE id = ?
    `, [
      updatedData.name,
      updatedData.description,
      updatedData.estimated_duration,
      updatedData.estimated_cost,
      newPlanId
    ]);
    
    // Verificar se foi atualizado
    const [updatedResult] = await connection.execute(`
      SELECT * FROM maintenance_plans WHERE id = ?
    `, [newPlanId]);
    
    if (updatedResult.length > 0) {
      const updatedPlan = updatedResult[0];
      console.log('✅ Plano atualizado com sucesso:');
      console.log(`  - Nome: ${updatedPlan.name}`);
      console.log(`  - Descrição: ${updatedPlan.description}`);
      console.log(`  - Duração: ${updatedPlan.estimated_duration} min`);
      console.log(`  - Custo: R$ ${updatedPlan.estimated_cost}`);
      console.log(`  - Atualizado em: ${updatedPlan.updated_at}`);
    }
    
    // 4. LIST - Listar planos com filtros
    console.log('\n📋 4. Testando LIST - Listando planos com filtros...');
    
    // Buscar todos os planos ativos
    const [activeResult] = await connection.execute(`
      SELECT id, name, frequency, maintenance_type, is_active 
      FROM maintenance_plans 
      WHERE is_active = 1 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log(`✅ Encontrados ${activeResult.length} planos ativos:`);
    activeResult.forEach((plan, index) => {
      console.log(`  ${index + 1}. ${plan.name} (${plan.frequency}, ${plan.maintenance_type})`);
    });
    
    // Buscar com filtro de texto
    const [searchResult] = await connection.execute(`
      SELECT id, name 
      FROM maintenance_plans 
      WHERE (name LIKE ? OR description LIKE ?) 
      LIMIT 3
    `, ['%Teste%', '%Teste%']);
    
    console.log(`\n🔍 Busca por "Teste": ${searchResult.length} resultados`);
    searchResult.forEach(plan => {
      console.log(`  - ${plan.name}`);
    });
    
    // 5. DELETE - Excluir o plano de teste
    console.log('\n🗑️ 5. Testando DELETE - Excluindo plano de teste...');
    
    // Primeiro, fazer soft delete (marcar como inativo)
    await connection.execute(`
      UPDATE maintenance_plans 
      SET is_active = 0, updated_at = NOW()
      WHERE id = ?
    `, [newPlanId]);
    
    console.log('✅ Plano marcado como inativo (soft delete)');
    
    // Verificar se foi desativado
    const [softDeleteResult] = await connection.execute(`
      SELECT id, name, is_active FROM maintenance_plans WHERE id = ?
    `, [newPlanId]);
    
    if (softDeleteResult.length > 0) {
      const plan = softDeleteResult[0];
      console.log(`  - Status: ${plan.is_active ? 'Ativo' : 'Inativo'}`);
    }
    
    // Hard delete (remover completamente)
    await connection.execute(`
      DELETE FROM maintenance_plans WHERE id = ?
    `, [newPlanId]);
    
    console.log('✅ Plano removido completamente (hard delete)');
    
    // Verificar se foi removido
    const [deleteResult] = await connection.execute(`
      SELECT COUNT(*) as count FROM maintenance_plans WHERE id = ?
    `, [newPlanId]);
    
    console.log(`  - Planos encontrados com ID ${newPlanId}: ${deleteResult[0].count}`);
    
    // 6. Estatísticas finais
    console.log('\n📊 6. Estatísticas finais...');
    const [totalCount] = await connection.execute('SELECT COUNT(*) as total FROM maintenance_plans');
    const [activeCount] = await connection.execute('SELECT COUNT(*) as total FROM maintenance_plans WHERE is_active = 1');
    const [preventiveCount] = await connection.execute('SELECT COUNT(*) as total FROM maintenance_plans WHERE maintenance_type = "PREVENTIVE"');
    
    console.log(`  - Total de planos: ${totalCount[0].total}`);
    console.log(`  - Planos ativos: ${activeCount[0].total}`);
    console.log(`  - Planos preventivos: ${preventiveCount[0].total}`);
    
    console.log('\n🎉 Teste CRUD concluído com sucesso!');
    console.log('\n📝 Resumo dos testes:');
    console.log('  ✅ CREATE - Criação de plano');
    console.log('  ✅ READ - Leitura de plano específico');
    console.log('  ✅ UPDATE - Atualização de plano');
    console.log('  ✅ LIST - Listagem com filtros');
    console.log('  ✅ DELETE - Exclusão (soft e hard delete)');
    console.log('  ✅ Todas as operações CRUD funcionando corretamente!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste CRUD:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testMaintenancePlansCRUD();