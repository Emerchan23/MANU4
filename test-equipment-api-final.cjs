const mysql = require('mysql2/promise');

async function testEquipmentAPIFinal() {
  console.log('🔍 Teste Final da API de Equipamentos');
  console.log('====================================');

  // Configuração do banco
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_maintenance',
    charset: 'utf8mb4',
    timezone: '+00:00'
  };

  let connection;

  try {
    console.log('\n1. Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado com sucesso');

    console.log('\n2. Executando query corrigida de equipamentos...');
    const sql = `
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

    const [rows] = await connection.execute(sql);
    console.log(`✅ Query executada com sucesso. ${rows.length} equipamentos encontrados`);

    if (rows.length > 0) {
      console.log('\n3. Primeiro equipamento (dados brutos):');
      console.log(JSON.stringify(rows[0], null, 2));

      console.log('\n4. Transformando dados para o formato da API...');
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
        subsector_name: equipment.subsector_name
      }));

      console.log('\n5. Primeiro equipamento transformado:');
      console.log(JSON.stringify(transformedData[0], null, 2));

      console.log('\n6. Resposta final da API:');
      const response = {
        success: true,
        data: transformedData,
        total: transformedData.length
      };

      console.log(`✅ Success: ${response.success}`);
      console.log(`✅ Total: ${response.total}`);
      console.log(`✅ Data length: ${response.data.length}`);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Conexão fechada');
    }
  }
}

// Carregar variáveis de ambiente
require('dotenv').config();

// Executar teste
testEquipmentAPIFinal();