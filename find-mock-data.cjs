const { query } = require('./lib/database.js');

async function findMockData() {
  try {
    console.log('=== INVESTIGANDO DADOS MOCKADOS NA INTERFACE ===');
    
    // 1. Verificar se há dados reais no banco
    console.log('\n1. VERIFICANDO DADOS REAIS NO BANCO');
    const totalOrders = await query('SELECT COUNT(*) as total FROM service_orders');
    console.log(`📊 Total de ordens no banco: ${totalOrders[0].total}`);
    
    if (totalOrders[0].total === 0) {
      console.log('❌ Banco está vazio - dados na interface são MOCKADOS!');
      console.log('\n🔍 CONCLUSÃO: Os dados das ordens 13 e 14 com "Invalid Date"');
      console.log('   estão sendo gerados por código mockado na interface do usuário.');
      console.log('   Não há dados reais no banco de dados.');
    } else {
      console.log('✅ Há dados reais no banco - investigando ordens específicas...');
      
      // Verificar ordens específicas
      const specificOrders = await query(`
        SELECT 
          id,
          scheduled_date,
          completion_date,
          created_at
        FROM service_orders 
        WHERE id IN (13, 14)
        ORDER BY id
      `);
      
      if (specificOrders.length > 0) {
        console.log('\n📋 ORDENS 13 E 14 ENCONTRADAS NO BANCO:');
        specificOrders.forEach(order => {
          console.log(`\nOrdem ${order.id}:`);
          console.log(`  scheduled_date: '${order.scheduled_date}' (tipo: ${typeof order.scheduled_date})`);
          console.log(`  completion_date: '${order.completion_date}' (tipo: ${typeof order.completion_date})`);
          console.log(`  created_at: '${order.created_at}' (tipo: ${typeof order.created_at})`);
        });
      } else {
        console.log('❌ Ordens 13 e 14 NÃO encontradas no banco - dados são mockados na interface!');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao investigar dados mockados:', error);
  } finally {
    console.log('\n=== INVESTIGAÇÃO CONCLUÍDA ===');
    process.exit(0);
  }
}

findMockData();