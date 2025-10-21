const { default: fetch } = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testMaintenanceTypesAPI() {
  console.log('🚀 INICIANDO TESTE DAS APIs DE TIPOS DE MANUTENÇÃO\n');

  try {
    // 1. Testar GET /api/maintenance-types (Listagem)
    console.log('📋 1. TESTANDO GET /api/maintenance-types (Listagem)');
    console.log('   URL:', `${BASE_URL}/api/maintenance-types`);
    
    const listResponse = await fetch(`${BASE_URL}/api/maintenance-types`);
    const listData = await listResponse.json();
    
    console.log('   ✅ Status:', listResponse.status);
    console.log('   📊 Total de tipos:', listData.data ? listData.data.length : 'undefined');
    
    if (listData.data && listData.data.length > 0) {
      console.log('   📋 Primeiro tipo:');
      const firstType = listData.data[0];
      console.log(`      ID: ${firstType.id}`);
      console.log(`      Nome: ${firstType.name}`);
      console.log(`      Ativo: ${firstType.isActive}`);
    }
    
    console.log('\n');
    
    // 2. Testar POST /api/maintenance-types (Criação)
    console.log('➕ 2. TESTANDO POST /api/maintenance-types (Criação)');
    console.log('   URL:', `${BASE_URL}/api/maintenance-types`);
    
    const createData = {
      name: 'Tipo Teste API',
      isActive: true
    };
    
    console.log('   Dados:', JSON.stringify(createData, null, 2));
    
    const createResponse = await fetch(`${BASE_URL}/api/maintenance-types`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createData)
    });
    
    const createResponseData = await createResponse.json();
    
    console.log('   ✅ Status:', createResponse.status);
    console.log('   📝 Resposta:', JSON.stringify(createResponseData, null, 2));
    
    let createdTypeId = null;
    if (createResponseData && createResponseData.id) {
      createdTypeId = createResponseData.id;
      console.log('   🆔 ID do tipo criado:', createdTypeId);
    }
    
    console.log('\n');
    
    // 3. Testar PUT /api/maintenance-types/[id] (Atualização)
    if (createdTypeId) {
      console.log('✏️ 3. TESTANDO PUT /api/maintenance-types/[id] (Atualização)');
      console.log('   URL:', `${BASE_URL}/api/maintenance-types/${createdTypeId}`);
      
      const updateData = {
        name: 'Tipo Teste API Atualizado',
        isActive: false
      };
      
      console.log('   📝 Dados de atualização:', JSON.stringify(updateData, null, 2));
      
      const updateResponse = await fetch(`${BASE_URL}/api/maintenance-types/${createdTypeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
      
      const updateResponseData = await updateResponse.json();
      
      console.log('   ✅ Status:', updateResponse.status);
      console.log('   📝 Resposta:', JSON.stringify(updateResponseData, null, 2));
      
      console.log('\n');
      
      // 4. Testar PUT /api/maintenance-types/update/[id] (Rota alternativa)
      console.log('🔄 4. TESTANDO PUT /api/maintenance-types/update/[id] (Rota alternativa)');
      console.log('   URL:', `${BASE_URL}/api/maintenance-types/update/${createdTypeId}`);
      
      const updateData2 = {
        name: 'Tipo Teste API Rota Alternativa',
        isActive: true
      };
      
      console.log('   📝 Dados de atualização:', JSON.stringify(updateData2, null, 2));
      
      const updateResponse2 = await fetch(`${BASE_URL}/api/maintenance-types/update/${createdTypeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData2)
      });
      
      const updateResponseData2 = await updateResponse2.json();
      
      console.log('   ✅ Status:', updateResponse2.status);
      console.log('   📝 Resposta:', JSON.stringify(updateResponseData2, null, 2));
      
      console.log('\n');
    }
    
    console.log('✅ TESTE COMPLETO DAS APIs DE TIPOS DE MANUTENÇÃO FINALIZADO');
    
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error.message);
  }
}

// Executar o teste
testMaintenanceTypesAPI();