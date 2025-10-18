const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function fixMaintenanceTasksStructure() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados MariaDB');
    
    console.log('\n🔧 Analisando estrutura atual da tabela maintenance_tasks...');
    
    // Verificar estrutura atual
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'maintenance_tasks'
      ORDER BY ORDINAL_POSITION
    `, ['hospital_maintenance']);
    
    console.log('Estrutura atual:');
    columns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // Verificar se precisa adicionar coluna plan_id
    const hasPlanId = columns.some(col => col.COLUMN_NAME === 'plan_id');
    const hasMaintenanceId = columns.some(col => col.COLUMN_NAME === 'maintenance_id');
    
    if (!hasPlanId && hasMaintenanceId) {
      console.log('\n🔄 A tabela usa maintenance_id ao invés de plan_id');
      console.log('📋 Adicionando coluna plan_id...');
      
      try {
        await connection.execute(`
          ALTER TABLE maintenance_tasks 
          ADD COLUMN plan_id INT AFTER id,
          ADD INDEX idx_plan_id (plan_id),
          ADD FOREIGN KEY (plan_id) REFERENCES maintenance_plans(id) ON DELETE CASCADE
        `);
        console.log('✅ Coluna plan_id adicionada!');
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('ℹ️ Coluna plan_id já existe');
        } else {
          throw error;
        }
      }
    }
    
    // Verificar se precisa adicionar outras colunas necessárias
    const hasIsRequired = columns.some(col => col.COLUMN_NAME === 'is_required');
    const hasOrderSequence = columns.some(col => col.COLUMN_NAME === 'order_sequence');
    
    if (!hasIsRequired) {
      console.log('📋 Adicionando coluna is_required...');
      await connection.execute(`
        ALTER TABLE maintenance_tasks 
        ADD COLUMN is_required BOOLEAN DEFAULT TRUE AFTER description
      `);
      console.log('✅ Coluna is_required adicionada!');
    }
    
    if (!hasOrderSequence) {
      console.log('📋 Adicionando coluna order_sequence...');
      await connection.execute(`
        ALTER TABLE maintenance_tasks 
        ADD COLUMN order_sequence INT DEFAULT 1 AFTER is_required
      `);
      console.log('✅ Coluna order_sequence adicionada!');
    }
    
    // Verificar estrutura final
    console.log('\n📋 Estrutura final da tabela:');
    const [finalColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'maintenance_tasks'
      ORDER BY ORDINAL_POSITION
    `, ['hospital_maintenance']);
    
    finalColumns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // Testar inserção de uma tarefa de exemplo
    console.log('\n🧪 Testando inserção de tarefa...');
    
    // Primeiro, verificar se existe algum plano
    const [plans] = await connection.execute(`
      SELECT id FROM maintenance_plans WHERE is_active = true LIMIT 1
    `);
    
    if (plans.length > 0) {
      const planId = plans[0].id;
      
      try {
        const [result] = await connection.execute(`
          INSERT INTO maintenance_tasks (plan_id, task_name, description, is_required, order_sequence)
          VALUES (?, ?, ?, ?, ?)
        `, [planId, 'Teste de Tarefa', 'Tarefa criada para teste da estrutura', true, 1]);
        
        const taskId = result.insertId;
        console.log(`✅ Tarefa de teste criada com ID: ${taskId}`);
        
        // Remover tarefa de teste
        await connection.execute('DELETE FROM maintenance_tasks WHERE id = ?', [taskId]);
        console.log('✅ Tarefa de teste removida');
        
      } catch (error) {
        console.error('❌ Erro ao testar inserção:', error.message);
      }
    } else {
      console.log('⚠️ Nenhum plano encontrado para teste');
    }
    
    console.log('\n✅ Estrutura da tabela maintenance_tasks corrigida!');
    
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
fixMaintenanceTasksStructure();