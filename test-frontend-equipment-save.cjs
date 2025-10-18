const http = require('http');

// Simular dados do formulário frontend
const equipmentFormData = {
  patrimonioNumber: 'PAT001',
  name: 'Equipamento Teste Frontend',
  model: 'Modelo XYZ',
  brand: 'Marca ABC',
  serialNumber: 'SN123456',
  categoryId: '1',
  sectorId: '1',
  subsectorId: '1',
  voltage: '220V'
};

// Mapear dados do formulário para formato da API (como faz o equipment-list.tsx)
function mapFormDataToApiData(formData) {
  const specifications = {
    patrimonio: formData.patrimonioNumber,
    categoria: 'Categoria Teste', // Simulando categoria encontrada
    voltagem: formData.voltage,
    subsetor: 'Subsetor Teste' // Simulando subsetor encontrado
  };

  return {
    name: formData.name,
    model: formData.model,
    serial_number: formData.serialNumber,
    brand: formData.brand,
    sector_id: parseInt(formData.sectorId),
    category_id: parseInt(formData.categoryId),
    subsector_id: parseInt(formData.subsectorId),
    specifications: JSON.stringify(specifications)
  };
}

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsedData });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testFrontendEquipmentSave() {
  try {
    console.log('🔍 Testando salvamento de equipamento via frontend...');
    console.log('📝 Dados do formulário:', equipmentFormData);
    
    // Mapear dados como faz o frontend
    const apiData = mapFormDataToApiData(equipmentFormData);
    console.log('🔄 Dados mapeados para API:', apiData);
    
    // Fazer requisição para API
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/equipment',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    console.log('🌐 Enviando requisição para API...');
    const response = await makeRequest(options, apiData);
    
    console.log('📥 Resposta da API:', response.status);
    console.log('📄 Dados da resposta:', response.data);
    
    if (response.status === 201) {
      console.log('✅ Equipamento salvo com sucesso!');
      console.log('🆔 ID do equipamento:', response.data.id);
      console.log('🏷️ Código do equipamento:', response.data.code);
      
      // Verificar se foi salvo no banco
      console.log('\n🔍 Verificando no banco de dados...');
      const verifyOptions = {
        hostname: 'localhost',
        port: 3000,
        path: `/api/equipment/${response.data.id}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const verifyResponse = await makeRequest(verifyOptions);
      console.log('📊 Equipamento no banco:', verifyResponse.data);
      
    } else {
      console.log('❌ Erro ao salvar equipamento');
      console.log('📄 Detalhes do erro:', response.data);
    }
    
  } catch (error) {
    console.error('💥 Erro durante o teste:', error.message);
  }
}

testFrontendEquipmentSave();