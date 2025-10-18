import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function testInsert() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('Testando inserção na tabela preventive_maintenances...');
    
    const insertQuery = `
      INSERT INTO preventive_maintenances (
        equipment_name, equipment_code, sector_id, sector_name,
        plan_name, description, frequency, maintenance_type, priority, status,
        scheduled_date, estimated_duration, estimated_cost, notes,
        created_at, created_by, updated_at, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'system', NOW(), 'system')
    `;
    
    const insertParams = [
      'Centrífuga Laboratorial',
      'EQ-4',
      8,
      'Enfermagem',
      'Manutenção Preventiva - Centrífuga',
      'Limpeza e calibração da centrífuga laboratorial',
      'MONTHLY',
      'CLEANING',
      'MEDIUM',
      'SCHEDULED',
      '2025-02-15',
      120,
      250.00,
      'Verificar rotação e balanceamento'
    ];
    
    const [result] = await connection.execute(insertQuery, insertParams);
    console.log('✅ Inserção bem-sucedida! ID:', result.insertId);
    
  } catch (error) {
    console.error('❌ Erro na inserção:', error.message);
  } finally {
    await connection.end();
  }
}

testInsert().catch(console.error);