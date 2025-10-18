const mysql = require('mysql2/promise');

async function testAPI() {
  console.log('🧪 Testando API de Service Orders de forma simples...');
  
  try {
    // Conectar ao banco
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('✅ Conectado ao banco de dados');

    // Primeiro, vamos verificar quais tabelas existem
    console.log('\n📋 Verificando tabelas existentes...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📊 Tabelas encontradas:', tables.map(t => Object.values(t)[0]));

    // Testar query simples apenas com service_orders
    console.log('\n📋 Testando query simples...');
    const [results] = await connection.execute(`
      SELECT COUNT(*) as total FROM service_orders
    `);

    console.log('✅ Query executada com sucesso');
    console.log('📊 Total de registros:', results[0].total);

    // Testar query principal
    console.log('\n📋 Testando query principal...');
    const [mainResults] = await connection.execute(`
      SELECT so.*,
             e.name as equipment_name, e.model as equipment_model,
             e.patrimonio_number,
             c.name as company_name,
             s.nome as sector_name,
             ss.name as subsector_name,
             u1.name as requester_name,
             u2.name as assigned_technician_name
      FROM service_orders so
      LEFT JOIN equipment e ON so.equipment_id = e.id
      LEFT JOIN companies c ON so.company_id = c.id
      LEFT JOIN setores s ON e.sector_id = s.id
      LEFT JOIN subsectors ss ON e.subsector_id = ss.id
      LEFT JOIN users u1 ON so.created_by = u1.id
      LEFT JOIN users u2 ON so.assigned_to = u2.id
      ORDER BY so.created_at DESC
      LIMIT 10 OFFSET 0
    `);

    console.log('✅ Query principal executada com sucesso');
    console.log('📊 Registros encontrados:', mainResults.length);

    if (mainResults.length > 0) {
      console.log('\n📋 Primeiro registro:');
      console.log(JSON.stringify(mainResults[0], null, 2));
    }

    await connection.end();
    console.log('\n✅ Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAPI();