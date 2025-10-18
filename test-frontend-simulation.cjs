// Usando fetch nativo do Node.js 18+

async function testFrontendSimulation() {
  console.log('🧪 Testando simulação do frontend com categoria elétrica...');
  
  // Dados simulando o que o frontend enviaria
  const equipmentData = {
    name: 'Equipamento Teste Frontend',
    description: 'Teste de equipamento elétrico',
    category_id: 1, // Categoria elétrica (Equipamentos Respiratórios)
    sector_id: 1,
    subsector_id: 2, // Campo que deve ser salvo
    voltage: '220V', // Campo que deve ser salvo
    manufacturer: 'Teste Marca',
    model: 'Modelo Teste',
    serial_number: 'SN123456',
    installation_date: '2024-01-15',
    maintenance_frequency_days: 90,
    status: 'ativo',
    observations: 'Teste de observações'
  };
  
  try {
    console.log('📤 Enviando dados para API PUT /api/equipment/1:');
    console.log(JSON.stringify(equipmentData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/equipment/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(equipmentData)
    });
    
    console.log('📥 Status da resposta:', response.status);
    console.log('📥 Headers da resposta:', Object.fromEntries(response.headers));
    
    const responseData = await response.json();
    console.log('📊 Dados da resposta:');
    console.log(JSON.stringify(responseData, null, 2));
    
    if (response.ok && responseData.success) {
      console.log('✅ Equipamento atualizado com sucesso!');
      
      // Agora vamos verificar se os dados foram salvos corretamente
      console.log('\n🔍 Verificando se os dados foram salvos no banco...');
      
      const getResponse = await fetch('http://localhost:3000/api/equipment/1');
      const getData = await getResponse.json();
      
      if (getData.success) {
        const equipment = getData.data;
        console.log('📊 Dados salvos no banco:');
        console.log(`- ID: ${equipment.id}`);
        console.log(`- Nome: ${equipment.name}`);
        console.log(`- Categoria ID: ${equipment.category_id}`);
        console.log(`- Setor ID: ${equipment.sector_id}`);
        console.log(`- Subsetor ID: ${equipment.subsector_id} ${equipment.subsector_id ? '✅' : '❌'}`);
        console.log(`- Voltagem: ${equipment.voltage} ${equipment.voltage ? '✅' : '❌'}`);
        console.log(`- Marca: ${equipment.manufacturer}`);
        console.log(`- Modelo: ${equipment.model}`);
        
        // Verificar se os campos críticos foram salvos
        if (equipment.subsector_id && equipment.voltage) {
          console.log('\n🎉 SUCESSO: Ambos os campos (subsector_id e voltage) foram salvos corretamente!');
        } else {
          console.log('\n❌ PROBLEMA: Um ou ambos os campos não foram salvos:');
          console.log(`   - subsector_id: ${equipment.subsector_id || 'NULL/VAZIO'}`);
          console.log(`   - voltage: ${equipment.voltage || 'NULL/VAZIO'}`);
        }
      } else {
        console.log('❌ Erro ao buscar equipamento atualizado:', getData.message);
      }
    } else {
      console.log('❌ Erro na atualização:', responseData.message || 'Erro desconhecido');
    }
    
  } catch (error) {
    console.error('💥 Erro durante o teste:', error.message);
  }
}

testFrontendSimulation();