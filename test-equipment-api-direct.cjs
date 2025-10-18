// Teste direto da função getEquipments para identificar o erro

async function testEquipmentAPIDirect() {
  console.log('🔍 Teste Direto da Função getEquipments');
  console.log('======================================');

  try {
    console.log('\n1. Carregando variáveis de ambiente...');
    require('dotenv').config();
    console.log('✅ Variáveis carregadas');

    console.log('\n2. Importando módulo equipment.js...');
    const { getEquipments } = await import('./api/equipment.js');
    console.log('✅ Módulo importado com sucesso');
    console.log('✅ Função getEquipments:', typeof getEquipments);

    console.log('\n3. Criando objetos mock req e res...');
    
    // Mock request object
    const mockReq = {
      query: {},
      params: {},
      body: {}
    };

    let responseData = null;
    let statusCode = 200;
    let errorOccurred = false;

    // Mock response object
    const mockRes = {
      json: (data) => {
        console.log('📊 mockRes.json chamado com:', JSON.stringify(data, null, 2));
        responseData = data;
      },
      status: (code) => {
        console.log('📊 mockRes.status chamado com:', code);
        statusCode = code;
        if (code >= 400) {
          errorOccurred = true;
        }
        return {
          json: (data) => {
            console.log('📊 mockRes.status().json chamado com:', JSON.stringify(data, null, 2));
            responseData = data;
          }
        };
      }
    };

    console.log('\n4. Executando getEquipments...');
    await getEquipments(mockReq, mockRes);

    console.log('\n5. Resultado final:');
    console.log('Status Code:', statusCode);
    console.log('Error Occurred:', errorOccurred);
    console.log('Response Data:', responseData);

    if (responseData && responseData.success) {
      console.log('✅ API funcionou corretamente!');
      console.log('Total de equipamentos:', responseData.data ? responseData.data.length : 0);
    } else {
      console.log('❌ API retornou erro:', responseData);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack:', error.stack);
  }
}

testEquipmentAPIDirect();