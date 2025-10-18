const mysql = require('mysql2/promise');

// Configuração do banco de dados
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function debugEquipmentError() {
  let connection;
  
  try {
    console.log('🔧 Debugando erro específico da API de equipamentos...');
    
    // Conectar ao banco
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');

    // Simular exatamente a query da API
    console.log('\n📋 === SIMULANDO QUERY EXATA DA API ===');
    
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
    
    console.log('🔍 Executando query...');
    const [rows] = await connection.execute(queryStr);
    console.log(`✅ Query executada! Equipamentos: ${rows.length}`);
    
    // Verificar se há problemas nos dados
    console.log('\n🔍 === VERIFICANDO DADOS PROBLEMÁTICOS ===');
    
    let problemsFound = false;
    
    rows.forEach((equipment, index) => {
      // Verificar campos que podem causar problemas
      const problems = [];
      
      if (equipment.name === null || equipment.name === undefined) {
        problems.push('name é null/undefined');
      }
      
      if (equipment.sector_id && !equipment.sector_name) {
        problems.push(`sector_id ${equipment.sector_id} sem nome do setor`);
      }
      
      if (equipment.category_id && !equipment.category_name) {
        problems.push(`category_id ${equipment.category_id} sem nome da categoria`);
      }
      
      if (equipment.subsector_id && !equipment.subsector_name) {
        problems.push(`subsector_id ${equipment.subsector_id} sem nome do subsetor`);
      }
      
      // Verificar datas inválidas
      if (equipment.installation_date && isNaN(new Date(equipment.installation_date))) {
        problems.push('installation_date inválida');
      }
      
      if (equipment.last_preventive_maintenance && isNaN(new Date(equipment.last_preventive_maintenance))) {
        problems.push('last_preventive_maintenance inválida');
      }
      
      if (equipment.next_preventive_maintenance && isNaN(new Date(equipment.next_preventive_maintenance))) {
        problems.push('next_preventive_maintenance inválida');
      }
      
      if (equipment.warranty_expiry && isNaN(new Date(equipment.warranty_expiry))) {
        problems.push('warranty_expiry inválida');
      }
      
      if (problems.length > 0) {
        problemsFound = true;
        console.log(`❌ Equipamento ID ${equipment.id} (${equipment.name}):`);
        problems.forEach(problem => console.log(`   - ${problem}`));
      }
    });
    
    if (!problemsFound) {
      console.log('✅ Nenhum problema encontrado nos dados');
    }
    
    // Testar transformação dos dados
    console.log('\n🔄 === TESTANDO TRANSFORMAÇÃO DOS DADOS ===');
    
    try {
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
      
      console.log('✅ Transformação dos dados bem-sucedida');
      console.log(`Dados transformados: ${transformedData.length} equipamentos`);
      
      // Testar JSON.stringify
      try {
        const jsonString = JSON.stringify({
          success: true,
          data: transformedData
        });
        console.log('✅ JSON.stringify bem-sucedido');
        console.log(`Tamanho do JSON: ${jsonString.length} caracteres`);
      } catch (jsonError) {
        console.error('❌ Erro no JSON.stringify:', jsonError.message);
      }
      
    } catch (transformError) {
      console.error('❌ Erro na transformação dos dados:', transformError.message);
      console.error('Stack:', transformError.stack);
    }

    // Verificar estrutura das tabelas
    console.log('\n🏗️ === VERIFICANDO ESTRUTURA DAS TABELAS ===');
    
    const tables = ['equipment', 'setores', 'categories', 'subsectors'];
    
    for (const table of tables) {
      try {
        const [columns] = await connection.execute(`DESCRIBE ${table}`);
        console.log(`\n📋 Tabela ${table}:`);
        columns.forEach(col => {
          console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
        });
      } catch (descError) {
        console.error(`❌ Erro ao descrever tabela ${table}:`, descError.message);
      }
    }

  } catch (error) {
    console.error('❌ Erro durante o debug:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão com o banco fechada');
    }
  }
}

// Executar o debug
debugEquipmentError().catch(console.error);