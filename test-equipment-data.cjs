const mysql = require('mysql2/promise');

async function testEquipmentData() {
  let connection;
  
  try {
    // Conectar ao banco de dados
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('✅ Conectado ao banco de dados');

    // Verificar equipamentos existentes
    const [equipments] = await connection.execute(`
      SELECT 
        e.id,
        e.name,
        e.patrimonio_number,
        e.manufacturer,
        e.model,
        e.serial_number,
        e.installation_date,
        e.maintenance_frequency_days,
        e.observations,
        c.name as category_name,
        s.name as sector_name,
        sub.name as subsector_name
      FROM equipment e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN sectors s ON e.sector_id = s.id
      LEFT JOIN subsectors sub ON e.subsector_id = sub.id
      WHERE e.status = 'ativo'
      LIMIT 5
    `);

    console.log(`\n📊 Total de equipamentos ativos: ${equipments.length}`);
    
    if (equipments.length > 0) {
      console.log('\n🔍 Primeiros equipamentos encontrados:');
      equipments.forEach((eq, index) => {
        console.log(`\n${index + 1}. ID: ${eq.id}`);
        console.log(`   Nome: ${eq.name}`);
        console.log(`   Patrimônio: ${eq.patrimonio_number}`);
        console.log(`   Marca: ${eq.manufacturer}`);
        console.log(`   Modelo: ${eq.model}`);
        console.log(`   Série: ${eq.serial_number}`);
        console.log(`   Categoria: ${eq.category_name}`);
        console.log(`   Setor: ${eq.sector_name}`);
        console.log(`   Subsetor: ${eq.subsector_name}`);
        console.log(`   Data Instalação: ${eq.installation_date}`);
        console.log(`   Frequência Manutenção: ${eq.maintenance_frequency_days} dias`);
        // console.log(`   Specifications: ${eq.specifications}`);
        console.log(`   Observações: ${eq.observations}`);
      });
    } else {
      console.log('\n❌ Nenhum equipamento encontrado no banco de dados');
      console.log('\n💡 Vou criar um equipamento de teste...');
      
      // Buscar categoria, setor e subsetor para criar equipamento de teste
      const [categories] = await connection.execute('SELECT id, name FROM categories LIMIT 1');
      const [sectors] = await connection.execute('SELECT id, name FROM sectors LIMIT 1');
      const [subsectors] = await connection.execute('SELECT id, name FROM subsectors LIMIT 1');
      
      if (categories.length > 0 && sectors.length > 0 && subsectors.length > 0) {
        const testEquipment = {
          name: 'Equipamento Teste',
          patrimonio_number: 'TEST001',
          manufacturer: 'Marca Teste',
          model: 'Modelo Teste',
          serial_number: 'SN123456',
          category_id: categories[0].id,
          sector_id: sectors[0].id,
          subsector_id: subsectors[0].id,
          installation_date: '2024-01-15',
          maintenance_frequency_days: 30,
          observations: 'Equipamento criado para teste de edição',
          specifications: JSON.stringify({ voltage: '220V', power: '1000W' }),
          status: 'active'
        };
        
        const [result] = await connection.execute(`
          INSERT INTO equipment (
            name, patrimonio_number, manufacturer, model, serial_number,
            category_id, sector_id, subsector_id, installation_date,
            maintenance_frequency_days, observations, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          testEquipment.name,
          testEquipment.patrimonio_number,
          testEquipment.manufacturer,
          testEquipment.model,
          testEquipment.serial_number,
          testEquipment.category_id,
          testEquipment.sector_id,
          testEquipment.subsector_id,
          testEquipment.installation_date,
          testEquipment.maintenance_frequency_days,
          testEquipment.observations,
          testEquipment.status
        ]);
        
        console.log(`\n✅ Equipamento de teste criado com ID: ${result.insertId}`);
        console.log('\n🔄 Agora você pode testar a edição deste equipamento na interface.');
      } else {
        console.log('\n❌ Não foi possível criar equipamento de teste - faltam categorias, setores ou subsetores');
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada');
    }
  }
}

testEquipmentData();