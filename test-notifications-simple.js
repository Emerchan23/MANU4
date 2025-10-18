require('dotenv').config();
const http = require('http');
const { generateToken } = require('./lib/auth');

// Simple HTTP request function
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: jsonBody, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
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

async function testNotificationsAPI() {
  try {
    console.log('🧪 Testando API de notificações...');
    
    // Generate a test token
    const testUser = { id: 1, username: 'admin', profile: 'admin' };
    const token = generateToken(testUser);
    console.log('✅ Token gerado com sucesso');
    
    // Test notifications endpoint
    console.log('\n📋 Testando GET /api/notifications...');
    const notificationsResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/notifications',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${notificationsResponse.status}`);
    console.log('Response:', notificationsResponse.data);
    
    // Test count endpoint
    console.log('\n🔢 Testando GET /api/notifications/count...');
    const countResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/notifications/count',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${countResponse.status}`);
    console.log('Response:', countResponse.data);
    
    if (notificationsResponse.status === 200 && countResponse.status === 200) {
      console.log('\n✅ Todos os testes passaram! API funcionando corretamente.');
    } else {
      console.log('\n❌ Alguns testes falharam.');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testNotificationsAPI();