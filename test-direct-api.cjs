// Teste direto da API de equipamentos para identificar o erro
const mysql = require('mysql2/promise');

// Configuração do banco de dados
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

// Simular a função query do database.js
async function query(sql, params = []) {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.execute(sql, params);
    return rows;
  } finally {
    await connection.end();
  }
}

// Simular exatamente a função getEquipments
const getEquipments = async (req, res) => {
  console.log('🔍 [EQUIPMENT API] Iniciando busca de equipamentos...');
  try {
    const queryStr = `
      SELECT 
        e.id,
        e.name,
        e.patrimonio,
        e.model,
        e.serial_number,
        e.manufacturer,
        e.sector_id,
        e.category_id,
        e.subsector_id,
        e.installation_date,
        e.last_preventive_maintenance,
        e.next_preventive_maintenance,
        e.maintenance_frequency_days,
        e.warranty_expiry,
        e.status,
        e.observations,
        e.created_at,
        e.updated_at,
        e.patrimonio_number,
        e.voltage,
        e.power,
        e.maintenance_frequency,
        s.nome as sector_name,
        c.name as category_name,
        sub.name as subsector_name
      FROM equipment e
      LEFT JOIN setores s ON e.sector_id = s.id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN subsectors sub ON e.subsector_id = sub.id
      ORDER BY e.created_at DESC
    `;
    
    console.log('🔍 [EQUIPMENT API] Executando query...');
    const rows = await query(queryStr, []);
    console.log('📊 [EQUIPMENT API] Equipamentos encontrados:', rows.length);
    
    // Transformar os dados para o formato esperado pelo frontend
    console.log('🔄 [EQUIPMENT API] Transformando dados...');
    const transformedData = rows.map(equipment => ({
      id: equipment.id,
      name: equipment.name,
      patrimonio: equipment.patrimonio,
      model: equipment.model,
      serial_number: equipment.serial_number,
      manufacturer: equipment.manufacturer,
      sector_id: equipment.sector_id,
      category_id: equipment.category_id,
      subsector_id: equipment.subsector_id,
      installation_date: equipment.installation_date,
      last_preventive_maintenance: equipment.last_preventive_maintenance,
      next_preventive_maintenance: equipment.next_preventive_maintenance,
      maintenance_frequency_days: equipment.maintenance_frequency_days,
      warranty_expiry: equipment.warranty_expiry,
      status: equipment.status,
      observations: equipment.observations,
      created_at: equipment.created_at,
      updated_at: equipment.updated_at,
      patrimonio_number: equipment.patrimonio_number,
      voltage: equipment.voltage,
      power: equipment.power,
      maintenance_frequency: equipment.maintenance_frequency,
      // Campos relacionados (joins)
      sector_name: equipment.sector_name,
      category_name: equipment.category_name,
      subsector_name: equipment.subsector_name,
    }));
    
    console.log('✅ [EQUIPMENT API] Dados transformados com sucesso');
    
    const response = {
      success: true,
      data: transformedData
    };
    
    console.log('📤 [EQUIPMENT API] Preparando resposta JSON...');
    const jsonResponse = JSON.stringify(response);
    console.log('✅ [EQUIPMENT API] JSON criado com sucesso');
    console.log(`📊 [EQUIPMENT API] Tamanho da resposta: ${jsonResponse.length} caracteres`);
    
    res.json(response);
    console.log('✅ [EQUIPMENT API] Resposta enviada com sucesso');
    
  } catch (error) {
    console.error('❌ [EQUIPMENT API] Erro ao buscar equipamentos:', error);
    console.error('❌ [EQUIPMENT API] Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Simular objetos req e res
const mockReq = {};
const mockRes = {
  json: (data) => {
    console.log('📤 Mock Response JSON:', JSON.stringify(data, null, 2));
  },
  status: (code) => {
    console.log('📤 Mock Response Status:', code);
    return {
      json: (data) => {
        console.log('📤 Mock Response Status + JSON:', code, JSON.stringify(data, null, 2));
      }
    };
  }
};

// Executar o teste
console.log('🚀 Iniciando teste direto da API de equipamentos...');
getEquipments(mockReq, mockRes).catch(console.error);