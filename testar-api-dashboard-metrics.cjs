const { default: fetch } = require('node-fetch');

async function testarAPIDashboardMetrics() {
  try {
    console.log('🔄 Testando API /api/dashboard/metrics...');
    
    const response = await fetch('http://localhost:3000/api/dashboard/metrics');
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.error('❌ Erro na API:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('📄 Conteúdo do erro:', errorText);
      return;
    }
    
    const data = await response.json();
    
    console.log('\n✅ API respondeu com sucesso!');
    console.log('\n📊 ESTRUTURA DA RESPOSTA:');
    console.log('='.repeat(50));
    
    // Verificar métricas
    if (data.metrics) {
      console.log('\n📈 MÉTRICAS:');
      console.log('- Equipamentos Ativos:', data.metrics.activeEquipment || data.metrics.equipmentsActive);
      console.log('- Manutenções Pendentes:', data.metrics.pendingMaintenances);
      console.log('- Ordens de Serviço Abertas:', data.metrics.openServiceOrders);
      console.log('- Alertas Críticos:', data.metrics.criticalAlerts);
      console.log('- Agendamentos Próximos:', data.metrics.upcomingAppointments);
    }
    
    // Verificar dados dos gráficos
    if (data.charts) {
      console.log('\n📊 DADOS DOS GRÁFICOS:');
      console.log('- Estatísticas Mensais:', data.charts.monthlyStats?.length || 0, 'registros');
      console.log('- Análise de Custos:', data.charts.costAnalysis?.length || 0, 'registros');
      console.log('- Performance Empresas:', data.charts.companyPerformance?.length || 0, 'registros');
      
      // Mostrar amostra dos dados mensais
      if (data.charts.monthlyStats && data.charts.monthlyStats.length > 0) {
        console.log('\n📈 AMOSTRA - Estatísticas Mensais:');
        data.charts.monthlyStats.slice(0, 2).forEach((stat, index) => {
          console.log(`   ${index + 1}. Mês: ${stat.month}, Total: ${stat.total_scheduled}, Concluídas: ${stat.completed}, Atrasadas: ${stat.overdue}`);
        });
      }
      
      // Mostrar amostra dos custos por setor
      if (data.charts.costAnalysis && data.charts.costAnalysis.length > 0) {
        console.log('\n💰 AMOSTRA - Custos por Setor:');
        data.charts.costAnalysis.slice(0, 2).forEach((cost, index) => {
          console.log(`   ${index + 1}. Setor: ${cost.sector_name}, Custo: R$ ${parseFloat(cost.total_estimated_cost).toFixed(2)}`);
        });
      }
      
      // Mostrar amostra da performance
      if (data.charts.companyPerformance && data.charts.companyPerformance.length > 0) {
        console.log('\n🏢 AMOSTRA - Performance por Empresa:');
        data.charts.companyPerformance.slice(0, 2).forEach((perf, index) => {
          console.log(`   ${index + 1}. Empresa: ${perf.company_name}, Taxa: ${perf.completion_rate}%`);
        });
      }
    }
    
    // Verificar compatibilidade com OperationalCharts
    console.log('\n🔄 VERIFICANDO COMPATIBILIDADE COM OPERATIONALCHARTS:');
    console.log('='.repeat(50));
    
    const hasMonthlyStats = data.charts?.monthlyStats && data.charts.monthlyStats.length > 0;
    const hasCostAnalysis = data.charts?.costAnalysis && data.charts.costAnalysis.length > 0;
    const hasCompanyPerformance = data.charts?.companyPerformance && data.charts.companyPerformance.length > 0;
    
    console.log(`📈 LineChart (Estatísticas Mensais): ${hasMonthlyStats ? '✅ DADOS OK' : '❌ SEM DADOS'}`);
    console.log(`🥧 PieChart (Custos por Setor): ${hasCostAnalysis ? '✅ DADOS OK' : '❌ SEM DADOS'}`);
    console.log(`📊 BarChart (Performance Empresas): ${hasCompanyPerformance ? '✅ DADOS OK' : '❌ SEM DADOS'}`);
    
    const allChartsReady = hasMonthlyStats && hasCostAnalysis && hasCompanyPerformance;
    console.log(`\n🎯 RESULTADO: ${allChartsReady ? '✅ TODOS OS GRÁFICOS PRONTOS' : '⚠️ ALGUNS GRÁFICOS SEM DADOS'}`);
    
    // Verificar estrutura dos dados para transformação
    if (hasMonthlyStats) {
      const sampleMonthly = data.charts.monthlyStats[0];
      const requiredFields = ['month', 'total_scheduled', 'completed', 'overdue', 'pending'];
      const hasAllFields = requiredFields.every(field => sampleMonthly.hasOwnProperty(field));
      console.log(`📈 Campos necessários para LineChart: ${hasAllFields ? '✅ OK' : '❌ FALTANDO'}`);
    }
    
    if (hasCostAnalysis) {
      const sampleCost = data.charts.costAnalysis[0];
      const requiredFields = ['sector_name', 'total_estimated_cost'];
      const hasAllFields = requiredFields.every(field => sampleCost.hasOwnProperty(field));
      console.log(`🥧 Campos necessários para PieChart: ${hasAllFields ? '✅ OK' : '❌ FALTANDO'}`);
    }
    
    if (hasCompanyPerformance) {
      const samplePerf = data.charts.companyPerformance[0];
      const requiredFields = ['company_name', 'completion_rate', 'total_schedules'];
      const hasAllFields = requiredFields.every(field => samplePerf.hasOwnProperty(field));
      console.log(`📊 Campos necessários para BarChart: ${hasAllFields ? '✅ OK' : '❌ FALTANDO'}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
  }
}

testarAPIDashboardMetrics();