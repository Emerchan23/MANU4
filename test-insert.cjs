const mysql = require('mysql2/promise');

async function testInsert() {
  let connection;
  
  try {
    console.log('🔗 Conectando ao banco de dados...');
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance',
      charset: 'utf8mb4',
      timezone: '+00:00'
    });
    
    console.log('✅ Conectado com sucesso!');
    
    // Testar inserção simples
    console.log('\n💾 Testando inserção na tabela preventive_maintenances...');
    
    const insertQuery = `
      INSERT INTO preventive_maintenances (
        equipment_id, scheduled_date, status, priority,
        estimated_duration, estimated_cost, notes,
        created_at, created_by, updated_at, updated_by
      ) VALUES (?, ?, 'SCHEDULED', ?, ?, ?, ?, NOW(), 'system', NOW(), 'system')
    `;
    
    const insertParams = [
      4, // equipment_id
      '2025-02-15', // scheduled_date
      'MEDIUM', // priority
      120, // estimated_duration
      250.00, // estimated_cost
      JSON.stringify({
        title: 'Teste de Manutenção',
        description: 'Teste de inserção',
        frequency: 'MONTHLY',
        type: 'CLEANING',
        notes: 'Teste'
      })
    ];
    
    console.log('📝 Query:', insertQuery);
    console.log('📝 Parâmetros:', insertParams);
    
    const [result] = await connection.execute(insertQuery, insertParams);
    console.log('✅ Inserção realizada com sucesso! ID:', result.insertId);
    
    // Buscar o registro inserido
    const selectQuery = `
      SELECT 
        pm.*,
        e.name as equipment_name,
        e.patrimonio_number as equipment_code,
        s.name as sector_name
      FROM preventive_maintenances pm
      LEFT JOIN equipment e ON pm.equipment_id = e.id
      LEFT JOIN sectors s ON e.sector_id = s.id
      WHERE pm.id = ?
    `;
    
    const [rows] = await connection.execute(selectQuery, [result.insertId]);
    console.log('📊 Registro inserido:', rows[0]);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('❌ Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão encerrada');
    }
  }
}

testInsert();