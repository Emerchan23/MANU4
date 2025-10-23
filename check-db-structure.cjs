const mysql = require('mysql2/promise');

async function testCompanyData() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });
  
  console.log('=== TESTANDO DADOS DA EMPRESA ID 5 ===');
  const [companyData] = await connection.execute('SELECT * FROM companies WHERE id = 5');
  console.log('Dados da empresa:', companyData[0]);
  
  console.log('\n=== TESTANDO QUERY COMPLETA DA OS 37 ===');
  const [fullData] = await connection.execute(`
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
  console.log('Dados completos:', fullData[0]);
  
  await connection.end();
}

testCompanyData().catch(console.error);