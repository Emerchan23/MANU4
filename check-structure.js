const mysql = require('mysql2/promise');

async function checkStructure() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco');
    
    // Verificar estrutura da tabela maintenance_schedules
    console.log('\n📋 Estrutura da tabela maintenance_schedules:');
    const [columns] = await connection.execute('DESCRIBE maintenance_schedules');
    columns.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.Key ? '[' + col.Key + ']' : ''}`);
    });
    
    await connection.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkStructure();