const fetch = require('node-fetch');

async function testAPISectorsSubsectors() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('🧪 Testando APIs de Setores e Subsetores...');
    
    // Teste 1: Criar um novo setor
    console.log('\n🏢 Teste 1: Criando novo setor via API...');
    
    const sectorData = {
      name: `Setor API Teste ${Date.now()}`,
      description: 'Setor criado via API para teste',
      responsible: 'Responsável API Teste'
    };
    
    const createSectorResponse = await fetch(`${baseUrl}/api/sectors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sectorData)
    });
    
    if (!createSectorResponse.ok) {
      const errorText = await createSectorResponse.text();
      console.error('❌ Erro ao criar setor:', createSectorResponse.status, errorText);
      return;
    }
    
    const createdSector = await createSectorResponse.json();
    console.log('✅ Setor criado via API:', createdSector);
    
    // Teste 2: Listar setores
    console.log('\n📋 Teste 2: Listando setores via API...');
    
    const listSectorsResponse = await fetch(`${baseUrl}/api/sectors`);
    
    if (!listSectorsResponse.ok) {
      const errorText = await listSectorsResponse.text();
      console.error('❌ Erro ao listar setores:', listSectorsResponse.status, errorText);
      return;
    }
    
    const sectors = await listSectorsResponse.json();
    console.log('✅ Setores encontrados:', sectors.length);
    console.log('📊 Último setor:', sectors[sectors.length - 1]);
    
    // Teste 3: Criar um novo subsetor
    console.log('\n🏗️ Teste 3: Criando novo subsetor via API...');
    
    const subsectorData = {
      name: `Subsetor API Teste ${Date.now()}`,
      description: 'Subsetor criado via API para teste',
      sector_id: createdSector.id
    };
    
    const createSubsectorResponse = await fetch(`${baseUrl}/api/subsectors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(subsectorData)
    });
    
    if (!createSubsectorResponse.ok) {
      const errorText = await createSubsectorResponse.text();
      console.error('❌ Erro ao criar subsetor:', createSubsectorResponse.status, errorText);
      return;
    }
    
    const createdSubsector = await createSubsectorResponse.json();
    console.log('✅ Subsetor criado via API:', createdSubsector);
    
    // Teste 4: Listar subsetores
    console.log('\n📋 Teste 4: Listando subsetores via API...');
    
    const listSubsectorsResponse = await fetch(`${baseUrl}/api/subsectors`);
    
    if (!listSubsectorsResponse.ok) {
      const errorText = await listSubsectorsResponse.text();
      console.error('❌ Erro ao listar subsetores:', listSubsectorsResponse.status, errorText);
      return;
    }
    
    const subsectors = await listSubsectorsResponse.json();
    console.log('✅ Subsetores encontrados:', subsectors.length);
    console.log('📊 Último subsetor:', subsectors[subsectors.length - 1]);
    
    // Teste 5: Listar subsetores por setor
    console.log('\n🔗 Teste 5: Listando subsetores por setor via API...');
    
    const listSubsectorsBySectorResponse = await fetch(`${baseUrl}/api/subsectors?sectorId=${createdSector.id}`);
    
    if (!listSubsectorsBySectorResponse.ok) {
      const errorText = await listSubsectorsBySectorResponse.text();
      console.error('❌ Erro ao listar subsetores por setor:', listSubsectorsBySectorResponse.status, errorText);
      return;
    }
    
    const subsectorsBySector = await listSubsectorsBySectorResponse.json();
    console.log('✅ Subsetores do setor encontrados:', subsectorsBySector.length);
    console.log('📊 Subsetores do setor:', subsectorsBySector);
    
    // Teste 6: Atualizar setor
    console.log('\n🔄 Teste 6: Atualizando setor via API...');
    
    const updatedSectorData = {
      id: createdSector.id,
      name: `${sectorData.name} - Atualizado`,
      description: `${sectorData.description} - Atualizado`,
      responsible: sectorData.responsible
    };
    
    const updateSectorResponse = await fetch(`${baseUrl}/api/sectors`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedSectorData)
    });
    
    if (!updateSectorResponse.ok) {
      const errorText = await updateSectorResponse.text();
      console.error('❌ Erro ao atualizar setor:', updateSectorResponse.status, errorText);
      return;
    }
    
    const updatedSector = await updateSectorResponse.json();
    console.log('✅ Setor atualizado via API:', updatedSector);
    
    // Teste 7: Atualizar subsetor
    console.log('\n🔄 Teste 7: Atualizando subsetor via API...');
    
    const updatedSubsectorData = {
      id: createdSubsector.id,
      name: `${subsectorData.name} - Atualizado`,
      description: `${subsectorData.description} - Atualizado`,
      sector_id: createdSector.id
    };
    
    const updateSubsectorResponse = await fetch(`${baseUrl}/api/subsectors`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedSubsectorData)
    });
    
    if (!updateSubsectorResponse.ok) {
      const errorText = await updateSubsectorResponse.text();
      console.error('❌ Erro ao atualizar subsetor:', updateSubsectorResponse.status, errorText);
      return;
    }
    
    const updatedSubsector = await updateSubsectorResponse.json();
    console.log('✅ Subsetor atualizado via API:', updatedSubsector);
    
    console.log('\n🎉 Todos os testes das APIs foram executados com sucesso!');
    console.log('✅ Setores e subsetores estão sendo salvos corretamente no banco de dados!');
    
  } catch (error) {
    console.error('❌ Erro durante os testes das APIs:', error);
  }
}

testAPISectorsSubsectors();