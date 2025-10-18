const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkMaintenanceHistoryTable() {
  let connection;
  
  try {
    console.log('🔍 Verificando tabela maintenance_history...');
    
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance',
      charset: 'utf8mb4',
      timezone: '+00:00'
    };

    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');

    // Verificar se a tabela maintenance_history existe
    console.log('\n📋 Verificando se tabela maintenance_history existe...');
    const [tables] = await connection.execute(
      `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = ?`,
      [dbConfig.database, 'maintenance_history']
    );
    
    if (tables[0].count === 0) {
      console.log('❌ Tabela maintenance_history NÃO existe!');
      console.log('🔧 Criando tabela maintenance_history...');
      
      // Criar a tabela maintenance_history
      await connection.execute(`
        CREATE TABLE maintenance_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          service_order_id INT NOT NULL,
          description TEXT NOT NULL,
          execution_date DATE NOT NULL,
          performed_by INT NOT NULL,
          cost DECIMAL(10,2) DEFAULT 0.00,
          observations TEXT,
          created_by INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          FOREIGN KEY (service_order_id) REFERENCES service_orders(id) ON DELETE CASCADE,
          FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE RESTRICT,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('✅ Tabela maintenance_history criada com sucesso!');
    } else {
      console.log('✅ Tabela maintenance_history existe');
    }
    
    // Mostrar estrutura da tabela
    console.log('\n📊 Estrutura da tabela maintenance_history:');
    const [columns] = await connection.execute(`DESCRIBE maintenance_history`);
    columns.forEach(col => {
      console.log(`   ${col.Field} - ${col.Type} - ${col.Null} - ${col.Key}`);
    });
    
    // Contar registros
    const [count] = await connection.execute(`SELECT COUNT(*) as total FROM maintenance_history`);
    console.log(`\n📈 Total de registros na maintenance_history: ${count[0].total}`);
    
    // Verificar ordens de serviço concluídas
    console.log('\n🔍 Verificando ordens de serviço concluídas...');
    const [completedOrders] = await connection.execute(`
      SELECT COUNT(*) as total 
      FROM service_orders 
      WHERE status IN ('concluida', 'finalizada', 'completed', 'CONCLUIDA', 'FINALIZADA', 'COMPLETED')
    `);
    console.log(`📈 Total de ordens concluídas: ${completedOrders[0].total}`);
    
    // Mostrar algumas ordens concluídas se existirem
    if (completedOrders[0].total > 0) {
      console.log('\n📋 Algumas ordens concluídas:');
      const [orders] = await connection.execute(`
        SELECT id, order_number, status, completion_date, description
        FROM service_orders 
        WHERE status IN ('concluida', 'finalizada', 'completed', 'CONCLUIDA', 'FINALIZADA', 'COMPLETED')
        LIMIT 5
      `);
      orders.forEach(order => {
        console.log(`   ID: ${order.id}, Número: ${order.order_number}, Status: ${order.status}, Data: ${order.completion_date}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada');
    }
  }
}

checkMaintenanceHistoryTable();