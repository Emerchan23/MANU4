const mysql = require('mysql2/promise');

async function checkEquipmentFields() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('🔍 Verificando campos da tabela equipment...');
    const [rows] = await connection.execute('DESCRIBE equipment');
    
    console.log('📋 Campos da tabela equipment:');
    rows.forEach(row => {
      console.log(`- ${row.Field} (${row.Type})`);
    });

    await connection.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkEquipmentFields();