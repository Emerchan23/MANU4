const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function checkMaintenanceTasksTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados MariaDB');
    
    // 1. Verificar se a tabela maintenance_tasks existe
    console.log('\n📋 Verificando se a tabela maintenance_tasks existe...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'maintenance_tasks'
    `, ['hospital_maintenance']);
    
    if (tables.length === 0) {
      console.log('❌ Tabela maintenance_tasks NÃO existe!');
      console.log('\n🔧 Criando tabela maintenance_tasks...');
      
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
      
      console.log('✅ Tabela maintenance_tasks criada com sucesso!');
    } else {
      console.log('✅ Tabela maintenance_tasks já existe!');
      
      // Verificar estrutura da tabela
      console.log('\n📋 Verificando estrutura da tabela...');
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'maintenance_tasks'
        ORDER BY ORDINAL_POSITION
      `, ['hospital_maintenance']);
      
      console.log('Colunas da tabela maintenance_tasks:');
      columns.forEach(col => {
        console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
    }
    
    // 2. Verificar se existem dados na tabela
    console.log('\n📊 Verificando dados existentes...');
    const [taskCount] = await connection.execute(`
      SELECT COUNT(*) as total FROM maintenance_tasks
    `);
    
    console.log(`Total de tarefas cadastradas: ${taskCount[0].total}`);
    
    if (taskCount[0].total > 0) {
      const [sampleTasks] = await connection.execute(`
        SELECT t.*, p.name as plan_name
        FROM maintenance_tasks t
        LEFT JOIN maintenance_plans p ON t.plan_id = p.id
        ORDER BY t.created_at DESC
        LIMIT 5
      `);
      
      console.log('\nÚltimas 5 tarefas:');
      sampleTasks.forEach((task, index) => {
        console.log(`   ${index + 1}. ${task.task_name} (Plano: ${task.plan_name || 'N/A'})`);
        console.log(`      - Descrição: ${task.description || 'N/A'}`);
        console.log(`      - Obrigatória: ${task.is_required ? 'Sim' : 'Não'}`);
        console.log(`      - Sequência: ${task.order_sequence}`);
      });
    }
    
    // 3. Verificar integridade referencial
    console.log('\n🔗 Verificando integridade referencial...');
    const [orphanTasks] = await connection.execute(`
      SELECT COUNT(*) as orphan_count
      FROM maintenance_tasks t
      LEFT JOIN maintenance_plans p ON t.plan_id = p.id
      WHERE p.id IS NULL
    `);
    
    if (orphanTasks[0].orphan_count > 0) {
      console.log(`⚠️ Encontradas ${orphanTasks[0].orphan_count} tarefas órfãs (sem plano associado)`);
    } else {
      console.log('✅ Todas as tarefas têm planos associados válidos');
    }
    
    console.log('\n✅ Verificação da tabela maintenance_tasks concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão com banco de dados fechada');
    }
  }
}

// Executar a verificação
checkMaintenanceTasksTable();