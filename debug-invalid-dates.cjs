const { query } = require('./lib/database.js');

async function investigateInvalidDates() {
  try {
    console.log('=== INVESTIGANDO DADOS BRUTOS DAS ORDENS 13 E 14 ===');
    
    // Buscar dados brutos das ordens problemáticas
    const problematicOrders = await query(`
      SELECT 
        id,
        scheduled_date,
        completion_date,
        created_at,
        updated_at
      FROM service_orders 
      WHERE id IN (13, 14)
      ORDER BY id
    `);
    
    console.log('\n--- DADOS BRUTOS DAS ORDENS PROBLEMÁTICAS ---');
    problematicOrders.forEach(order => {
      console.log(`\nOrdem ${order.id}:`);
      console.log(`  scheduled_date: '${order.scheduled_date}' (tipo: ${typeof order.scheduled_date}, tamanho: ${order.scheduled_date ? order.scheduled_date.length : 'null'})`);
      console.log(`  completion_date: '${order.completion_date}' (tipo: ${typeof order.completion_date}, tamanho: ${order.completion_date ? order.completion_date.length : 'null'})`);
      console.log(`  created_at: '${order.created_at}'`);
      console.log(`  updated_at: '${order.updated_at}'`);
    });
    
    // Comparar com ordens funcionais
    const workingOrders = await query(`
      SELECT 
        id,
        scheduled_date,
        completion_date
      FROM service_orders 
      WHERE id IN (7, 8, 9, 10, 11, 12)
      ORDER BY id
      LIMIT 3
    `);
    
    console.log('\n--- DADOS BRUTOS DAS ORDENS FUNCIONAIS (COMPARAÇÃO) ---');
    workingOrders.forEach(order => {
      console.log(`\nOrdem ${order.id}:`);
      console.log(`  scheduled_date: '${order.scheduled_date}' (tipo: ${typeof order.scheduled_date}, tamanho: ${order.scheduled_date ? order.scheduled_date.length : 'null'})`);
      console.log(`  completion_date: '${order.completion_date}' (tipo: ${typeof order.completion_date}, tamanho: ${order.completion_date ? order.completion_date.length : 'null'})`);
    });
    
    // Verificar se há caracteres especiais ou problemas de encoding
    console.log('\n--- ANÁLISE DE CARACTERES ESPECIAIS ---');
    problematicOrders.forEach(order => {
      if (order.scheduled_date) {
        const chars = Array.from(order.scheduled_date.toString()).map(char => `${char}(${char.charCodeAt(0)})`);
        console.log(`Ordem ${order.id} scheduled_date chars: ${chars.join(' ')}`);
      }
      if (order.completion_date) {
        const chars = Array.from(order.completion_date.toString()).map(char => `${char}(${char.charCodeAt(0)})`);
        console.log(`Ordem ${order.id} completion_date chars: ${chars.join(' ')}`);
      }
    });
    
    // Testar formatação das datas problemáticas
    console.log('\n--- TESTE DE FORMATAÇÃO ---');
    
    // Função de formatação simples para teste
    function testFormatDateBR(dateValue) {
      try {
        if (!dateValue) return 'null';
        
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
          return 'Invalid Date';
        }
        
        return date.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        return `Erro: ${error.message}`;
      }
    }
    
    problematicOrders.forEach(order => {
      console.log(`\nOrdem ${order.id}:`);
      console.log(`  scheduled_date original: '${order.scheduled_date}'`);
      console.log(`  scheduled_date formatado: '${testFormatDateBR(order.scheduled_date)}'`);
      
      if (order.completion_date) {
        console.log(`  completion_date original: '${order.completion_date}'`);
        console.log(`  completion_date formatado: '${testFormatDateBR(order.completion_date)}'`);
      }
    });
    
  } catch (error) {
    console.error('Erro ao investigar dados:', error);
  } finally {
    console.log('\n=== INVESTIGAÇÃO CONCLUÍDA ===');
    process.exit(0);
  }
}

investigateInvalidDates();