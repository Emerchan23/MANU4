const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugServiceOrdersAPI() {
  let connection;
  
  try {
    console.log('🔍 Debugando API de ordens de serviço...');
    
    // Configuração do banco de dados
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance',
      charset: 'utf8mb4',
      timezone: '+00:00'
    };

    console.log(`📍 Conectando ao banco: ${dbConfig.database}@${dbConfig.host}`);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');

    // Testar a query exata que a API está usando
    console.log('\n📊 Testando query de contagem...');
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

    try {
      const [countResult] = await connection.execute(countQuery);
      console.log('✅ Query de contagem executada com sucesso');
      console.log('📊 Resultado:', countResult);
    } catch (error) {
      console.error('❌ Erro na query de contagem:', error.message);
      console.error('Stack:', error.stack);
      
      // Verificar se as tabelas existem
      console.log('\n🔍 Verificando se as tabelas existem...');
      
      const tables = ['service_orders', 'equipment', 'companies', 'setores', 'subsectors', 'users'];
      
      for (const table of tables) {
        try {
          const [tableExists] = await connection.execute(
            `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?`,
            [dbConfig.database, table]
          );
          
          if (tableExists[0].count > 0) {
            console.log(`✅ Tabela ${table} existe`);
          } else {
            console.log(`❌ Tabela ${table} NÃO existe`);
          }
        } catch (err) {
          console.log(`❌ Erro ao verificar tabela ${table}:`, err.message);
        }
      }
      
      return;
    }

    // Testar query principal simplificada
    console.log('\n📊 Testando query principal simplificada...');
    const simpleQuery = `
      SELECT
        so.id,
        so.order_number,
        so.description,
        so.status,
        so.priority,
        so.created_at
      FROM service_orders so
      ORDER BY so.created_at DESC
      LIMIT 5
    `;

    try {
      const [rows] = await connection.execute(simpleQuery);
      console.log('✅ Query principal simplificada executada com sucesso');
      console.log('📊 Primeiros 5 registros:');
      rows.forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id}, Descrição: ${row.description?.substring(0, 50)}...`);
      });
    } catch (error) {
      console.error('❌ Erro na query principal:', error.message);
      console.error('Stack:', error.stack);
    }

    // Testar query completa
    console.log('\n📊 Testando query completa...');
    const fullQuery = `
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
      LIMIT 2
    `;

    try {
      const [rows] = await connection.execute(fullQuery);
      console.log('✅ Query completa executada com sucesso');
      console.log(`📊 Retornou ${rows.length} registros`);
      
      if (rows.length > 0) {
        console.log('\n📋 Primeiro registro completo:');
        console.log(JSON.stringify(rows[0], null, 2));
      }
    } catch (error) {
      console.error('❌ Erro na query completa:', error.message);
      console.error('Stack:', error.stack);
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

debugServiceOrdersAPI();