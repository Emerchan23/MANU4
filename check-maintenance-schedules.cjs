const mysql = require('mysql2/promise');

async function checkTables() {
  try {
    console.log('🔄 Verificando tabelas no banco...');
    
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance',
      port: parseInt(process.env.DB_PORT || '3306'),
      connectionLimit: 5,
      acquireTimeout: 60000,
      timeout: 60000
    });

    console.log('✅ Pool criado com sucesso');

    // Listar todas as tabelas
    const [tables] = await pool.execute('SHOW TABLES');
    console.log('📊 Tabelas encontradas:', tables.map(t => Object.values(t)[0]));

    // Verificar especificamente a tabela maintenance_schedules
    const tableExists = tables.some(t => Object.values(t)[0] === 'maintenance_schedules');
    console.log('📊 Tabela maintenance_schedules existe:', tableExists);

    if (!tableExists) {
      console.log('❌ Tabela maintenance_schedules não existe! Criando...');
      
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS maintenance_schedules (
          id INT AUTO_INCREMENT PRIMARY KEY,
          equipment_id INT NOT NULL,
          maintenance_plan_id INT,
          scheduled_date DATETIME NOT NULL,
          status ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED') DEFAULT 'SCHEDULED',
          priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
          assigned_user_id INT,
          description TEXT,
          estimated_duration INT,
          actual_duration INT,
          actual_cost DECIMAL(10,2),
          completion_notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_equipment_id (equipment_id),
          INDEX idx_scheduled_date (scheduled_date),
          INDEX idx_status (status),
          INDEX idx_assigned_user (assigned_user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;
      
      await pool.execute(createTableSQL);
      console.log('✅ Tabela maintenance_schedules criada com sucesso');
    } else {
      // Contar registros
      const [count] = await pool.execute('SELECT COUNT(*) as total FROM maintenance_schedules');
      console.log('📊 Total de agendamentos:', count[0].total);
    }

    await pool.end();
    console.log('✅ Verificação concluída');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('❌ Stack:', error.stack);
  }
}

checkTables();