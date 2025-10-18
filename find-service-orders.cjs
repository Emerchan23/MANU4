const mysql = require('mysql2/promise');

async function findServiceOrders() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  try {
    console.log('🔍 Buscando ordens de serviço existentes...\n');
    
    const [rows] = await connection.execute(`
      SELECT 
        so.id,
        so.order_number,
        so.description,
        so.status,
        e.name as equipment_name,
        c.name as company_name
      FROM service_orders so
      LEFT JOIN equipment e ON so.equipment_id = e.id
      LEFT JOIN empresas c ON so.company_id = c.id
      ORDER BY so.id DESC
      LIMIT 5
    `);
    
    if (rows.length > 0) {
      console.log('Ordens de serviço encontradas:');
      rows.forEach(order => {
        console.log(`  ID: ${order.id} | Número: ${order.order_number || 'N/A'} | Status: ${order.status}`);
        console.log(`      Equipamento: ${order.equipment_name || 'N/A'}`);
        console.log(`      Empresa: ${order.company_name || 'N/A'}`);
        console.log('');
      });
      
      console.log(`✅ Encontradas ${rows.length} ordens de serviço`);
      console.log(`📋 Vamos testar com a ordem ID: ${rows[0].id}`);
    } else {
      console.log('❌ Nenhuma ordem de serviço encontrada');
    }
    
  } catch (error) {
    console.error('❌ Erro ao buscar ordens:', error.message);
  } finally {
    await connection.end();
  }
}

findServiceOrders();