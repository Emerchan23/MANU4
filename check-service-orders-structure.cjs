const mysql = require('mysql2/promise');

async function checkServiceOrdersStructure() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  try {
    console.log('=== Estrutura da tabela service_orders ===');
    const [columns] = await connection.execute('DESCRIBE service_orders');
    console.log('Colunas da tabela service_orders:');
    columns.forEach(col => {
      console.log(`- ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `KEY: ${col.Key}` : ''} ${col.Default !== null ? `DEFAULT: ${col.Default}` : ''}`);
    });

    console.log('\n=== Estrutura da tabela service_description_templates ===');
    const [templateColumns] = await connection.execute('DESCRIBE service_description_templates');
    console.log('Colunas da tabela service_description_templates:');
    templateColumns.forEach(col => {
      console.log(`- ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `KEY: ${col.Key}` : ''} ${col.Default !== null ? `DEFAULT: ${col.Default}` : ''}`);
    });

    console.log('\n=== Primeiros 3 registros de service_orders ===');
    const [orders] = await connection.execute('SELECT * FROM service_orders LIMIT 3');
    console.log('Registros:');
    orders.forEach((order, index) => {
      console.log(`Registro ${index + 1}:`, order);
    });

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await connection.end();
  }
}

checkServiceOrdersStructure();