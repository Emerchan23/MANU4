const mysql = require('mysql2/promise');

async function testReportsStats() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance',
    charset: 'utf8mb4',
    timezone: '+00:00'
  });

  try {
    console.log('🔍 Testando queries da API de estatísticas de relatórios...\n');

    // Parâmetros de teste
    const dateRange = '30';
    const sectorId = 'ALL';
    
    // Calcular data de início baseada no período
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(dateRange));
    const startDateStr = startDate.toISOString().split('T')[0];

    console.log('📅 Período:', dateRange, 'dias');
    console.log('📅 Data de início:', startDateStr);
    console.log('🏢 Setor:', sectorId);

    // Query base para filtros
    const sectorFilter = sectorId !== 'ALL' ? 'AND e.sector_id = ?' : '';
    const sectorParams = sectorId !== 'ALL' ? [sectorId] : [];

    // 1. Total de equipamentos
    console.log('\n1️⃣ Testando query de total de equipamentos...');
    const totalEquipmentQuery = `
      SELECT COUNT(*) as total FROM equipment e 
      WHERE e.created_at <= NOW() ${sectorFilter}
    `;
    const [totalEquipmentResult] = await connection.execute(totalEquipmentQuery, sectorParams);
    console.log('✅ Total de equipamentos:', totalEquipmentResult[0].total);

    // 2. Ordens de serviço abertas
    console.log('\n2️⃣ Testando query de ordens abertas...');
    const openOrdersQuery = `
      SELECT COUNT(*) as total FROM service_orders so 
      JOIN equipment e ON so.equipment_id = e.id 
      WHERE so.status IN ('aberta', 'em_andamento') ${sectorFilter}
    `;
    const [openOrdersResult] = await connection.execute(openOrdersQuery, sectorParams);
    console.log('✅ Ordens abertas:', openOrdersResult[0].total);

    // 3. Custo total
    console.log('\n3️⃣ Testando query de custo total...');
    const totalCostQuery = `
      SELECT COALESCE(SUM(so.cost), 0) as total FROM service_orders so 
      JOIN equipment e ON so.equipment_id = e.id 
      WHERE so.requested_date >= ? ${sectorFilter}
    `;
    const [totalCostResult] = await connection.execute(totalCostQuery, [startDateStr, ...sectorParams]);
    console.log('✅ Custo total:', totalCostResult[0].total);

    // 4. Tempo médio de resolução
    console.log('\n4️⃣ Testando query de tempo médio...');
    const avgTimeQuery = `
      SELECT COALESCE(AVG(TIMESTAMPDIFF(HOUR, so.requested_date, so.completion_date)), 0) as avg_time 
      FROM service_orders so 
      JOIN equipment e ON so.equipment_id = e.id 
      WHERE so.status = 'concluida' AND so.requested_date >= ? ${sectorFilter}
    `;
    const [avgTimeResult] = await connection.execute(avgTimeQuery, [startDateStr, ...sectorParams]);
    console.log('✅ Tempo médio (horas):', avgTimeResult[0].avg_time);

    console.log('\n📊 Resumo dos resultados:');
    console.log(`  - Equipamentos: ${totalEquipmentResult[0].total}`);
    console.log(`  - Ordens abertas: ${openOrdersResult[0].total}`);
    console.log(`  - Custo total: R$ ${totalCostResult[0].total}`);
    console.log(`  - Tempo médio: ${avgTimeResult[0].avg_time} horas`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
    console.log('\n🔌 Conexão fechada');
  }
}

testReportsStats();