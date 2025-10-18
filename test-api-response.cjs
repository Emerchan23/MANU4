const equipmentAPI = require('./api/equipment');

// Teste da função getEquipments
async function testGetEquipments() {
  console.log('🧪 Testando getEquipments...');
  
  let responseData = null;
  let statusCode = 200;
  
  const mockReq = {
    query: {},
    params: {},
    body: {}
  };
  
  const mockRes = {
    json: (data) => {
      console.log('📊 mockRes.json chamado com:', data);
      responseData = data;
    },
    status: (code) => {
      console.log('📊 mockRes.status chamado com:', code);
      statusCode = code;
      return {
        json: (data) => {
          console.log('📊 mockRes.status().json chamado com:', data);
          responseData = data;
        }
      };
    }
  };
  
  try {
    await equipmentAPI.getEquipments(mockReq, mockRes);
    console.log('✅ Resultado final:');
    console.log('Status:', statusCode);
    console.log('Data:', responseData);
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testGetEquipments();