const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance'
};

async function testEquipmentFormData() {
  let connection;
  
  try {
    console.log('🔍 Testando dados do formulário de equipamentos...');
    
    // Conectar ao banco
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');
    
    // Simular dados do formulário
    const formData = {
      code: 'TEST001',
      name: 'Equipamento de Teste',
      brand: 'Marca Teste',
      model: 'Modelo Teste',
      serial_number: 'SN123456',
      sector_id: 1,
      category_id: 1, // Equipamentos Respiratórios
      subsector_id: 1, // UTI Adulto
      specifications: JSON.stringify({
        patrimonio: 'TEST001',
        categoria: 'Equipamentos Respiratórios',
        voltagem: '220V',
        subsetor: 'UTI Adulto'
      })
    };
    
    console.log('📋 Dados do formulário:', formData);
    
    // Testar inserção
    const insertQuery = `
      INSERT INTO equipment (
        code, name, brand, model, serial_number, 
        sector_id, category_id, subsector_id, specifications
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      formData.code,
      formData.name,
      formData.brand,
      formData.model,
      formData.serial_number,
      formData.sector_id,
      formData.category_id,
      formData.subsector_id,
      formData.specifications
    ];
    
    console.log('🚀 Executando inserção...');
    const [result] = await connection.execute(insertQuery, values);
    
    console.log('✅ Equipamento inserido com sucesso!');
    console.log('📊 Resultado:', result);
    
    // Verificar se foi inserido corretamente
    const [rows] = await connection.execute(
      'SELECT * FROM equipment WHERE code = ?',
      [formData.code]
    );
    
    console.log('🔍 Equipamento recuperado do banco:');
    console.log(rows[0]);
    
    // Limpar dados de teste
    await connection.execute('DELETE FROM equipment WHERE code = ?', [formData.code]);
    console.log('🧹 Dados de teste removidos');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testEquipmentFormData();