const mysql = require('mysql2/promise');

// Configuração do banco MariaDB
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  charset: 'utf8mb4'
};

async function testDirectUpdate() {
  let connection;
  try {
    console.log('🔄 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Conectado ao banco de dados');
    
    // Primeiro, vamos ver o agendamento atual
    console.log('📊 Buscando agendamento ID 8...');
    const [currentSchedule] = await connection.execute(
      'SELECT * FROM maintenance_schedules WHERE id = ?',
      [8]
    );
    
    if (currentSchedule.length === 0) {
      console.log('❌ Agendamento ID 8 não encontrado');
      return;
    }
    
    console.log('📋 Agendamento atual:', currentSchedule[0]);
    
    // Agora vamos tentar atualizar o status para 'concluido'
    console.log('🔄 Tentando atualizar status para "concluido"...');
    
    const [updateResult] = await connection.execute(
      'UPDATE maintenance_schedules SET status = ?, updated_at = NOW() WHERE id = ?',
      ['concluido', 8]
    );
    
    console.log('📊 Resultado da atualização:', updateResult);
    
    if (updateResult.affectedRows > 0) {
      console.log('✅ Atualização bem-sucedida!');
      
      // Verificar o resultado
      const [updatedSchedule] = await connection.execute(
        'SELECT * FROM maintenance_schedules WHERE id = ?',
        [8]
      );
      
      console.log('📋 Agendamento atualizado:', updatedSchedule[0]);
    } else {
      console.log('❌ Nenhuma linha foi afetada');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

testDirectUpdate();