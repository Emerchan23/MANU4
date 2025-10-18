const mysql = require('mysql2/promise');

async function checkDatabase() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  try {
    console.log('🔍 Verificando estrutura da tabela service_orders...');
    
    // Verificar estrutura da tabela
    const [structure] = await connection.execute('DESCRIBE service_orders');
    
    console.log('📋 Estrutura da tabela service_orders:');
    structure.forEach(column => {
      console.log('  -', column.Field, ':', column.Type, column.Null === 'NO' ? '(NOT NULL)' : '', column.Default ? 'DEFAULT ' + column.Default : '');
    });
    
    // Verificar último registro inserido com mais detalhes
    console.log('\n📊 Último registro inserido (ID 49):');
    const [lastRecord] = await connection.execute('SELECT * FROM service_orders WHERE id = 49');
    
    if (lastRecord.length > 0) {
      const record = lastRecord[0];
      console.log('  ID:', record.id);
      console.log('  Order Number:', record.order_number);
      console.log('  Type:', record.type);
      console.log('  Observations:', record.observations);
      console.log('  Description:', record.description);
      console.log('  Priority:', record.priority);
      console.log('  Created At:', record.created_at);
      console.log('  Updated At:', record.updated_at);
    }
    
    // Verificar se há algum valor padrão ou constraint na coluna type
    console.log('\n🔧 Verificando detalhes da coluna type...');
    const [typeColumn] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TYPE, EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'hospital_maintenance' AND TABLE_NAME = 'service_orders' AND COLUMN_NAME = 'type'
    `);
    
    if (typeColumn.length > 0) {
      const col = typeColumn[0];
      console.log('  Column Name:', col.COLUMN_NAME);
      console.log('  Data Type:', col.DATA_TYPE);
      console.log('  Column Type:', col.COLUMN_TYPE);
      console.log('  Is Nullable:', col.IS_NULLABLE);
      console.log('  Default:', col.COLUMN_DEFAULT);
      console.log('  Extra:', col.EXTRA);
    }
    
    // Verificar se há algum valor padrão ou constraint na coluna observations
    console.log('\n🔧 Verificando detalhes da coluna observations...');
    const [obsColumn] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TYPE, EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'hospital_maintenance' AND TABLE_NAME = 'service_orders' AND COLUMN_NAME = 'observations'
    `);
    
    if (obsColumn.length > 0) {
      const col = obsColumn[0];
      console.log('  Column Name:', col.COLUMN_NAME);
      console.log('  Data Type:', col.DATA_TYPE);
      console.log('  Column Type:', col.COLUMN_TYPE);
      console.log('  Is Nullable:', col.IS_NULLABLE);
      console.log('  Default:', col.COLUMN_DEFAULT);
      console.log('  Extra:', col.EXTRA);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

checkDatabase();