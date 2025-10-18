const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testEquipmentSave() {
  try {
    console.log('🔍 Testando salvamento de equipamento...');
    
    // Primeiro, fazer login para obter token
    const loginOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const loginData = {
      nick: 'admin',
      password: 'admin123'
    };
    
    const loginResponse = await makeRequest(loginOptions, loginData);
    
    console.log('📥 Resposta do login:', loginResponse.status, loginResponse.data);
    
    if (!loginResponse.data.token) {
      throw new Error('Falha no login: Token não encontrado na resposta');
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado com sucesso');
    
    // Testar criação de equipamento
    const equipmentData = {
      name: 'Teste Equipamento ' + Date.now(),
      brand: 'Marca Teste',
      model: 'Modelo Teste',
      serial_number: 'SN' + Date.now(),
      acquisition_date: '2024-01-15',
      warranty_expiry: '2025-01-15',
      sector_id: 1,
      status: 'active',
      criticality: 'medium',
      location: 'Sala Teste',
      specifications: JSON.stringify({"description": "Especificações de teste", "features": ["Feature 1", "Feature 2"]}),
      maintenance_interval_days: 90
    };
    
    console.log('📤 Enviando dados do equipamento:', equipmentData);
    
    const equipmentOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/equipment',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const equipmentResponse = await makeRequest(equipmentOptions, equipmentData);
    
    console.log('📥 Resposta da API:', equipmentResponse.status, equipmentResponse.data);
    
    if (equipmentResponse.data.success) {
      console.log('✅ Equipamento salvo com sucesso! ID:', equipmentResponse.data.equipment?.id);
    } else {
      console.log('❌ Falha ao salvar equipamento:', equipmentResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testEquipmentSave();