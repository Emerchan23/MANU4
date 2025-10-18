const mysql = require('mysql2/promise');

async function fixTypeColumn() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  try {
    console.log('🔧 Removendo valor padrão da coluna type...');
    
    // Remover o valor padrão da coluna type
    await connection.execute('ALTER TABLE service_orders MODIFY COLUMN type varchar(50) NULL');
    
    console.log('✅ Valor padrão removido da coluna type');
    
    // Verificar se a alteração foi aplicada
    const [typeColumn] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'hospital_maintenance' AND TABLE_NAME = 'service_orders' AND COLUMN_NAME = 'type'
    `);
    
    if (typeColumn.length > 0) {
      const col = typeColumn[0];
      console.log('\n📋 Nova configuração da coluna type:');
      console.log('  Column Name:', col.COLUMN_NAME);
      console.log('  Data Type:', col.DATA_TYPE);
      console.log('  Column Type:', col.COLUMN_TYPE);
      console.log('  Is Nullable:', col.IS_NULLABLE);
      console.log('  Default:', col.COLUMN_DEFAULT);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

fixTypeColumn();