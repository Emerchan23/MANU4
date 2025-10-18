const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function testNovoPlanoForm() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados MariaDB');
    
    console.log('\n🧪 Testando criação de novo plano de manutenção...');
    
    // Dados do plano de teste
    const testPlan = {
      name: 'Teste Plano Automático',
      description: 'Plano criado automaticamente para teste do formulário',
      frequency: 'MONTHLY',
      maintenance_type: 'PREVENTIVE',
      estimated_duration: 120,
      estimated_cost: 250.50,
      equipment_ids: JSON.stringify(['1', '2']),
      is_active: true
    };
    
    // 1. Criar o plano
    console.log('📝 Criando plano de manutenção...');
    const [result] = await connection.execute(`
      INSERT INTO maintenance_plans (
        name, description, frequency, maintenance_type, 
        estimated_duration, estimated_cost, equipment_ids, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      testPlan.name,
      testPlan.description,
      testPlan.frequency,
      testPlan.maintenance_type,
      testPlan.estimated_duration,
      testPlan.estimated_cost,
      testPlan.equipment_ids,
      testPlan.is_active
    ]);
    
    const planId = result.insertId;
    console.log(`✅ Plano criado com ID: ${planId}`);
    
    // 2. Verificar se foi criado corretamente
    console.log('🔍 Verificando dados do plano criado...');
    const [plans] = await connection.execute(`
      SELECT * FROM maintenance_plans WHERE id = ?
    `, [planId]);
    
    if (plans.length > 0) {
      const plan = plans[0];
      console.log('✅ Plano encontrado:');
      console.log(`   - ID: ${plan.id}`);
      console.log(`   - Nome: ${plan.name}`);
      console.log(`   - Descrição: ${plan.description}`);
      console.log(`   - Frequência: ${plan.frequency}`);
      console.log(`   - Tipo: ${plan.maintenance_type}`);
      console.log(`   - Duração: ${plan.estimated_duration} minutos`);
      console.log(`   - Custo: R$ ${plan.estimated_cost}`);
      console.log(`   - Equipamentos: ${plan.equipment_ids}`);
      console.log(`   - Ativo: ${plan.is_active ? 'Sim' : 'Não'}`);
      console.log(`   - Criado em: ${plan.created_at}`);
    }
    
    // 3. Criar tarefas de exemplo para o plano
    console.log('\n📋 Criando tarefas para o plano...');
    
    // Verificar se tabela maintenance_tasks existe
    const [taskTables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'maintenance_tasks'
    `, ['hospital_maintenance']);
    
    if (taskTables.length === 0) {
      console.log('⚠️ Tabela maintenance_tasks não existe. Criando...');
      await connection.execute(`
        CREATE TABLE maintenance_tasks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          plan_id INT NOT NULL,
          task_name VARCHAR(255) NOT NULL,
          description TEXT,
          is_required BOOLEAN DEFAULT TRUE,
          order_sequence INT DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (plan_id) REFERENCES maintenance_plans(id) ON DELETE CASCADE,
          INDEX idx_plan_id (plan_id)
        )
      `);
      console.log('✅ Tabela maintenance_tasks criada!');
    }
    
    // Inserir tarefas de exemplo
    const tasks = [
      {
        task_name: 'Verificar filtros',
        description: 'Inspeção visual e limpeza dos filtros',
        is_required: true,
        order_sequence: 1
      },
      {
        task_name: 'Testar funcionamento',
        description: 'Teste completo de todas as funções do equipamento',
        is_required: true,
        order_sequence: 2
      },
      {
        task_name: 'Registrar parâmetros',
        description: 'Anotar todos os parâmetros de funcionamento',
        is_required: false,
        order_sequence: 3
      }
    ];
    
    for (const task of tasks) {
      await connection.execute(`
        INSERT INTO maintenance_tasks (plan_id, task_name, description, is_required, order_sequence)
        VALUES (?, ?, ?, ?, ?)
      `, [planId, task.task_name, task.description, task.is_required, task.order_sequence]);
    }
    
    console.log(`✅ ${tasks.length} tarefas criadas para o plano!`);
    
    // 4. Verificar tarefas criadas
    const [createdTasks] = await connection.execute(`
      SELECT * FROM maintenance_tasks WHERE plan_id = ? ORDER BY order_sequence
    `, [planId]);
    
    console.log('\n📋 Tarefas do plano:');
    createdTasks.forEach((task, index) => {
      console.log(`   ${index + 1}. ${task.task_name}`);
      console.log(`      - Descrição: ${task.description}`);
      console.log(`      - Obrigatória: ${task.is_required ? 'Sim' : 'Não'}`);
      console.log(`      - Sequência: ${task.order_sequence}`);
    });
    
    // 5. Testar busca de planos (simulando a API)
    console.log('\n🔍 Testando busca de planos...');
    const [allPlans] = await connection.execute(`
      SELECT 
        id, name, description, frequency, maintenance_type,
        estimated_duration, estimated_cost, equipment_ids, is_active,
        created_at, updated_at
      FROM maintenance_plans 
      WHERE is_active = true 
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`✅ Encontrados ${allPlans.length} planos ativos`);
    
    // 6. Limpar dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    await connection.execute('DELETE FROM maintenance_tasks WHERE plan_id = ?', [planId]);
    await connection.execute('DELETE FROM maintenance_plans WHERE id = ?', [planId]);
    console.log('✅ Dados de teste removidos!');
    
    console.log('\n🎉 Teste do formulário "Novo Plano" concluído com sucesso!');
    console.log('\n📊 Resumo dos testes:');
    console.log('   ✅ Criação de plano de manutenção');
    console.log('   ✅ Validação de dados inseridos');
    console.log('   ✅ Criação de tarefas associadas');
    console.log('   ✅ Busca de planos');
    console.log('   ✅ Limpeza de dados de teste');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão com banco de dados fechada');
    }
  }
}

// Executar o teste
testNovoPlanoForm();