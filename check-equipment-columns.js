import mysql from 'mysql2/promise';

async function checkEquipmentColumns() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('🔍 Verificando colunas da tabela equipment...');
    const [columns] = await connection.execute('DESCRIBE equipment');
    
    console.log('\nColunas encontradas:');
    columns.forEach(col => {
      console.log(`- ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n🔍 Verificando se a coluna specifications existe...');
    const hasSpecifications = columns.some(col => col.Field === 'specifications');
    console.log(`Coluna 'specifications' existe: ${hasSpecifications ? 'SIM' : 'NÃO'}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkEquipmentColumns();