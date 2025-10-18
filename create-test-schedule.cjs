const mysql = require('mysql2/promise');

async function createTestSchedule() {
  let connection;
  
  try {
    console.log('🔄 Criando agendamento de teste...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    const [result] = await connection.execute(`
      INSERT INTO maintenance_schedules (
        equipment_id, 
        maintenance_plan_id, 
        scheduled_date, 
        description, 
        priority, 
        status, 
        assigned_user_id, 
        created_at, 
        updated_at
      ) VALUES (1, 1, NOW(), ?, ?, ?, 1, NOW(), NOW())
    `, [
      'Teste de conversão para OS',
      'MEDIA',
      'concluido'
    ]);

    console.log('✅ Novo agendamento criado com ID:', result.insertId);
    
    // Verificar se foi criado corretamente
    const [rows] = await connection.execute(
      'SELECT id, status, description FROM maintenance_schedules WHERE id = ?',
      [result.insertId]
    );
    
    console.log('📊 Agendamento criado:', rows[0]);
    
  } catch (error) {
    console.error('❌ Erro ao criar agendamento:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createTestSchedule();