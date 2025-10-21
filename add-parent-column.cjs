const mysql = require('mysql2/promise');

async function addParentColumn() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('🔍 Verificando estrutura da tabela maintenance_schedules...');
    const [columns] = await connection.execute('DESCRIBE maintenance_schedules');
    
    const hasParentColumn = columns.some(col => col.Field === 'parent_schedule_id');
    
    if (!hasParentColumn) {
      console.log('➕ Adicionando coluna parent_schedule_id...');
      await connection.execute(`
        ALTER TABLE maintenance_schedules 
        ADD COLUMN parent_schedule_id INT NULL
      `);
      
      console.log('🔗 Adicionando chave estrangeira...');
      await connection.execute(`
        ALTER TABLE maintenance_schedules 
        ADD FOREIGN KEY (parent_schedule_id) REFERENCES maintenance_schedules(id) ON DELETE CASCADE
      `);
      
      console.log('✅ Coluna parent_schedule_id adicionada com sucesso!');
    } else {
      console.log('✅ Coluna parent_schedule_id já existe');
    }

    console.log('📋 Estrutura atual da tabela:');
    const [finalColumns] = await connection.execute('DESCRIBE maintenance_schedules');
    finalColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

addParentColumn();