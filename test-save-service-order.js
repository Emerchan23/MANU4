require('dotenv').config();
const http = require('http');

// Função para fazer requisições HTTP
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
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

async function testServiceOrderSave() {
  try {
    console.log('🔍 Testando salvamento de ordem de serviço...');

    // 1. Fazer login
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
      console.log('❌ Falha no login:', loginResponse.data);
      return;
    }

    console.log('✅ Login realizado com sucesso');
    const token = loginResponse.data.token;

    // 2. Criar ordem de serviço
    const timestamp = Date.now();
    const serviceOrderData = {
      equipment_id: 1, // Assumindo que existe equipamento com ID 1
      company_id: 1, // Assumindo que existe empresa com ID 1
      priority: 'media',
      description: `Teste de ordem de serviço ${timestamp}`,
      requested_date: '2025-01-25',
      scheduled_date: '2025-01-30',
      warranty_days: 90,
      cost: 150.00,
      observations: 'Teste de salvamento via API'
    };

    console.log('📤 Enviando dados da ordem de serviço:', serviceOrderData);

    const serviceOrderOptions = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/service-orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const serviceOrderResponse = await makeRequest(serviceOrderOptions, serviceOrderData);
    console.log('📥 Resposta da API:', serviceOrderResponse.status, serviceOrderResponse.data);

    if (serviceOrderResponse.status === 201) {
      console.log('✅ Ordem de serviço salva com sucesso!');
    } else {
      console.log('❌ Falha ao salvar ordem de serviço:', serviceOrderResponse.data);
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testServiceOrderSave();