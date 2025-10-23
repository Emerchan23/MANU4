const mysql = require('mysql2/promise');

async function checkDB() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });
  
  console.log('=== ESTRUTURA service_orders ===');
  const [soColumns] = await connection.execute('DESCRIBE service_orders');
  soColumns.forEach(col => console.log(col.Field, '-', col.Type));
  
  console.log('\n=== ESTRUTURA companies ===');
  const [compColumns] = await connection.execute('DESCRIBE companies');
  compColumns.forEach(col => console.log(col.Field, '-', col.Type));
  
  console.log('\n=== TESTE: Dados da OS 37 ===');
  const [testData] = await connection.execute(`
    SELECT 
      so.id, so.order_number, so.company_id,
      emp.name as company_name,
      emp.cnpj as company_cnpj,
      emp.address as company_address,
      emp.phone as company_phone,
      emp.email as company_email
    FROM service_orders so
    LEFT JOIN companies emp ON so.company_id = emp.id
    WHERE so.id = 37
  `);
  console.log('Dados encontrados:', testData[0]);
  
  await connection.end();
}

check