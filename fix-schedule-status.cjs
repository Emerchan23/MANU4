const mysql = require('mysql2/promise');

async function fixScheduleStatus() {
  let connection;
  
  try {
    console.log('🔄 Corrigindo status vazio do agendamento...');
    
    // Configuração da conexão
    const dbConfig = {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance',
      charset: 'utf8mb4'
    };
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados!');
    
    // Verificar agendamentos com status vazio
    console.log('\n🔍 Verificando agendamentos com status vazio...');
    const [emptyStatus] = await connection.execute(`
      SELECT id, status, maintenance_type, priority, scheduled_date 
      FROM maintenance_schedules 
      WHERE status IS NULL OR status = ''
    `);
    
    console.log(`📊 Agendamentos com status vazio: ${emptyStatus.length}`);
    
    if (emptyStatus.length > 0) {
      emptyStatus.forEach(schedule => {
        console.log(`  ID: ${schedule.id} | Status: "${schedule.status}" | Tipo: ${schedule.maintenance_type} | Data: ${schedule.scheduled_date}`);
      });
      
      // Atualizar status vazio para 'AGENDADA'
      console.log('\n🔧 Atualizando status vazio para "AGENDADA"...');
      const [updateResult] = await connection.execute(`
        UPDATE maintenance_schedules 
        SET status = 'AGENDADA' 
        WHERE status IS NULL OR status = ''
      `);
      
      console.log(`✅ ${updateResult.affectedRows} agendamento(s) atualizado(s)!`);
    }
    
    // Verificar agendamentos com prioridade vazia
    console.log('\n🔍 Verificando agendamentos com prioridade vazia...');
    const [emptyPriority] = await connection.execute(`
      SELECT id, priority, maintenance_type, scheduled_date 
      FROM maintenance_schedules 
      WHERE priority IS NULL OR priority = ''
    `);
    
    console.log(`📊 Agendamentos com prioridade vazia: ${emptyPriority.length}`);
    
    if (emptyPriority.length > 0) {
      emptyPriority.forEach(schedule => {
        console.log(`  ID: ${schedule.id} | Prioridade: "${schedule.priority}" | Tipo: ${schedule.maintenance_type} | Data: ${schedule.scheduled_date}`);
      });
      
      // Atualizar prioridade vazia para 'MEDIA'
      console.log('\n🔧 Atualizando prioridade vazia para "MEDIA"...');
      const [updateResult] = await connection.execute(`
        UPDATE maintenance_schedules 
        SET priority = 'MEDIA' 
        WHERE priority IS NULL OR priority = ''
      `);
      
      console.log(`✅ ${updateResult.affectedRows} agendamento(s) atualizado(s)!`);
    }
    
    // Verificar resultado final
    console.log('\n📋 Verificando resultado final...');
    const [finalCheck] = await connection.execute(`
      SELECT id, status, priority, maintenance_type, scheduled_date 
      FROM maintenance_schedules 
      ORDER BY id
    `);
    
    finalCheck.forEach(schedule => {
      console.log(`  ID: ${schedule.id} | Status: ${schedule.status} | Prioridade: ${schedule.priority} | Tipo: ${schedule.maintenance_type} | Data: ${schedule.scheduled_date}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada.');
    }
  }
}

fixScheduleStatus();