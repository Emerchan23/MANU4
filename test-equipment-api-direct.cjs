const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

async function testUpdateEquipment() {
  let connection;
  
  try {
    console.log('🔗 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Conectado com sucesso!');
    
    // Primeiro, vamos verificar se o equipamento ID 17 existe
    console.log('🔍 Verificando se equipamento ID 17 existe...');
    const [existing] = await connection.execute('SELECT id, name FROM equipment WHERE id = ?', [17]);
    
    if (existing.length === 0) {
      console.log('❌ Equipamento ID 17 não encontrado');
      return;
    }
    
    console.log('✅ Equipamento encontrado:', existing[0]);
    
    // Agora vamos tentar fazer o update
    console.log('🔄 Executando UPDATE...');
    
    const queryStr = `
      UPDATE equipment SET
        name = ?, model = ?, serial_number = ?, manufacturer = ?,
        sector_id = ?, category_id = ?, subsector_id = ?,
        acquisition_date = ?, maintenance_frequency_days = ?, observations = ?, 
        patrimonio_number = ?, status = ?, updated_at = NOW()
      WHERE id = ?
    `;

    const updateParams = [
      'Teste API Debug V2',
      'Modelo Debug V2',
      'SN-DEBUG-002',
      'Fabricante Debug V2',
      1,
      1,
      1,
      '2025-01-01',
      5454,
      'Teste de debug da API V2',
      'PAT-DEBUG-002',
      'ativo',
      17
    ];
    
    console.log('📊 Parâmetros do update:', updateParams);
    
    const [result] = await connection.execute(queryStr, updateParams);
    
    console.log('✅ Update executado com sucesso!');
    console.log('📊 Resultado:', result);
    
    // Verificar o equipamento atualizado
    const [updated] = await connection.execute('SELECT * FROM equipment WHERE id = ?', [17]);
    console.log('📊 Equipamento atualizado:', updated[0]);
    
  } catch (error) {
    console.error('❌ Erro:', error);
    console.error('❌ Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

testUpdateEquipment();