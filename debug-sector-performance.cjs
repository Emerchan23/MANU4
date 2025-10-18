const mysql = require('mysql2/promise');

async function debugSectorPerformance() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('=== DEBUG SECTOR PERFORMANCE API ===\n');

    // Verificar estrutura da tabela service_orders
    console.log('1. Verificando estrutura da tabela service_orders:');
    const [columns] = await connection.execute('DESCRIBE service_orders');
    console.log('Colunas disponíveis:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    // Verificar dados de exemplo
    console.log('\n2. Verificando dados de exemplo:');
    const [orders] = await connection.execute(`
      SELECT id, equipment_id, status, type, priority, assigned_to, created_at, completion_date, cost
      FROM service_orders 
      LIMIT 5
    `);
    console.log('Primeiras 5 ordens:');
    orders.forEach(order => {
      console.log(`  ID: ${order.id}, Status: ${order.status}, Type: ${order.type}, Assigned: ${order.assigned_to}`);
    });

    // Verificar setores
    console.log('\n3. Verificando setores:');
    const [sectors] = await connection.execute('SELECT id, name FROM sectors');
    console.log('Setores disponíveis:');
    sectors.forEach(sector => {
      console.log(`  - ${sector.id}: ${sector.name}`);
    });

    // Verificar equipamentos por setor
    console.log('\n4. Verificando equipamentos por setor:');
    const [equipmentBySector] = await connection.execute(`
      SELECT s.name as sector_name, COUNT(e.id) as equipment_count
      FROM sectors s
      LEFT JOIN equipment e ON s.id = e.sector_id
      GROUP BY s.id, s.name
    `);
    equipmentBySector.forEach(row => {
      console.log(`  - ${row.sector_name}: ${row.equipment_count} equipamentos`);
    });

    // Testar query principal simplificada
    console.log('\n5. Testando query principal simplificada:');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    console.log(`Data de início: ${startDateStr}`);
    
    const [sectorData] = await connection.execute(`
      SELECT 
        s.id as sector_id,
        s.name as sector_name,
        COUNT(DISTINCT e.id) as total_equipment,
        COUNT(so.id) as total_orders
      FROM sectors s
      LEFT JOIN equipment e ON s.id = e.sector_id
      LEFT JOIN service_orders so ON e.id = so.equipment_id AND so.created_at >= ?
      GROUP BY s.id, s.name
      ORDER BY total_orders DESC
    `, [startDateStr]);
    
    console.log('Dados por setor:');
    sectorData.forEach(row => {
      console.log(`  - ${row.sector_name}: ${row.total_equipment} equipamentos, ${row.total_orders} ordens`);
    });

  } catch (error) {
    console.error('Erro:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugSectorPerformance();