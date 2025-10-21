const mysql = require('mysql2/promise');

async function debugDashboard() {
  let connection;
  
  try {
    console.log('🔄 Conectando ao banco de dados...');
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado com sucesso!');
    console.log('\n=== VERIFICANDO DADOS NO BANCO ===\n');
    
    // Verificar equipamentos ativos
    const [equipmentRows] = await connection.execute(
      'SELECT COUNT(*) as count FROM equipment WHERE status = ?', 
      ['ativo']
    );
    console.log('📊 Equipamentos ativos:', equipmentRows[0].count);
    
    // Verificar manutenções pendentes
    const [maintenanceRows] = await connection.execute(
      'SELECT COUNT(*) as count FROM maintenance_schedules WHERE status IN (?, ?)', 
      ['AGENDADO', 'PENDENTE']
    );
    console.log('🔧 Manutenções pendentes:', maintenanceRows[0].count);
    
    // Verificar ordens de serviço abertas
    const [serviceOrderRows] = await connection.execute(
      'SELECT COUNT(*) as count FROM service_orders WHERE status IN (?, ?)', 
      ['ABERTA', 'EM_ANDAMENTO']
    );
    console.log('📋 Ordens de serviço abertas:', serviceOrderRows[0].count);
    
    // Verificar alertas críticos
    const [alertsRows] = await connection.execute(
      'SELECT COUNT(*) as count FROM alerts WHERE status = ? AND prioridade = ?', 
      ['ATIVO', 'ALTA']
    );
    console.log('🚨 Alertas críticos:', alertsRows[0].count);
    
    console.log('\n=== TESTANDO LÓGICA DA API ===\n');
    
    // Simular a mesma lógica da API
    const activeEquipment = equipmentRows[0].count;
    const pendingMaintenances = maintenanceRows[0].count;
    const openServiceOrders = serviceOrderRows[0].count;
    const criticalAlerts = alertsRows[0].count;
    
    const apiResponse = {
      metrics: {
        activeEquipment: activeEquipment || 0,
        equipmentsActive: activeEquipment || 0,
        pendingMaintenances: pendingMaintenances || 0,
        openServiceOrders: openServiceOrders || 0,
        criticalAlerts: criticalAlerts || 0,
      }
    };
    
    console.log('📤 Resposta simulada da API:');
    console.log(JSON.stringify(apiResponse, null, 2));
    
    // Verificar se há dados nas tabelas
    console.log('\n=== VERIFICANDO ESTRUTURA DAS TABELAS ===\n');
    
    const [equipmentSample] = await connection.execute('SELECT id, name, status FROM equipment LIMIT 3');
    console.log('📋 Amostra de equipamentos:', equipmentSample);
    
    const [maintenanceSample] = await connection.execute('SELECT id, status, scheduled_date FROM maintenance_schedules LIMIT 3');
    console.log('📋 Amostra de manutenções:', maintenanceSample);
    
    const [serviceOrderSample] = await connection.execute('SELECT id, status, order_number FROM service_orders LIMIT 3');
    console.log('📋 Amostra de ordens:', serviceOrderSample);
    
    const [alertsSample] = await connection.execute('SELECT id, status, prioridade, descricao FROM alerts LIMIT 3');
    console.log('📋 Amostra de alertas:', alertsSample);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugDashboard();