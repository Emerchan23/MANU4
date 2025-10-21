const mysql = require('mysql2/promise');

async function addMaintenanceFrequencyField() {
  let connection;
  
  try {
    // Conectar ao banco
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('✅ Conectado ao banco de dados');

    // Verificar se o campo já existe
    const [columns] = await connection.execute('DESCRIBE equipment');
    const hasMaintenanceFrequency = columns.some(col => col.Field === 'maintenance_frequency_days');
    
    if (hasMaintenanceFrequency) {
      console.log('✅ Campo maintenance_frequency_days já existe na tabela equipment');
    } else {
      console.log('🔧 Adicionando campo maintenance_frequency_days...');
      
      await connection.execute(`
        ALTER TABLE equipment 
        ADD COLUMN maintenance_frequency_days INT NULL 
        COMMENT 'Frequência de manutenção em dias'
      `);
      
      console.log('✅ Campo maintenance_frequency_days adicionado com sucesso!');
    }

    // Verificar estrutura atualizada
    console.log('\n📋 Estrutura atualizada da tabela equipment:');
    const [updatedColumns] = await connection.execute('DESCRIBE equipment');
    updatedColumns.forEach(col => {
      if (col.Field === 'maintenance_frequency_days' || col.Field === 'acquisition_date') {
        console.log(`  ✅ ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
      }
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addMaintenanceFrequencyField();