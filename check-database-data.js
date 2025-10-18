import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Carregar variáveis de ambiente
dotenv.config();

async function checkDatabaseData() {
  console.log('🔍 Verificando dados na base de dados MariaDB...');
  
  // Configuração do banco
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_maintenance',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',
    timezone: '+00:00'
  };
  
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco MariaDB');
    
    // Verificar dados nas tabelas principais
    console.log('\n📊 Verificando dados nas tabelas principais...');
    
    // 1. Maintenance Schedules
    console.log('\n1. 📅 MAINTENANCE_SCHEDULES:');
    const [schedules] = await connection.execute('SELECT COUNT(*) as total FROM maintenance_schedules');
    console.log(`   Total de agendamentos: ${schedules[0].total}`);
    
    if (schedules[0].total > 0) {
      const [schedulesDetails] = await connection.execute(`
        SELECT status, COUNT(*) as count 
        FROM maintenance_schedules 
        GROUP BY status
      `);
      console.log('   Por status:');
      schedulesDetails.forEach(row => {
        console.log(`     - ${row.status}: ${row.count}`);
      });
      
      // Mostrar alguns registros
      const [sampleSchedules] = await connection.execute(`
        SELECT id, equipment_id, status, scheduled_date, priority 
        FROM maintenance_schedules 
        LIMIT 5
      `);
      console.log('   Exemplos de registros:');
      sampleSchedules.forEach(row => {
        console.log(`     - ID: ${row.id}, Equipment: ${row.equipment_id}, Status: ${row.status}, Data: ${row.scheduled_date}`);
      });
    }
    
    // 2. Equipment
    console.log('\n2. 🔧 EQUIPMENT:');
    const [equipment] = await connection.execute('SELECT COUNT(*) as total FROM equipment');
    console.log(`   Total de equipamentos: ${equipment[0].total}`);
    
    if (equipment[0].total > 0) {
      const [equipmentSample] = await connection.execute(`
        SELECT id, name, status 
        FROM equipment 
        LIMIT 5
      `);
      console.log('   Exemplos de equipamentos:');
      equipmentSample.forEach(row => {
        console.log(`     - ID: ${row.id}, Nome: ${row.name}, Status: ${row.status}`);
      });
    }
    
    // 3. Service Orders
    console.log('\n3. 📋 SERVICE_ORDERS:');
    const [serviceOrders] = await connection.execute('SELECT COUNT(*) as total FROM service_orders');
    console.log(`   Total de ordens de serviço: ${serviceOrders[0].total}`);
    
    if (serviceOrders[0].total > 0) {
      const [serviceOrdersDetails] = await connection.execute(`
        SELECT status, COUNT(*) as count 
        FROM service_orders 
        GROUP BY status
      `);
      console.log('   Por status:');
      serviceOrdersDetails.forEach(row => {
        console.log(`     - ${row.status}: ${row.count}`);
      });
    }
    
    // 4. Companies
    console.log('\n4. 🏢 COMPANIES:');
    const [companies] = await connection.execute('SELECT COUNT(*) as total FROM companies');
    console.log(`   Total de empresas: ${companies[0].total}`);
    
    // 5. Users
    console.log('\n5. 👥 USERS:');
    const [users] = await connection.execute('SELECT COUNT(*) as total FROM users');
    console.log(`   Total de usuários: ${users[0].total}`);
    
    // 6. Maintenance Types
    console.log('\n6. 🔧 MAINTENANCE_TYPES:');
    const [maintenanceTypes] = await connection.execute('SELECT COUNT(*) as total FROM maintenance_types');
    console.log(`   Total de tipos de manutenção: ${maintenanceTypes[0].total}`);
    
    // Verificar se há dados suficientes para o dashboard funcionar
    console.log('\n📈 ANÁLISE PARA O DASHBOARD:');
    
    const totalSchedules = schedules[0].total;
    const totalEquipment = equipment[0].total;
    const totalServiceOrders = serviceOrders[0].total;
    
    if (totalSchedules === 0 && totalEquipment === 0 && totalServiceOrders === 0) {
      console.log('❌ PROBLEMA IDENTIFICADO: Não há dados suficientes no banco!');
      console.log('   O dashboard está zerado porque não existem dados nas tabelas principais.');
      console.log('\n💡 SOLUÇÕES:');
      console.log('   1. Criar dados de teste');
      console.log('   2. Importar dados existentes');
      console.log('   3. Verificar se os dados foram inseridos corretamente');
    } else {
      console.log('✅ Dados encontrados no banco de dados');
      console.log(`   - Agendamentos: ${totalSchedules}`);
      console.log(`   - Equipamentos: ${totalEquipment}`);
      console.log(`   - Ordens de Serviço: ${totalServiceOrders}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada');
    }
  }
}

// Executar verificação
checkDatabaseData().catch(console.error);