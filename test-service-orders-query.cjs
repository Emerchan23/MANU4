const mysql = require('mysql2/promise');

async function testServiceOrdersQuery() {
  const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance',
    charset: 'utf8mb4',
    timezone: '+00:00'
  };

  try {
    console.log('🔍 Testando query específica da API service-orders...');
    const connection = await mysql.createConnection(dbConfig);
    
    // Testar a query exata que está sendo usada na API
    const sql = `
      SELECT so.*,
             e.name as equipment_name, e.model as equipment_model,
             c.name as company_name,
             s.nome as sector_name,
             u1.name as requester_name,
             u2.name as assigned_technician_name
      FROM service_orders so
      LEFT JOIN equipment e ON so.equipment_id = e.id
      LEFT JOIN companies c ON so.company_id = c.id
      LEFT JOIN setores s ON e.sector_id = s.id
      LEFT JOIN users u1 ON so.created_by = u1.id
      LEFT JOIN users u2 ON so.assigned_to = u2.id
      WHERE 1=1
    `;
    
    console.log('📋 Executando query:');
    console.log(sql);
    
    const results = await connection.query(sql);
    
    console.log(`✅ Query executada com sucesso! ${results.length} registros encontrados.`);
    
    if (results.length > 0) {
      console.log('📊 Primeiro registro:');
      console.log(JSON.stringify(results[0], null, 2));
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Erro ao executar query:', error);
    console.error('Código do erro:', error.code);
    console.error('Mensagem SQL:', error.sqlMessage);
  }
}

testServiceOrdersQuery();