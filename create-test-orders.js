import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function createTestOrders() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance',
    });
    
    console.log('✅ Conectado ao banco de dados');
    
    // Criar uma ordem de serviço de teste para o equipamento ID 9
    console.log('\n🔧 Criando ordem de serviço de teste para equipamento ID 9...');
    
    try {
      const [result] = await connection.execute(`
        INSERT INTO service_orders (
          order_number, equipment_id, company_id, maintenance_type_id, description,
          priority, status, estimated_cost, actual_cost, scheduled_date, completion_date,
          observations, created_by, assigned_to, type, cost, warranty_days
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        'OS-2024-TEST-001', 9, 1, 1, 'Manutenção preventiva - Limpeza e verificação geral',
        'MEDIA', 'CONCLUIDA', 150.00, 145.50, '2024-01-15', '2024-01-15',
        'Manutenção preventiva realizada conforme cronograma.', 1, 2, 'PREVENTIVA', 145.50, 90
      ]);
      
      console.log('✅ Ordem OS-2024-TEST-001 criada com ID:', result.insertId);
    } catch (error) {
      console.error('❌ Erro ao criar ordem:', error.message);
    }
    
    // Verificar se a ordem foi criada
    console.log('\n🔍 Verificando ordens criadas:');
    const [orders] = await connection.execute('SELECT * FROM service_orders WHERE equipment_id = 9');
    console.log(`Total de ordens para equipamento ID 9: ${orders.length}`);
    
    orders.forEach((order, index) => {
      console.log(`Ordem ${index + 1}:`, {
        id: order.id,
        order_number: order.order_number,
        type: order.type,
        description: order.description,
        status: order.status,
        cost: order.cost
      });
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createTestOrders();