const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkStatus() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('🔍 Verificando status únicos na tabela service_orders...');
  const [statusResults] = await connection.execute('SELECT DISTINCT status FROM service_orders ORDER BY status');
  console.log('Status encontrados:', statusResults.map(r => r.status));

  console.log('\n📊 Contagem por status:');
  const [countResults] = await connection.execute('SELECT status, COUNT(*) as count FROM service_orders GROUP BY status ORDER BY count DESC');
  countResults.forEach(r => console.log(`  - ${r.status}: ${r.count} ordens`));

  await connection.end();
}

checkStatus().catch(console.error);