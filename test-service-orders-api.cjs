const mysql = require('mysql2/promise');

async function testServiceOrdersAPI() {
  const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance',
    charset: 'utf8mb4',
    timezone: '+00:00'
  };

  try {
    console.log('🔍 Testando query da API service-orders...');
    const connection = await mysql.createConnection(dbConfig);
    
    // Query exata da API corrigida
    const mainQuery = `
      SELECT
        so.*,
        e.name as equipment_name,
        e.model as equipment_model,
        e.patrimonio as equipment_patrimonio,
        c.name as company_name,
        s.nome as sector_name,
        ss.name as subsector_name,
        u1.name as created_by_name,
        u2.name as assigned_to_name,
        st.name as template_name
      FROM service_orders so
      LEFT JOIN equipment e ON so.equipment_id = e.id
      LEFT JOIN companies c ON so.company_id = c.id
      LEFT JOIN setores s ON e.sector_id = s.id
      LEFT JOIN subsectors ss ON e.subsector_id = ss.id
      LEFT JOIN users u1 ON so.created_by = u1.id
      LEFT JOIN users u2 ON so.assigned_to = u2.id
      LEFT JOIN service_description_templates st ON so.template_id = st.id
      ORDER BY so.created_at DESC
      LIMIT 10 OFFSET 0
    `;
    
    console.log('📋 Executando query da API...');
    const [results] = await connection.query(mainQuery);
    console.log(`✅ Query executada com sucesso! Registros encontrados: ${results.length}`);
    
    if (results.length > 0) {
      console.log('📊 Primeiro registro:');
      console.log(JSON.stringify(results[0], null, 2));
    }
    
    // Testar query de contagem
    const countQuery = `
      SELECT COUNT(*) as total
      FROM service_orders so
      LEFT JOIN equipment e ON so.equipment_id = e.id
      LEFT JOIN companies c ON so.company_id = c.id
    `;
    
    console.log('\n📋 Executando query de contagem...');
    const [countResult] = await connection.query(countQuery);
    console.log(`✅ Total de registros: ${countResult[0].total}`);
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Erro ao executar query:', error);
    console.error('Código do erro:', error.code);
    console.error('Mensagem SQL:', error.sqlMessage);
    console.error('Stack:', error.stack);
  }
}

testServiceOrdersAPI();