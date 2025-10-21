const mysql = require('mysql2/promise');

async function checkSectorsTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  try {
    console.log('🔍 Verificando estrutura da tabela sectors...');
    
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'hospital_maintenance' 
      AND TABLE_NAME = 'sectors'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Colunas da tabela sectors:', columns.map(c => c.COLUMN_NAME));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

checkSectorsTable();