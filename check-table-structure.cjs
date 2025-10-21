const mysql = require('mysql2/promise');

async function checkTableStructure() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('🔍 Verificando estrutura da tabela maintenance_schedules...');
    
    const [columns] = await connection.execute('DESCRIBE maintenance_schedules');
    console.log('📋 Colunas disponíveis:');
    columns.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.Field} (${col.Type})`);
    });
    
    await connection.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkTableStructure();