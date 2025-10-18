const { query } = require('./lib/database.js');

async function createPreventiveMaintenancesTable() {
  try {
    console.log('🔍 Verificando se tabela preventive_maintenances existe...');
    
    const checkTable = await query('SHOW TABLES LIKE "preventive_maintenances"');
    console.log('📊 Resultado:', JSON.stringify(checkTable, null, 2));
    
    if (checkTable.length === 0) {
      console.log('❌ Tabela preventive_maintenances NÃO existe!');
      console.log('🔧 Criando tabela...');
      
      const createTableQuery = `
        CREATE TABLE preventive_maintenances (
          id INT AUTO_INCREMENT PRIMARY KEY,
          equipment_id INT NOT NULL,
          scheduled_date DATE NOT NULL,
          status ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'SCHEDULED',
          priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
          estimated_duration INT DEFAULT 60,
          estimated_cost DECIMAL(10,2) DEFAULT 0.00,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by VARCHAR(100) DEFAULT 'system',
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          updated_by VARCHAR(100) DEFAULT 'system',
          FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
        )
      `;
      
      await query(createTableQuery);
      console.log('✅ Tabela preventive_maintenances criada com sucesso!');
    } else {
      console.log('✅ Tabela preventive_maintenances já existe!');
    }
    
    // Verificar estrutura da tabela
    console.log('🔍 Verificando estrutura da tabela...');
    const structure = await query('DESCRIBE preventive_maintenances');
    console.log('📊 Estrutura da tabela:', JSON.stringify(structure, null, 2));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  }
}

createPreventiveMaintenancesTable();