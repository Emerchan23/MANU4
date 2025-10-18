const equipmentAPI = require('./api/equipment');

async function testAPIRoute() {
  console.log('🔍 Testando rota da API de equipamentos...');
  
  try {
    // Criar objetos mock de req e res para compatibilidade
    const mockReq = {
      query: {},
      params: {},
      body: {}
    };

    let responseData = null;
    let statusCode = 200;

    const mockRes = {
      json: (data) => {
        console.log('📊 mockRes.json chamado com:', JSON.stringify(data, null, 2));
        responseData = data;
      },
      status: (code) => {
        console.log('📊 mockRes.status chamado com:', code);
        statusCode = code;
        return {
          json: (data) => {
            console.log('📊 mockRes.status().json chamado com:', JSON.stringify(data, null, 2));
            responseData = data;
          }
        };
      }
    };

    console.log('🔍 Chamando equipmentAPI.getEquipments...');
    await equipmentAPI.getEquipments(mockReq, mockRes);
    
    console.log('✅ Resultado final da API Route:');
    console.log('Status:', statusCode);
    console.log('ResponseData:', responseData ? 'Dados recebidos' : 'Nenhum dado');
    
    if (responseData && responseData.success) {
      console.log(`📊 Equipamentos retornados: ${responseData.data ? responseData.data.length : 0}`);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste da API Route:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAPIRoute();