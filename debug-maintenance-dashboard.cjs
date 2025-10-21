const mysql = require('mysql2/promise');

async function debugMaintenanceDashboard() {
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
    console.log('\n=== DEBUGANDO API MAINTENANCE-DASHBOARD ===\n');
    
    // 1. Verificar todos os registros de maintenance_schedules
    console.log('📊 1. TODOS OS REGISTROS DE MAINTENANCE_SCHEDULES:');
    const [allSchedules] = await connection.execute(
      'SELECT id, status, scheduled_date, company_id FROM maintenance_schedules ORDER BY id'
    );
    console.log('Total de registros:', allSchedules.length);
    allSchedules.forEach(schedule => {
      console.log(`  ID: ${schedule.id}, Status: "${schedule.status}", Data: ${schedule.scheduled_date}, Company: ${schedule.company_id}`);
    });
    
    console.log('\n🔍 PROBLEMA IDENTIFICADO:');
    const pendingCount = allSchedules.filter(s => s.status === 'AGENDADA').length;
    const today = new Date().toISOString().split('T')[0];
    const overdueCount = allSchedules.filter(s => 
      s.status === 'AGENDADA' && 
      new Date(s.scheduled_date).toISOString().split('T')[0] < today
    ).length;
    const completedCount = allSchedules.filter(s => s.status === 'CONCLUIDA').length;
    
    console.log('📊 DADOS REAIS NO BANCO:');
    console.log('   - Registros encontrados com status "AGENDADA":', pendingCount);
    console.log('   - Registros atrasados manualmente:', overdueCount);
    console.log('   - Registros encontrados com status "CONCLUIDA":', completedCount);
    
    // 2. Testar query de pendentes (exata da API)
    console.log('\n📊 2. TESTANDO QUERY DE PENDENTES (EXATA DA API):');
    const pendingQuery = `
      SELECT COUNT(*) as count 
      FROM maintenance_schedules ms
      WHERE ms.status IN ('AGENDADA', 'SCHEDULED')
    `;
    console.log('Query:', pendingQuery);
    const [pendingResult] = await connection.execute(pendingQuery);
    console.log('Resultado pendentes:', pendingResult[0].count);
    
    // 3. Testar query de atrasados (exata da API)
    console.log('\n📊 3. TESTANDO QUERY DE ATRASADOS (EXATA DA API):');
    const overdueQuery = `
      SELECT COUNT(*) as count 
      FROM maintenance_schedules ms 
      WHERE ms.status IN ('AGENDADA', 'SCHEDULED') 
      AND DATE(ms.scheduled_date) < CURDATE()
    `;
    console.log('Query:', overdueQuery);
    const [overdueResult] = await connection.execute(overdueQuery);
    console.log('Resultado atrasados:', overdueResult[0].count);
    
    // 4. Verificar data atual
    console.log('\n📊 4. VERIFICANDO DATA ATUAL:');
    const [currentDate] = await connection.execute('SELECT CURDATE() as today');
    console.log('Data atual no banco:', currentDate[0].today);
    
    // 5. Testar query de concluídos este mês
    console.log('\n📊 5. TESTANDO QUERY DE CONCLUÍDOS ESTE MÊS:');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    function formatDate(date) {
      return date.toISOString().split('T')[0];
    }
    
    const startOfMonthStr = formatDate(startOfMonth);
    const endOfMonthStr = formatDate(endOfMonth);
    
    console.log('Período:', startOfMonthStr, 'até', endOfMonthStr);
    
    const completedQuery = `
      SELECT COUNT(*) as count 
      FROM maintenance_schedules ms 
      WHERE ms.status IN ('CONCLUIDA', 'COMPLETED') 
      AND DATE(ms.updated_at) >= DATE(?) 
      AND DATE(ms.updated_at) <= DATE(?)
    `;
    console.log('Query:', completedQuery);
    const [completedResult] = await connection.execute(completedQuery, [startOfMonthStr, endOfMonthStr]);
    console.log('Resultado concluídos este mês:', completedResult[0].count);
    
    // 6. Verificar se há registros com status CONCLUIDA ou COMPLETED
    console.log('\n📊 6. VERIFICANDO REGISTROS CONCLUÍDOS:');
    const [completedSchedules] = await connection.execute(
      "SELECT id, status, updated_at FROM maintenance_schedules WHERE status IN ('CONCLUIDA', 'COMPLETED')"
    );
    console.log('Registros concluídos encontrados:', completedSchedules.length);
    completedSchedules.forEach(schedule => {
      console.log(`  ID: ${schedule.id}, Status: "${schedule.status}", Updated: ${schedule.updated_at}`);
    });
    
    console.log('\n📊 DADOS RETORNADOS PELA API:');
    console.log('   - Pendentes (API):', pendingResult[0].count);
    console.log('   - Atrasados (API):', overdueResult[0].count);
    console.log('   - Concluídos este mês (API):', completedResult[0].count);
    
    console.log('\n❌ DISCREPÂNCIA IDENTIFICADA:');
    console.log('   - API retorna 0 mas banco tem dados reais!');
    console.log('   - Problema pode estar nas queries SQL da API');
    
    // Vamos testar as queries exatas da API com mais detalhes
    console.log('\n🔍 TESTANDO QUERIES DETALHADAMENTE:');
    
    // Query pendentes com mais detalhes
    console.log('\n1. QUERY PENDENTES DETALHADA:');
    const [pendingDetailed] = await connection.execute(`
      SELECT ms.*, 
             ms.status as status_value,
             CASE 
               WHEN ms.status IN ('AGENDADA', 'SCHEDULED') THEN 'MATCH'
               ELSE 'NO_MATCH'
             END as status_check
      FROM maintenance_schedules ms
      WHERE ms.status IN ('AGENDADA', 'SCHEDULED')
    `);
    console.log('Registros que fazem match na query pendentes:', pendingDetailed.length);
    
    // Query atrasados com mais detalhes
    console.log('\n2. QUERY ATRASADOS DETALHADA:');
    const [overdueDetailed] = await connection.execute(`
      SELECT ms.*, 
             DATE(ms.scheduled_date) as scheduled_date_only,
             CURDATE() as current_date,
             CASE 
               WHEN DATE(ms.scheduled_date) < CURDATE() THEN 'OVERDUE'
               ELSE 'NOT_OVERDUE'
             END as overdue_check
      FROM maintenance_schedules ms 
      WHERE ms.status IN ('AGENDADA', 'SCHEDULED') 
      AND DATE(ms.scheduled_date) < CURDATE()
    `);
    console.log('Registros que fazem match na query atrasados:', overdueDetailed.length);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugMaintenanceDashboard().catch(console.error);