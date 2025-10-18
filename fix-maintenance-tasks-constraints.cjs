const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function fixMaintenanceTasksConstraints() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados MariaDB');
    
    console.log('\n🔧 Corrigindo constraints da tabela maintenance_tasks...');
    
    // 1. Verificar constraints existentes
    console.log('📋 Verificando constraints existentes...');
    const [constraints] = await connection.execute(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'maintenance_tasks'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `, ['hospital_maintenance']);
    
    console.log('Constraints encontradas:');
    constraints.forEach(constraint => {
      console.log(`   - ${constraint.CONSTRAINT_NAME}: ${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
    });
    
    // 2. Remover constraint problemática do maintenance_id
    console.log('\n🗑️ Removendo constraint problemática...');
    const maintenanceIdConstraint = constraints.find(c => c.COLUMN_NAME === 'maintenance_id');
    
    if (maintenanceIdConstraint) {
      try {
        await connection.execute(`
          ALTER TABLE maintenance_tasks 
          DROP FOREIGN KEY ${maintenanceIdConstraint.CONSTRAINT_NAME}
        `);
        console.log(`✅ Constraint ${maintenanceIdConstraint.CONSTRAINT_NAME} removida!`);
      } catch (error) {
        console.log(`⚠️ Erro ao remover constraint: ${error.message}`);
      }
    }
    
    // 3. Tornar maintenance_id nullable (já que agora usaremos plan_id)
    console.log('📋 Tornando maintenance_id nullable...');
    try {
      await connection.execute(`
        ALTER TABLE maintenance_tasks 
        MODIFY COLUMN maintenance_id INT NULL
      `);
      console.log('✅ Coluna maintenance_id agora é nullable!');
    } catch (error) {
      console.log(`⚠️ Erro ao modificar maintenance_id: ${error.message}`);
    }
    
    // 4. Verificar se plan_id já tem constraint
    const planIdConstraint = constraints.find(c => c.COLUMN_NAME === 'plan_id');
    
    if (!planIdConstraint) {
      console.log('📋 Adicionando constraint para plan_id...');
      try {
        await connection.execute(`
          ALTER TABLE maintenance_tasks 
          ADD CONSTRAINT fk_maintenance_tasks_plan_id 
          FOREIGN KEY (plan_id) REFERENCES maintenance_plans(id) ON DELETE CASCADE
        `);
        console.log('✅ Constraint para plan_id adicionada!');
      } catch (error) {
        console.log(`⚠️ Erro ao adicionar constraint plan_id: ${error.message}`);
      }
    }
    
    // 5. Testar inserção de tarefa
    console.log('\n🧪 Testando inserção de tarefa...');
    
    // Verificar se existe algum plano
    const [plans] = await connection.execute(`
      SELECT id FROM maintenance_plans WHERE is_active = true LIMIT 1
    `);
    
    if (plans.length > 0) {
      const planId = plans[0].id;
      
      try {
        const [result] = await connection.execute(`
          INSERT INTO maintenance_tasks (plan_id, task_name, description, is_required, order_sequence)
          VALUES (?, ?, ?, ?, ?)
        `, [planId, 'Teste de Tarefa', 'Tarefa criada para teste da estrutura corrigida', true, 1]);
        
        const taskId = result.insertId;
        console.log(`✅ Tarefa de teste criada com ID: ${taskId}`);
        
        // Verificar se foi inserida corretamente
        const [insertedTask] = await connection.execute(`
          SELECT * FROM maintenance_tasks WHERE id = ?
        `, [taskId]);
        
        if (insertedTask.length > 0) {
          const task = insertedTask[0];
          console.log('✅ Tarefa inserida com sucesso:');
          console.log(`   - ID: ${task.id}`);
          console.log(`   - Plan ID: ${task.plan_id}`);
          console.log(`   - Nome: ${task.task_name}`);
          console.log(`   - Descrição: ${task.description}`);
          console.log(`   - Obrigatória: ${task.is_required ? 'Sim' : 'Não'}`);
          console.log(`   - Sequência: ${task.order_sequence}`);
        }
        
        // Remover tarefa de teste
        await connection.execute('DELETE FROM maintenance_tasks WHERE id = ?', [taskId]);
        console.log('✅ Tarefa de teste removida');
        
      } catch (error) {
        console.error('❌ Erro ao testar inserção:', error.message);
      }
    } else {
      console.log('⚠️ Nenhum plano encontrado para teste');
    }
    
    // 6. Verificar estrutura final
    console.log('\n📋 Estrutura final da tabela:');
    const [finalConstraints] = await connection.execute(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'maintenance_tasks'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `, ['hospital_maintenance']);
    
    console.log('Constraints finais:');
    finalConstraints.forEach(constraint => {
      console.log(`   - ${constraint.CONSTRAINT_NAME}: ${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
    });
    
    console.log('\n✅ Constraints da tabela maintenance_tasks corrigidas!');
    
  } catch (error) {
    console.error('❌ Erro durante a correção:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão com banco de dados fechada');
    }
  }
}

// Executar a correção
fixMaintenanceTasksConstraints();