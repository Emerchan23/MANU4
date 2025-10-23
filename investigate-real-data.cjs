const { query } = require('./lib/database.js');

async function investigateRealData() {
  try {
    console.log('=== INVESTIGANDO DADOS REAIS NO BANCO ===');
    
    // 1. Verificar quantas ordens existem
    console.log('\n1. VERIFICANDO TOTAL DE ORDENS DE SERVIÇO');
    const totalOrders = await query('SELECT COUNT(*) as total FROM service_orders');
    console.log(`📊 Total de ordens no banco: ${totalOrders[0].total}`);
    
    if (totalOrders[0].total === 0) {
      console.log('❌ Nenhuma ordem de serviço encontrada no banco!');
      console.log('🔍 Vamos verificar se a tabela existe...');
      
      const tableExists = await query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'hospital_maintenance' 
        AND table_name = 'service_orders'
      `);
      
      if (tableExists[0].count > 0) {
        console.log('✅ Tabela service_orders existe, mas está vazia');
      } else {
        console.log('❌ Tabela service_orders não existe!');
      }
      
      return;
    }
    
    // 2. Buscar todas as ordens existentes
    console.log('\n2. LISTANDO TODAS AS ORDENS EXISTENTES');
    const allOrders = await query(`
      SELECT 
        id,
        order_number,
        scheduled_date,
        completion_date,
        created_at,
        updated_at,
        status
      FROM service_orders 
      ORDER BY id
    `);
    
    console.log(`📋 Encontradas ${allOrders.length} ordens:`);
    allOrders.forEach(order => {
      console.log(`\n--- ORDEM ${order.id} ---`);
      console.log(`  Número: ${order.order_number || 'N/A'}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  scheduled_date: '${order.scheduled_date}' (tipo: ${typeof order.scheduled_date})`);
      console.log(`  completion_date: '${order.completion_date}' (tipo: ${typeof order.completion_date})`);
      console.log(`  created_at: '${order.created_at}' (tipo: ${typeof order.created_at})`);
      console.log(`  updated_at: '${order.updated_at}' (tipo: ${typeof order.updated_at})`);
    });
    
    // 3. Testar formatação das datas encontradas
    console.log('\n3. TESTANDO FORMATAÇÃO DAS DATAS');
    
    function testFormatDateBR(dateValue) {
      if (!dateValue) return 'null';
      
      try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
          return 'Invalid Date';
        }
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
      } catch (error) {
        return `Erro: ${error.message}`;
      }
    }
    
    allOrders.forEach(order => {
      console.log(`\n--- FORMATAÇÃO ORDEM ${order.id} ---`);
      console.log(`  scheduled_date original: '${order.scheduled_date}'`);
      console.log(`  scheduled_date formatado: '${testFormatDateBR(order.scheduled_date)}'`);
      
      if (order.completion_date) {
        console.log(`  completion_date original: '${order.completion_date}'`);
        console.log(`  completion_date formatado: '${testFormatDateBR(order.completion_date)}'`);
      }
      
      console.log(`  created_at original: '${order.created_at}'`);
      console.log(`  created_at formatado: '${testFormatDateBR(order.created_at)}'`);
    });
    
    // 4. Verificar se há dados mockados sendo usados na interface
    console.log('\n4. VERIFICANDO POSSÍVEIS DADOS MOCKADOS');
    console.log('🔍 Se você está vendo "Invalid Date" na interface mas os dados do banco estão corretos,');
    console.log('   pode haver dados mockados ou hardcoded sendo usados na interface.');
    console.log('   Vamos verificar se há algum padrão nos dados...');
    
    // Verificar se há ordens com IDs específicos que podem estar sendo mockadas
    const specificIds = [7, 8, 9, 10, 11, 12, 13, 14];
    console.log('\n🔍 Verificando se existem ordens com IDs específicos (7-14):');
    
    for (const id of specificIds) {
      const orderExists = await query('SELECT COUNT(*) as count FROM service_orders WHERE id = ?', [id]);
      console.log(`   ID ${id}: ${orderExists[0].count > 0 ? '✅ Existe' : '❌ Não existe'}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao investigar dados:', error);
  } finally {
    console.log('\n=== INVESTIGAÇÃO CONCLUÍDA ===');
    process.exit(0);
  }
}

investigateRealData();