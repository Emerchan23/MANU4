import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkEquipment9() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance',
    });
    
    console.log('✅ Conectado ao banco de dados');
    
    // Verificar se o equipamento ID 9 existe
    console.log('\n🔍 Verificando equipamento ID 9:');
    const [equipment] = await connection.execute('SELECT * FROM equipment WHERE id = 9');
    if (equipment.length > 0) {
      console.log('✅ Equipamento encontrado:', equipment[0]);
    } else {
      console.log('❌ Equipamento ID 9 não encontrado');
    }
    
    // Verificar ordens de serviço para o equipamento ID 9
    console.log('\n🔍 Verificando ordens de serviço para equipamento ID 9:');
    const [orders] = await connection.execute('SELECT * FROM service_orders WHERE equipment_id = 9');
    console.log('Total de ordens encontradas:', orders.length);
    
    if (orders.length > 0) {
      console.log('Ordens de serviço:');
      orders.forEach((order, index) => {
        console.log(`Ordem ${index + 1}:`, {
          id: order.id,
          order_number: order.order_number,
          type: order.type,
          maintenance_type_id: order.maintenance_type_id,
          description: order.description,
          status: order.status,
          created_at: order.created_at
        });
      });
    } else {
      console.log('❌ Nenhuma ordem de serviço encontrada para o equipamento ID 9');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkEquipment9();