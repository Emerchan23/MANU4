const mysql = require('mysql2/promise');

async function debugExportAPI() {
  console.log('🔍 Debugando API de Exportação de Relatórios...\n');

  // Configuração do banco
  const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  };

  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados\n');

    // Testar query de manutenções
    console.log('📊 Testando query de manutenções...');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();

    const maintenanceQuery = `
      SELECT 
        so.id,
        so.number,
        so.type,
        so.priority,
        so.status,
        so.description,
        so.cost,
        so.created_at,
        so.updated_at,
        e.name as equipment_name,
        e.patrimonio_number,
        s.name as sector_name,
        u.name as technician_name
      FROM service_orders so
      JOIN equipment e ON so.equipment_id = e.id
      JOIN sectors s ON e.sector_id = s.id
      LEFT JOIN users u ON so.assigned_to = u.id
      WHERE so.created_at >= ? AND so.created_at <= ?
      ORDER BY so.created_at DESC
      LIMIT 5
    `;

    try {
      const [maintenanceRows] = await connection.execute(maintenanceQuery, [startDate, endDate]);
      console.log(`✅ Query de manutenções executada com sucesso - ${maintenanceRows.length} registros`);
      if (maintenanceRows.length > 0) {
        console.log('Exemplo de registro:', JSON.stringify(maintenanceRows[0], null, 2));
      }
    } catch (error) {
      console.error('❌ Erro na query de manutenções:', error.message);
    }

    console.log('\n📊 Testando query de custos...');
    const costQuery = `
      SELECT 
        e.id,
        e.name as equipment_name,
        e.patrimonio_number,
        e.model,
        s.name as sector_name,
        COUNT(so.id) as total_orders,
        COALESCE(SUM(so.cost), 0) as total_cost,
        COALESCE(AVG(so.cost), 0) as avg_cost,
        COUNT(CASE WHEN so.type = 'PREVENTIVA' THEN 1 END) as preventive_count,
        COUNT(CASE WHEN so.type = 'CORRETIVA' THEN 1 END) as corrective_count
      FROM equipment e
      JOIN sectors s ON e.sector_id = s.id
      LEFT JOIN service_orders so ON e.id = so.equipment_id 
        AND so.created_at >= ? AND so.created_at <= ?
      GROUP BY e.id, e.name, e.patrimonio_number, e.model, s.name
      ORDER BY total_cost DESC
      LIMIT 5
    `;

    try {
      const [costRows] = await connection.execute(costQuery, [startDate, endDate]);
      console.log(`✅ Query de custos executada com sucesso - ${costRows.length} registros`);
      if (costRows.length > 0) {
        console.log('Exemplo de registro:', JSON.stringify(costRows[0], null, 2));
      }
    } catch (error) {
      console.error('❌ Erro na query de custos:', error.message);
    }

    console.log('\n📊 Testando query de técnicos...');
    const technicianQuery = `
      SELECT 
        u.id,
        u.name as technician_name,
        u.email,
        COUNT(so.id) as total_orders,
        COUNT(CASE WHEN so.status = 'CONCLUIDA' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN so.status IN ('ABERTA', 'EM_ANDAMENTO') THEN 1 END) as open_orders,
        COALESCE(SUM(so.cost), 0) as total_cost,
        COALESCE(AVG(DATEDIFF(so.updated_at, so.created_at)), 0) as avg_resolution_days,
        COUNT(CASE WHEN so.priority = 'ALTA' THEN 1 END) as high_priority_orders
      FROM users u
      LEFT JOIN service_orders so ON u.id = so.assigned_to 
        AND so.created_at >= ? AND so.created_at <= ?
      WHERE u.role = 'TECNICO'
      GROUP BY u.id, u.name, u.email
      HAVING total_orders > 0
      ORDER BY completed_orders DESC, avg_resolution_days ASC
      LIMIT 5
    `;

    try {
      const [technicianRows] = await connection.execute(technicianQuery, [startDate, endDate]);
      console.log(`✅ Query de técnicos executada com sucesso - ${technicianRows.length} registros`);
      if (technicianRows.length > 0) {
        console.log('Exemplo de registro:', JSON.stringify(technicianRows[0], null, 2));
      }
    } catch (error) {
      console.error('❌ Erro na query de técnicos:', error.message);
    }

    console.log('\n📊 Testando query de SLA...');
    const slaQuery = `
      SELECT 
        so.id,
        so.number,
        so.type,
        so.priority,
        so.status,
        so.created_at,
        so.updated_at,
        so.due_date,
        e.name as equipment_name,
        s.name as sector_name,
        u.name as technician_name,
        CASE 
          WHEN so.status = 'CONCLUIDA' AND so.updated_at <= so.due_date THEN 'NO_PRAZO'
          WHEN so.status = 'CONCLUIDA' AND so.updated_at > so.due_date THEN 'ATRASADO'
          WHEN so.status != 'CONCLUIDA' AND NOW() > so.due_date THEN 'ATRASADO'
          ELSE 'NO_PRAZO'
        END as sla_status,
        DATEDIFF(
          CASE WHEN so.status = 'CONCLUIDA' THEN so.updated_at ELSE NOW() END,
          so.due_date
        ) as days_difference
      FROM service_orders so
      JOIN equipment e ON so.equipment_id = e.id
      JOIN sectors s ON e.sector_id = s.id
      LEFT JOIN users u ON so.assigned_to = u.id
      WHERE so.created_at >= ? AND so.created_at <= ?
      ORDER BY so.created_at DESC
      LIMIT 5
    `;

    try {
      const [slaRows] = await connection.execute(slaQuery, [startDate, endDate]);
      console.log(`✅ Query de SLA executada com sucesso - ${slaRows.length} registros`);
      if (slaRows.length > 0) {
        console.log('Exemplo de registro:', JSON.stringify(slaRows[0], null, 2));
      }
    } catch (error) {
      console.error('❌ Erro na query de SLA:', error.message);
    }

    // Verificar estrutura das tabelas necessárias
    console.log('\n🔍 Verificando estrutura das tabelas...');
    
    const tables = ['service_orders', 'equipment', 'sectors', 'users'];
    for (const table of tables) {
      try {
        const [columns] = await connection.execute(`DESCRIBE ${table}`);
        console.log(`\n📋 Estrutura da tabela ${table}:`);
        columns.forEach(col => {
          console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : ''} ${col.Key ? `(${col.Key})` : ''}`);
        });
      } catch (error) {
        console.error(`❌ Erro ao verificar tabela ${table}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão com banco fechada');
    }
  }
}

debugExportAPI().catch(console.error);