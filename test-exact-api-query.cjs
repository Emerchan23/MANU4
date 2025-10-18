const mysql = require('mysql2/promise');
require('dotenv').config();

async function testExactAPIQuery() {
  let connection;
  
  try {
    console.log('🔍 Testando query exata da API...');
    
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance',
      charset: 'utf8mb4',
      timezone: '+00:00'
    };

    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');

    // Query exata da API
    const mainQuery = `
      SELECT
        so.id,
        so.order_number,
        so.equipment_id,
        so.type,
        so.maintenance_type_id,
        so.description,
        so.priority,
        so.status,
        so.requested_date,
        so.scheduled_date,
        so.completion_date,
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

    console.log('\n📊 Executando query completa...');
    
    try {
      const [rows] = await connection.execute(mainQuery);
      console.log(`✅ Query executada com sucesso! Retornou ${rows.length} registros`);
      
      if (rows.length > 0) {
        console.log('\n📋 Primeiro registro:');
        const firstRow = rows[0];
        console.log(`ID: ${firstRow.id}`);
        console.log(`Número: ${firstRow.order_number || 'N/A'}`);
        console.log(`Descrição: ${firstRow.description ? firstRow.description.substring(0, 50) + '...' : 'N/A'}`);
        console.log(`Status: ${firstRow.status}`);
        console.log(`Prioridade: ${firstRow.priority}`);
        console.log(`Equipamento: ${firstRow.equipment_name || 'N/A'}`);
        console.log(`Empresa: ${firstRow.company_name || 'N/A'}`);
        console.log(`Setor: ${firstRow.sector_name || 'N/A'}`);
        console.log(`Subsetor: ${firstRow.subsector_name || 'N/A'}`);
        console.log(`Solicitante: ${firstRow.requester_name || 'N/A'}`);
        console.log(`Técnico: ${firstRow.assigned_technician_name || 'N/A'}`);
        
        console.log('\n📄 Registro completo (JSON):');
        console.log(JSON.stringify(firstRow, null, 2));
      }
      
    } catch (queryError) {
      console.error('❌ Erro na query:', queryError.message);
      console.error('Stack:', queryError.stack);
      
      // Vamos tentar uma versão simplificada
      console.log('\n🔄 Tentando versão simplificada...');
      
      const simpleQuery = `
        SELECT
          so.id,
          so.description,
          so.status,
          so.priority,
          so.created_at
        FROM service_orders so
        ORDER BY so.created_at DESC
        LIMIT 5
      `;
      
      try {
        const [simpleRows] = await connection.execute(simpleQuery);
        console.log(`✅ Query simplificada funcionou! ${simpleRows.length} registros`);
        
        simpleRows.forEach((row, index) => {
          console.log(`${index + 1}. ID: ${row.id}, Status: ${row.status}, Prioridade: ${row.priority}`);
        });
        
      } catch (simpleError) {
        console.error('❌ Até a query simplificada falhou:', simpleError.message);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada');
    }
  }
}

testExactAPIQuery();