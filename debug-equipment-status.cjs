const mysql = require('mysql2/promise');

async function debugEquipmentStatus() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('=== DEBUG EQUIPMENT STATUS API ===\n');

    // Verificar estrutura da tabela equipment
    console.log('1. Verificando estrutura da tabela equipment:');
    const [columns] = await connection.execute('DESCRIBE equipment');
    console.log('Colunas disponíveis:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    // Verificar dados de exemplo
    console.log('\n2. Verificando dados de exemplo:');
    const [equipment] = await connection.execute(`
      SELECT id, name, model, serial_number, status, sector_id, subsector_id
      FROM equipment 
      LIMIT 5
    `);
    console.log('Primeiros 5 equipamentos:');
    equipment.forEach(eq => {
      console.log(`  ID: ${eq.id}, Nome: ${eq.name}, Status: ${eq.status}, Setor: ${eq.sector_id}`);
    });

    // Testar query simplificada
    console.log('\n3. Testando query simplificada:');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    console.log(`Data de início: ${startDateStr}`);
    
    const [equipmentData] = await connection.execute(`
      SELECT 
        e.id,
        e.name as equipment_name,
        e.status,
        s.name as sector_name,
        COUNT(so.id) as total_orders
      FROM equipment e
      LEFT JOIN sectors s ON e.sector_id = s.id
      LEFT JOIN service_orders so ON e.id = so.equipment_id AND so.created_at >= ?
      GROUP BY e.id, e.name, e.status, s.name
      ORDER BY total_orders DESC
      LIMIT 5
    `, [startDateStr]);
    
    console.log('Dados de equipamentos:');
    equipmentData.forEach(row => {
      console.log(`  - ${row.equipment_name} (${row.status}): ${row.total_orders} ordens`);
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

debugEquipmentStatus();