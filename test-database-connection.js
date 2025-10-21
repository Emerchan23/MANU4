const mysql = require('mysql2/promise');
require('dotenv').config();

async function testDatabaseConnection() {
  console.log('🔍 Testando conexão com o banco de dados...');
  
  // Configuração do banco de dados
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_maintenance',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',
    timezone: '+00:00'
  };

  console.log('📊 Configuração do banco:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    port: dbConfig.port,
    hasPassword: !!dbConfig.password
  });

  let connection;
  
  try {
    // Tentar conectar
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados com sucesso!');
    
    // Verificar se o banco existe
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('\n📋 Bancos de dados disponíveis:');
    databases.forEach(db => {
      const dbName = Object.values(db)[0];
      console.log(`  - ${dbName}`);
    });
    
    // Verificar se o banco hospital_maintenance existe
    const hospitalDbExists = databases.some(db => Object.values(db)[0] === 'hospital_maintenance');
    
    if (!hospitalDbExists) {
      console.log('\n❌ Banco "hospital_maintenance" não encontrado!');
      return;
    }
    
    console.log('\n✅ Banco "hospital_maintenance" encontrado!');
    
    // Verificar tabelas
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('\n📋 Tabelas no banco hospital_maintenance:');
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`  ${index + 1}. ${tableName}`);
    });
    
    // Verificar tabela maintenance_schedules especificamente
    const maintenanceSchedulesExists = tables.some(table => Object.values(table)[0] === 'maintenance_schedules');
    
    if (!maintenanceSchedulesExists) {
      console.log('\n❌ Tabela "maintenance_schedules" não encontrada!');
      return;
    }
    
    console.log('\n✅ Tabela "maintenance_schedules" encontrada!');
    
    // Verificar dados na tabela maintenance_schedules
    const [schedules] = await connection.execute('SELECT COUNT(*) as total FROM maintenance_schedules');
    console.log(`\n📊 Total de agendamentos: ${schedules[0].total}`);
    
    if (schedules[0].total > 0) {
      // Mostrar alguns agendamentos
      const [sampleSchedules] = await connection.execute(`
        SELECT id, status, equipment_id, scheduled_date, priority 
        FROM maintenance_schedules 
        ORDER BY id DESC 
        LIMIT 5
      `);
      
      console.log('\n📋 Últimos 5 agendamentos:');
      sampleSchedules.forEach(schedule => {
        console.log(`  ID: ${schedule.id}, Status: ${schedule.status}, Equipment: ${schedule.equipment_id}, Data: ${schedule.scheduled_date}, Prioridade: ${schedule.priority}`);
      });
      
      // Verificar agendamento específico ID 27
      const [schedule27] = await connection.execute('SELECT * FROM maintenance_schedules WHERE id = 27');
      
      if (schedule27.length > 0) {
        console.log('\n📋 Agendamento ID 27:');
        console.log(JSON.stringify(schedule27[0], null, 2));
      } else {
        console.log('\n❌ Agendamento ID 27 não encontrado!');
      }
    }
    
    // Verificar tabela service_orders
    const serviceOrdersExists = tables.some(table => Object.values(table)[0] === 'service_orders');
    
    if (serviceOrdersExists) {
      console.log('\n✅ Tabela "service_orders" encontrada!');
      
      const [serviceOrders] = await connection.execute('SELECT COUNT(*) as total FROM service_orders');
      console.log(`📊 Total de ordens de serviço: ${serviceOrders[0].total}`);
    } else {
      console.log('\n❌ Tabela "service_orders" não encontrada!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', error.message);
    console.error('❌ Código do erro:', error.code);
    console.error('❌ Stack trace:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada.');
    }
  }
}

testDatabaseConnection();