const { query } = require('./lib/database.js');

async function createTables() {
  try {
    console.log('Criando tabelas de manutenção...');
    
    // Criar tabela maintenance_plans
    await query(`
      CREATE TABLE IF NOT EXISTS maintenance_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        maintenance_type ENUM('preventiva', 'corretiva', 'preditiva') NOT NULL DEFAULT 'preventiva',
        frequency_days INT DEFAULT 365,
        estimated_cost DECIMAL(10,2) DEFAULT 0.00,
        estimated_duration_hours INT DEFAULT 1,
        instructions TEXT,
        required_tools TEXT,
        required_parts TEXT,
        safety_requirements TEXT,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela maintenance_plans criada');
    
    // Criar tabela maintenance_schedules
    await query(`
      CREATE TABLE IF NOT EXISTS maintenance_schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        equipment_id INT NOT NULL,
        maintenance_plan_id INT,
        assigned_user_id INT,
        scheduled_date DATETIME NOT NULL,
        estimated_duration_hours INT DEFAULT 1,
        priority ENUM('baixa', 'media', 'alta', 'critica') DEFAULT 'media',
        status ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE') DEFAULT 'SCHEDULED',
        maintenance_type ENUM('preventiva', 'corretiva', 'preditiva') NOT NULL DEFAULT 'preventiva',
        description TEXT,
        instructions TEXT,
        estimated_cost DECIMAL(10,2) DEFAULT 0.00,
        actual_cost DECIMAL(10,2),
        actual_duration_hours INT,
        completion_notes TEXT,
        parts_used TEXT,
        tools_used TEXT,
        issues_found TEXT,
        recommendations TEXT,
        completed_at DATETIME,
        completed_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
        FOREIGN KEY (maintenance_plan_id) REFERENCES maintenance_plans(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('✅ Tabela maintenance_schedules criada');
    
    // Inserir dados de exemplo
    await query(`
      INSERT IGNORE INTO maintenance_plans (name, description, maintenance_type, frequency_days, estimated_cost, estimated_duration_hours, instructions) VALUES
      ('Manutenção Preventiva Básica', 'Inspeção geral e limpeza do equipamento', 'preventiva', 90, 150.00, 2, 'Realizar limpeza geral, verificar conexões, testar funcionamento básico'),
      ('Manutenção Preventiva Completa', 'Manutenção completa com troca de peças de desgaste', 'preventiva', 365, 500.00, 4, 'Desmontagem parcial, limpeza completa, troca de filtros e peças de desgaste, calibração'),
      ('Manutenção Corretiva Urgente', 'Reparo de falhas críticas', 'corretiva', 0, 800.00, 6, 'Diagnóstico da falha, reparo ou substituição de componentes defeituosos'),
      ('Manutenção Preditiva', 'Análise preditiva com instrumentos', 'preditiva', 180, 300.00, 3, 'Análise de vibração, termografia, análise de óleo, medições elétricas')
    `);
    console.log('✅ Dados de exemplo inseridos');
    
  } catch (error) {
    console.error('Erro ao criar tabelas:', error);
  }
  process.exit(0);
}

createTables();