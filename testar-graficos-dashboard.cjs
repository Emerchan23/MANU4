const mysql = require('mysql2/promise');

async function testarGraficosDashboard() {
  let connection;
  
  try {
    console.log('🔄 Conectando ao banco de dados...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco de dados');
    
    // 1. Testar dados para gráfico de estatísticas mensais
    console.log('\n📊 1. TESTANDO DADOS PARA GRÁFICO DE ESTATÍSTICAS MENSAIS');
    console.log('='.repeat(60));
    
    const monthlyStatsQuery = `
      SELECT 
        DATE_FORMAT(COALESCE(so.completion_date, so.created_at), '%b') as month,
        COUNT(DISTINCT so.id) as total_scheduled,
        SUM(CASE WHEN so.status IN ('ATRASADA', 'OVERDUE') THEN 1 ELSE 0 END) as overdue,
        SUM(CASE WHEN so.status IN ('CONCLUIDA', 'COMPLETED') THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN so.status IN ('AGENDADA', 'PENDENTE', 'SCHEDULED', 'PENDING', 'EM_ANDAMENTO', 'IN_PROGRESS') THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN so.status IN ('CONCLUIDA', 'COMPLETED') THEN COALESCE(so.actual_cost, so.estimated_cost, 0) ELSE 0 END) as completed_cost,
        SUM(CASE WHEN so.status IN ('ATRASADA', 'OVERDUE') THEN COALESCE(so.actual_cost, so.estimated_cost, 0) ELSE 0 END) as overdue_cost
      FROM service_orders so
      GROUP BY YEAR(COALESCE(so.completion_date, so.created_at)), MONTH(COALESCE(so.completion_date, so.created_at))
      ORDER BY COALESCE(so.completion_date, so.created_at) DESC
    `;
    
    const [monthlyStats] = await connection.execute(monthlyStatsQuery);
    console.log('📈 Dados mensais encontrados:', monthlyStats.length, 'registros');
    
    if (monthlyStats.length > 0) {
      console.log('📋 Primeiros 3 registros:');
      monthlyStats.slice(0, 3).forEach((stat, index) => {
        console.log(`   ${index + 1}. Mês: ${stat.month}, Total: ${stat.total_scheduled}, Concluídas: ${stat.completed}, Atrasadas: ${stat.overdue}`);
      });
    } else {
      console.log('⚠️  Nenhum dado mensal encontrado');
    }
    
    // 2. Testar dados para gráfico de análise de custos por setor
    console.log('\n💰 2. TESTANDO DADOS PARA GRÁFICO DE CUSTOS POR SETOR');
    console.log('='.repeat(60));
    
    const costAnalysisQuery = `
      SELECT 
        s.name as sector_name,
        COALESCE(SUM(so.estimated_cost), 0) as total_estimated_cost,
        COUNT(so.id) as total_service_orders,
        COUNT(DISTINCT e.id) as total_equipments
      FROM sectors s
      LEFT JOIN equipment e ON e.sector_id = s.id AND e.is_active = 1
      LEFT JOIN service_orders so ON so.equipment_id = e.id
      WHERE s.active = 1
      GROUP BY s.id, s.name
      HAVING total_equipments > 0
      ORDER BY total_estimated_cost DESC
      LIMIT 10
    `;
    
    const [costAnalysis] = await connection.execute(costAnalysisQuery);
    console.log('💸 Dados de custos por setor encontrados:', costAnalysis.length, 'registros');
    
    if (costAnalysis.length > 0) {
      console.log('📋 Setores com custos:');
      costAnalysis.forEach((sector, index) => {
        console.log(`   ${index + 1}. ${sector.sector_name}: R$ ${parseFloat(sector.total_estimated_cost).toFixed(2)} (${sector.total_service_orders} OS, ${sector.total_equipments} equipamentos)`);
      });
    } else {
      console.log('⚠️  Nenhum dado de custo por setor encontrado');
    }
    
    // 3. Testar dados para gráfico de performance por empresa
    console.log('\n🏢 3. TESTANDO DADOS PARA GRÁFICO DE PERFORMANCE POR EMPRESA');
    console.log('='.repeat(60));
    
    const performanceQuery = `
      SELECT 
        c.name as company_name,
        ROUND(
          (SUM(CASE WHEN so.status IN ('CONCLUIDA', 'COMPLETED') THEN 1 ELSE 0 END) * 100.0) / 
          NULLIF(COUNT(so.id), 0), 
          0
        ) as completion_rate,
        COUNT(so.id) as total_schedules,
        COALESCE(SUM(so.estimated_cost), 0) as total_cost
      FROM companies c
      LEFT JOIN service_orders so ON so.company_id = c.id
      WHERE c.active = 1
      GROUP BY c.id, c.name
      HAVING total_schedules > 0
      ORDER BY completion_rate DESC
      LIMIT 10
    `;
    
    const [performance] = await connection.execute(performanceQuery);
    console.log('📊 Dados de performance por empresa encontrados:', performance.length, 'registros');
    
    if (performance.length > 0) {
      console.log('📋 Performance das empresas:');
      performance.forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.company_name}: ${company.completion_rate}% (${company.total_schedules} agendamentos)`);
      });
    } else {
      console.log('⚠️  Nenhum dado de performance por empresa encontrado');
    }
    
    // 4. Verificar estrutura dos dados para transformação nos gráficos
    console.log('\n🔄 4. VERIFICANDO TRANSFORMAÇÃO DE DADOS PARA GRÁFICOS');
    console.log('='.repeat(60));
    
    // Simular transformação para LineChart (Estatísticas Mensais)
    const monthlyChartData = monthlyStats.map(stat => ({
      month: stat.month,
      Agendadas: stat.total_scheduled,
      Concluídas: stat.completed,
      Atrasadas: stat.overdue,
      Pendentes: stat.pending,
    }));
    
    console.log('📈 Dados transformados para LineChart (primeiros 2):');
    monthlyChartData.slice(0, 2).forEach((data, index) => {
      console.log(`   ${index + 1}. ${JSON.stringify(data)}`);
    });
    
    // Simular transformação para PieChart (Custos por Setor)
    const costChartData = costAnalysis.map(item => ({
      name: item.sector_name,
      value: parseFloat(item.total_estimated_cost) || 0,
      count: parseInt(item.total_service_orders) || 0,
      equipments: parseInt(item.total_equipments) || 0,
    }));
    
    console.log('🥧 Dados transformados para PieChart (primeiros 2):');
    costChartData.slice(0, 2).forEach((data, index) => {
      console.log(`   ${index + 1}. ${JSON.stringify(data)}`);
    });
    
    // Simular transformação para BarChart (Performance por Empresa)
    const performanceChartData = performance.map(company => ({
      name: company.company_name,
      'Taxa de Conclusão': parseFloat(company.completion_rate) || 0,
      'Total de Agendamentos': parseInt(company.total_schedules) || 0,
    }));
    
    console.log('📊 Dados transformados para BarChart (primeiros 2):');
    performanceChartData.slice(0, 2).forEach((data, index) => {
      console.log(`   ${index + 1}. ${JSON.stringify(data)}`);
    });
    
    // 5. Resumo final
    console.log('\n📋 5. RESUMO DA ANÁLISE DOS GRÁFICOS');
    console.log('='.repeat(60));
    
    const hasMonthlyData = monthlyStats.length > 0;
    const hasCostData = costAnalysis.length > 0;
    const hasPerformanceData = performance.length > 0;
    
    console.log(`📈 Gráfico de Estatísticas Mensais: ${hasMonthlyData ? '✅ TEM DADOS' : '❌ SEM DADOS'}`);
    console.log(`🥧 Gráfico de Custos por Setor: ${hasCostData ? '✅ TEM DADOS' : '❌ SEM DADOS'}`);
    console.log(`📊 Gráfico de Performance por Empresa: ${hasPerformanceData ? '✅ TEM DADOS' : '❌ SEM DADOS'}`);
    
    const allGraphsHaveData = hasMonthlyData && hasCostData && hasPerformanceData;
    console.log(`\n🎯 RESULTADO GERAL: ${allGraphsHaveData ? '✅ TODOS OS GRÁFICOS TÊM DADOS' : '⚠️ ALGUNS GRÁFICOS SEM DADOS'}`);
    
    if (!allGraphsHaveData) {
      console.log('\n💡 RECOMENDAÇÕES:');
      if (!hasMonthlyData) {
        console.log('   - Criar ordens de serviço com datas variadas para popular o gráfico mensal');
      }
      if (!hasCostData) {
        console.log('   - Verificar se existem setores ativos com equipamentos e ordens de serviço');
      }
      if (!hasPerformanceData) {
        console.log('   - Verificar se existem empresas ativas com ordens de serviço vinculadas');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar gráficos do dashboard:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão com banco encerrada');
    }
  }
}

testarGraficosDashboard();