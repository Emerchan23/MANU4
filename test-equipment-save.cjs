const mysql = require('mysql2/promise');

async function testEquipmentSave() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  try {
    console.log('=== TESTE DE SALVAMENTO DE EQUIPAMENTO ===\n');

    // Primeiro, vamos buscar um equipamento existente para testar a atualização
    const [equipments] = await connection.execute('SELECT * FROM equipment LIMIT 1');
    
    if (equipments.length === 0) {
      console.log('❌ Nenhum equipamento encontrado para teste');
      return;
    }

    const equipment = equipments[0];
    console.log('📋 Equipamento encontrado para teste:');
    console.log(`   ID: ${equipment.id}`);
    console.log(`   Nome: ${equipment.name}`);
    console.log(`   Subsetor atual: ${equipment.subsector_id}`);
    console.log(`   Voltagem atual: ${equipment.voltage}`);
    console.log('');

    // Vamos buscar setores e subsetores disponíveis
    const [sectors] = await connection.execute('SELECT * FROM sectors LIMIT 3');
    const [subsectors] = await connection.execute('SELECT * FROM subsectors LIMIT 3');

    console.log('🏢 Setores disponíveis:');
    sectors.forEach(sector => {
      console.log(`   ${sector.id}: ${sector.name}`);
    });
    console.log('');

    console.log('🏭 Subsetores disponíveis:');
    subsectors.forEach(subsector => {
      console.log(`   ${subsector.id}: ${subsector.name} (setor: ${subsector.sector_id})`);
    });
    console.log('');

    // Teste 1: Atualizar com subsector_id e voltage
    const testSubsectorId = subsectors.length > 0 ? subsectors[0].id : 1;
    const testVoltage = '220V';

    console.log('🔧 TESTE 1: Atualizando equipamento com subsector_id e voltage');
    console.log(`   Novo subsector_id: ${testSubsectorId}`);
    console.log(`   Nova voltagem: ${testVoltage}`);

    const updateQuery = `
      UPDATE equipment 
      SET subsector_id = ?, voltage = ?, updated_at = NOW()
      WHERE id = ?
    `;

    const [updateResult] = await connection.execute(updateQuery, [testSubsectorId, testVoltage, equipment.id]);
    
    console.log(`   Linhas afetadas: ${updateResult.affectedRows}`);

    // Verificar se foi salvo corretamente
    const [updatedEquipment] = await connection.execute('SELECT * FROM equipment WHERE id = ?', [equipment.id]);
    
    if (updatedEquipment.length > 0) {
      const updated = updatedEquipment[0];
      console.log('\n✅ RESULTADO DA ATUALIZAÇÃO:');
      console.log(`   Subsector_id salvo: ${updated.subsector_id} ${updated.subsector_id == testSubsectorId ? '✅' : '❌'}`);
      console.log(`   Voltage salva: ${updated.voltage} ${updated.voltage === testVoltage ? '✅' : '❌'}`);
      console.log(`   Data de atualização: ${updated.updated_at}`);
    }

    // Teste 2: Simular o que a API faz
    console.log('\n🔧 TESTE 2: Simulando atualização via API');
    
    const apiTestData = {
      name: equipment.name,
      model: equipment.model || 'Modelo Teste',
      serial_number: equipment.serial_number || 'SN123456',
      manufacturer: equipment.manufacturer || 'Fabricante Teste',
      sector_id: sectors.length > 0 ? sectors[0].id : 1,
      category_id: equipment.category_id || 1,
      subsector_id: subsectors.length > 1 ? subsectors[1].id : testSubsectorId,
      voltage: '380V',
      installation_date: equipment.installation_date || '2024-01-01',
      maintenance_frequency_days: equipment.maintenance_frequency_days || 30,
      status: equipment.status || 'ativo',
      observations: equipment.observations || 'Teste de atualização',
      patrimonio_number: equipment.patrimonio_number || 'PAT123'
    };

    console.log('   Dados para atualização:');
    console.log(`   - subsector_id: ${apiTestData.subsector_id}`);
    console.log(`   - voltage: ${apiTestData.voltage}`);

    const apiUpdateQuery = `
      UPDATE equipment SET 
        name = ?, model = ?, serial_number = ?, manufacturer = ?,
        sector_id = ?, category_id = ?, subsector_id = ?, voltage = ?,
        installation_date = ?, maintenance_frequency_days = ?, status = ?,
        observations = ?, patrimonio_number = ?, updated_at = NOW()
      WHERE id = ?
    `;

    const [apiUpdateResult] = await connection.execute(apiUpdateQuery, [
      apiTestData.name, apiTestData.model, apiTestData.serial_number, apiTestData.manufacturer,
      apiTestData.sector_id, apiTestData.category_id, apiTestData.subsector_id, apiTestData.voltage,
      apiTestData.installation_date, apiTestData.maintenance_frequency_days, apiTestData.status,
      apiTestData.observations, apiTestData.patrimonio_number, equipment.id
    ]);

    console.log(`   Linhas afetadas: ${apiUpdateResult.affectedRows}`);

    // Verificar resultado final
    const [finalEquipment] = await connection.execute('SELECT * FROM equipment WHERE id = ?', [equipment.id]);
    
    if (finalEquipment.length > 0) {
      const final = finalEquipment[0];
      console.log('\n✅ RESULTADO FINAL:');
      console.log(`   Subsector_id: ${final.subsector_id} ${final.subsector_id == apiTestData.subsector_id ? '✅' : '❌'}`);
      console.log(`   Voltage: ${final.voltage} ${final.voltage === apiTestData.voltage ? '✅' : '❌'}`);
      console.log(`   Última atualização: ${final.updated_at}`);
    }

    console.log('\n🎉 TESTE CONCLUÍDO!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await connection.end();
  }
}

testEquipmentSave().catch(console.error);