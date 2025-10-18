const mysql = require('mysql2/promise');

async function checkMaintenanceTypes() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '',
    database: 'hospital_maintenance'
  });

  console.log('🔍 Verificando tabelas de tipos de manutenção...');
  
  // Verificar se maintenance_types existe
  try {
    const [mtRows] = await connection.execute('SELECT * FROM maintenance_types WHERE isActive = 1 ORDER BY name');
    console.log('✅ Tabela maintenance_types encontrada:');
    mtRows.forEach(row => console.log(`  - ID: ${row.id}, Nome: ${row.name}`));
  } catch (error) {
    console.log('❌ Tabela maintenance_types não encontrada:', error.message);
  }

  // Verificar se tipos_manutencao existe  
  try {
    const [tmRows] = await connection.execute('SELECT * FROM tipos_manutencao WHERE ativo = 1 ORDER BY nome');
    console.log('\n✅ Tabela tipos_manutencao encontrada:');
    tmRows.forEach(row => console.log(`  - ID: ${row.id}, Nome: ${row.nome}`));
  } catch (error) {
    console.log('\n❌ Tabela tipos_manutencao não encontrada:', error.message);
  }

  // Verificar dados da ordem OS-007/2025
  console.log('\n🔍 Verificando dados da ordem OS-007/2025...');
  const [orderRows] = await connection.execute(`
    SELECT 
      so.*,
      mt.name as maintenance_type_name_from_mt,
      tm.nome as maintenance_type_name_from_tm
    FROM service_orders so
    LEFT JOIN maintenance_types mt ON so.maintenance_type_id = mt.id
    LEFT JOIN tipos_manutencao tm ON so.maintenance_type_id = tm.id
    WHERE so.order_number = 'OS-007/2025'
  `);
  
  if (orderRows.length > 0) {
    const order = orderRows[0];
    console.log('📋 Dados da ordem:');
    console.log(`  - Order Number: ${order.order_number}`);
    console.log(`  - Maintenance Type ID: ${order.maintenance_type_id}`);
    console.log(`  - Nome do tipo (maintenance_types): ${order.maintenance_type_name_from_mt}`);
    console.log(`  - Nome do tipo (tipos_manutencao): ${order.maintenance_type_name_from_tm}`);
  } else {
    console.log('❌ Ordem OS-007/2025 não encontrada');
  }

  await connection.end();
}

checkMaintenanceTypes().catch(console.error);