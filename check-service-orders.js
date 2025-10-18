import mysql from 'mysql2/promise';

async function checkServiceOrders() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  try {
    console.log('Conectado ao banco de dados');
    
    // Verificar quantas ordens de serviço existem
    const [orders] = await connection.execute('SELECT COUNT(*) as total FROM service_orders');
    console.log(`Total de ordens de serviço no banco: ${orders[0].total}`);
    
    // Se existem ordens, mostrar algumas
    if (orders[0].total > 0) {
      const [allOrders] = await connection.execute(`
        SELECT 
          so.id,
          so.order_number,
          so.description,
          so.status,
          so.priority,
          so.created_at,
          e.name as equipment_name,
          c.name as company_name
        FROM service_orders so
        LEFT JOIN equipment e ON so.equipment_id = e.id
        LEFT JOIN companies c ON so.company_id = c.id
        ORDER BY so.created_at DESC
        LIMIT 5
      `);
      
      console.log('\nÚltimas 5 ordens de serviço:');
      allOrders.forEach(order => {
        console.log(`ID: ${order.id}, Número: ${order.order_number}, Descrição: ${order.description}`);
        console.log(`Status: ${order.status}, Prioridade: ${order.priority}`);
        console.log(`Equipamento: ${order.equipment_name}, Empresa: ${order.company_name}`);
        console.log(`Criado em: ${order.created_at}`);
        console.log('---');
      });
    } else {
      console.log('Nenhuma ordem de serviço encontrada no banco de dados');
    }
    
  } catch (error) {
    console.error('Erro ao verificar ordens de serviço:', error);
  } finally {
    await connection.end();
  }
}

checkServiceOrders();