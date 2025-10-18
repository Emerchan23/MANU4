const mysql = require('mysql2/promise');

async function testExportAPI() {
  console.log('🔍 Testando API de Exportação Simplificada...\n');

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

    // Testar query básica de manutenções
    console.log('📊 Testando query básica de manutenções...');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();

    const maintenanceQuery = `
      SELECT 
        so.id,
        so.priority,
        so.status,
        so.description,
        so.cost,
        so.created_at,
        so.updated_at,
        e.name as equipment_name,
        e.patrimonio_number,
        s.name as sector_name
      FROM service_orders so
      JOIN equipment e ON so.equipment_id = e.id
      JOIN sectors s ON e.sector_id = s.id
      WHERE so.created_at >= ? AND so.created_at <= ?
      ORDER BY so.created_at DESC
      LIMIT 3
    `;

    const [maintenanceRows] = await connection.execute(maintenanceQuery, [startDate, endDate]);
    console.log(`✅ Query executada com sucesso - ${maintenanceRows.length} registros`);
    
    if (maintenanceRows.length > 0) {
      console.log('Exemplo de registro:');
      console.log(`  - ID: ${maintenanceRows[0].id}`);
      console.log(`  - Status: ${maintenanceRows[0].status}`);
      console.log(`  - Equipamento: ${maintenanceRows[0].equipment_name}`);
      console.log(`  - Setor: ${maintenanceRows[0].sector_name}`);
      console.log(`  - Custo: R$ ${maintenanceRows[0].cost || 0}`);
    }

    // Calcular estatísticas
    const stats = {
      total: maintenanceRows.length,
      concluidas: maintenanceRows.filter(m => m.status === 'concluida').length,
      custoTotal: maintenanceRows.reduce((sum, m) => sum + (parseFloat(m.cost) || 0), 0)
    };

    console.log('\n📈 Estatísticas calculadas:');
    console.log(`  - Total: ${stats.total}`);
    console.log(`  - Concluídas: ${stats.concluidas}`);
    console.log(`  - Custo Total: R$ ${stats.custoTotal.toFixed(2)}`);

    // Simular resposta da API
    const reportData = {
      title: 'Relatório de Manutenções por Período',
      period: `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`,
      sector: 'Todos os setores',
      stats: stats,
      data: maintenanceRows
    };

    console.log('\n✅ Dados do relatório preparados com sucesso!');
    console.log(`📄 Título: ${reportData.title}`);
    console.log(`📅 Período: ${reportData.period}`);
    console.log(`🏢 Setor: ${reportData.sector}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão com banco fechada');
    }
  }
}

testExportAPI().catch(console.error);