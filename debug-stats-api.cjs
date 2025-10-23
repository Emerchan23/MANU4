const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugStatsAPI() {
  try {
    console.log('🔍 Debugando API de estatísticas...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306')
    });

    console.log('✅ Conectado ao banco de dados');

    const equipmentId = 9;

    // Testar a query exata da API
    console.log('\n📊 Testando query da API de estatísticas:');
    const [statsRows] = await connection.execute(`
      SELECT 
        COUNT(*) as total_maintenances,
        COALESCE(SUM(COALESCE(actual_cost, estimated_cost, cost)), 0) as total_cost,
        0 as average_repair_time,
        ROUND(
          (COUNT(CASE WHEN status = 'CONCLUIDA' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(*), 0)), 1
        ) as success_rate
      FROM service_orders
      WHERE equipment_id = ?
    `, [equipmentId]);

    console.log('Resultado da query:', statsRows[0]);

    // Verificar se existem registros na tabela service_orders
    console.log('\n🔍 Verificando todos os registros na tabela service_orders:');
    const [allOrders] = await connection.execute('SELECT * FROM service_orders WHERE equipment_id = ?', [equipmentId]);
    console.log(`Total de registros encontrados: ${allOrders.length}`);
    
    if (allOrders.length > 0) {
      console.log('Registros encontrados:');
      allOrders.forEach((order, index) => {
        console.log(`Ordem ${index + 1}:`, {
          id: order.id,
          order_number: order.order_number,
          equipment_id: order.equipment_id,
          status: order.status,
          total_cost: order.total_cost,
          created_at: order.created_at
        });
      });
    }

    // Verificar estrutura da tabela
    console.log('\n📋 Verificando estrutura da tabela service_orders:');
    const [columns] = await connection.execute('DESCRIBE service_orders');
    console.log('Colunas da tabela:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    await connection.end();
    console.log('\n✅ Debug concluído');

  } catch (error) {
    console.error('❌ Erro no debug:', error);
  }
}

debugStatsAPI();