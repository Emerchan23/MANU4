const mysql = require('mysql2/promise');

async function debugAPI() {
  console.log('🔍 Debug da API de Service Orders...');
  
  try {
    // Conectar ao banco
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('✅ Conectado ao banco de dados');

    // Testar query exata da API
    console.log('\n📋 Testando query exata da API...');
    const query = `
      SELECT so.id,
        so.order_number,
        so.equipment_id,
        so.company_id,
        so.description,
        so.priority,
        so.status,
        so.requested_date,
        so.scheduled_date,
        so.completion_date,
        so.type,
        so.warranty_days,
        so.warranty_expiry,
        so.cost,
        so.observations,
        so.assigned_to,
        so.created_by,
        so.created_at,
        so.updated_at,
        e.name as equipment_name,
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
    `;

    const [rows] = await connection.execute(query);
    console.log('✅ Query executada com sucesso');
    console.log('📊 Registros encontrados:', rows.length);
    
    if (rows.length > 0) {
      console.log('\n📋 Primeiro registro:');
      console.log(JSON.stringify(rows[0], null, 2));
    }

    // Testar query de contagem
    console.log('\n📋 Testando query de contagem...');
    const countQuery = `
      SELECT COUNT(*) as total
      FROM service_orders so
      LEFT JOIN equipment e ON so.equipment_id = e.id
      LEFT JOIN companies c ON so.company_id = c.id
      LEFT JOIN setores s ON e.sector_id = s.id
      LEFT JOIN subsectors ss ON e.subsector_id = ss.id
      LEFT JOIN users u1 ON so.created_by = u1.id
      LEFT JOIN users u2 ON so.assigned_to = u2.id
    `;

    const [countResult] = await connection.execute(countQuery);
    console.log('✅ Query de contagem executada com sucesso');
    console.log('📊 Total de registros:', countResult[0].total);

    await connection.end();
    console.log('\n✅ Debug concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no debug:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugAPI();