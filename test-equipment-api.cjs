const mysql = require('mysql2/promise');

// Configuração do banco de dados
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function testEquipmentAPI() {
  let connection;
  
  try {
    console.log('🔧 Testando API de equipamentos após remoção dos setores...');
    
    // Conectar ao banco
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');

    // TESTE 1: Verificar se a query da API funciona
    console.log('\n📋 === TESTE 1: QUERY DA API DE EQUIPAMENTOS ===');
    
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
    
    try {
      const [rows] = await connection.execute(queryStr);
      console.log(`✅ Query executada com sucesso! Equipamentos encontrados: ${rows.length}`);
      
      if (rows.length > 0) {
        console.log('\n📊 Primeiros 3 equipamentos:');
        rows.slice(0, 3).forEach((eq, index) => {
          console.log(`${index + 1}. ID: ${eq.id}, Nome: ${eq.name}, Setor: ${eq.sector_name || 'N/A'}`);
        });
      }
    } catch (queryError) {
      console.error('❌ Erro na query da API:', queryError.message);
      console.error('Stack:', queryError.stack);
    }

    // TESTE 2: Verificar equipamentos órfãos (sem setor)
    console.log('\n🔍 === TESTE 2: EQUIPAMENTOS ÓRFÃOS ===');
    
    const [orphanEquipments] = await connection.execute(`
      SELECT id, name, sector_id 
      FROM equipment 
      WHERE sector_id IS NULL OR sector_id NOT IN (SELECT id FROM setores)
    `);
    
    console.log(`Equipamentos órfãos encontrados: ${orphanEquipments.length}`);
    if (orphanEquipments.length > 0) {
      orphanEquipments.forEach(eq => {
        console.log(`- ID: ${eq.id}, Nome: ${eq.name}, Setor ID: ${eq.sector_id}`);
      });
    }

    // TESTE 3: Verificar setores disponíveis
    console.log('\n🏢 === TESTE 3: SETORES DISPONÍVEIS ===');
    
    const [sectors] = await connection.execute(`
      SELECT id, nome FROM setores ORDER BY nome
    `);
    
    console.log(`Setores disponíveis: ${sectors.length}`);
    sectors.forEach(sector => {
      console.log(`- ID: ${sector.id}, Nome: ${sector.nome}`);
    });

    // TESTE 4: Verificar categorias
    console.log('\n📂 === TESTE 4: CATEGORIAS DISPONÍVEIS ===');
    
    const [categories] = await connection.execute(`
      SELECT id, name FROM categories ORDER BY name
    `);
    
    console.log(`Categorias disponíveis: ${categories.length}`);
    categories.forEach(cat => {
      console.log(`- ID: ${cat.id}, Nome: ${cat.name}`);
    });

    // TESTE 5: Testar a API diretamente
    console.log('\n🌐 === TESTE 5: TESTE DA API HTTP ===');
    
    try {
      const response = await fetch('http://localhost:3000/api/equipment');
      console.log(`Status da resposta: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API respondeu com sucesso!');
        console.log(`Dados recebidos: ${data.success ? 'Sucesso' : 'Erro'}`);
        if (data.data) {
          console.log(`Equipamentos na resposta: ${data.data.length}`);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ API retornou erro:', errorText);
      }
    } catch (fetchError) {
      console.error('❌ Erro ao chamar API:', fetchError.message);
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão com o banco fechada');
    }
  }
}

// Executar o teste
testEquipmentAPI().catch(console.error);