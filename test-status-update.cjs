const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  charset: 'utf8mb4'
};

async function testStatusUpdate() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    console.log('🧪 Testando atualização de status para "concluido"...');
    
    // Primeiro, vamos ver se existe algum registro para testar
    const [schedules] = await connection.execute('SELECT id, status FROM maintenance_schedules LIMIT 1');
    
    if (schedules.length === 0) {
      console.log('❌ Nenhum agendamento encontrado para testar');
      return;
    }
    
    const testId = schedules[0].id;
    const originalStatus = schedules[0].status;
    
    console.log('📊 Agendamento de teste:', { id: testId, status_original: originalStatus });
    
    // Tentar atualizar para 'concluido'
    const [updateResult] = await connection.execute(
      'UPDATE maintenance_schedules SET status = ? WHERE id = ?',
      ['concluido', testId]
    );
    
    console.log('📊 Resultado da atualização:', updateResult);
    
    // Verificar se foi atualizado
    const [updatedSchedule] = await connection.execute(
      'SELECT id, status FROM maintenance_schedules WHERE id = ?',
      [testId]
    );
    
    console.log('📊 Status após atualização:', updatedSchedule[0]);
    
    // Restaurar status original
    await connection.execute(
      'UPDATE maintenance_schedules SET status = ? WHERE id = ?',
      [originalStatus, testId]
    );
    
    console.log('✅ Status restaurado para:', originalStatus);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testStatusUpdate();