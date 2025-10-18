const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function checkMaintenancePlansDB() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados MariaDB');
    
    // 1. Verificar se a tabela maintenance_plans existe
    console.log('\n📋 Verificando se a tabela maintenance_plans existe...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'maintenance_plans'
    `, ['hospital_maintenance']);
    
    if (tables.length === 0) {
      console.log('❌ Tabela maintenance_plans NÃO existe!');
      console.log('\n🔧 Criando tabela maintenance_plans...');
      
      // Criar tabela maintenance_plans
      await connection.execute(`
        CREATE TABLE maintenance_plans (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          frequency ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL') NOT NULL DEFAULT 'MONTHLY',
          maintenance_type ENUM('PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE') NOT NULL DEFAULT 'PREVENTIVE',
          estimated_duration INT DEFAULT 60,
          estimated_cost DECIMAL(10,2) DEFAULT 0.00,
          equipment_ids JSON,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ Tabela maintenance_plans criada com sucesso!');
      
      // Inserir dados de exemplo
      console.log('\n📊 Inserindo dados de exemplo...');
      await connection.execute(`
        INSERT INTO maintenance_plans (name, description, frequency, maintenance_type, estimated_duration, estimated_cost, equipment_ids) VALUES
        ('Manutenção Preventiva - Compressores', 'Plano de manutenção preventiva para compressores de ar', 'MONTHLY', 'PREVENTIVE', 120, 150.00, '[]'),
        ('Inspeção de Segurança - Caldeiras', 'Plano de inspeção de segurança para caldeiras industriais', 'QUARTERLY', 'PREVENTIVE', 240, 500.00, '[]'),
        ('Lubrificação - Motores Elétricos', 'Plano de lubrificação para motores elétricos', 'MONTHLY', 'PREVENTIVE', 30, 50.00, '[]'),
        ('Calibração - Instrumentos de Medição', 'Plano de calibração para instrumentos de medição', 'SEMIANNUAL', 'PREDICTIVE', 60, 200.00, '[]')
      `);
      
      console.log('✅ Dados de exemplo inseridos!');
    } else {
      console.log('✅ Tabela maintenance_plans existe!');
    }
    
    // 2. Verificar estrutura da tabela
    console.log('\n📋 Verificando estrutura da tabela maintenance_plans...');
    const [columns] = await connection.execute(`DESCRIBE maintenance_plans`);
    
    console.log('\nColunas da tabela maintenance_plans:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.Key ? `[${col.Key}]` : ''}`);
    });
    
    // 3. Verificar se há dados na tabela
    console.log('\n📊 Verificando dados na tabela...');
    const [plans] = await connection.execute('SELECT COUNT(*) as total FROM maintenance_plans');
    console.log(`Total de planos de manutenção: ${plans[0].total}`);
    
    if (plans[0].total > 0) {
      console.log('\n📋 Primeiros 5 planos:');
      const [samplePlans] = await connection.execute('SELECT id, name, frequency, maintenance_type, is_active FROM maintenance_plans LIMIT 5');
      samplePlans.forEach(plan => {
        console.log(`  - ID: ${plan.id}, Nome: ${plan.name}, Frequência: ${plan.frequency}, Tipo: ${plan.maintenance_type}, Ativo: ${plan.is_active}`);
      });
    }
    
    // 4. Verificar se a tabela maintenance_tasks existe
    console.log('\n📋 Verificando se a tabela maintenance_tasks existe...');
    const [taskTables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'maintenance_tasks'
    `, ['hospital_maintenance']);
    
    if (taskTables.length === 0) {
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
          FOREIGN KEY (plan_id) REFERENCES maintenance_plans(id) ON DELETE CASCADE
        )
      `);
      
      console.log('✅ Tabela maintenance_tasks criada com sucesso!');
    } else {
      console.log('✅ Tabela maintenance_tasks existe!');
    }
    
    console.log('\n🎉 Verificação concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkMaintenancePlansDB();