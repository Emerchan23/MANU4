const http = require('http');

console.log('🔍 Testando API de equipamentos...');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/equipment/1',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`✅ Status Code: ${res.statusCode}`);
  console.log(`📊 Headers:`, res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📄 Response Body:');
    try {
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro ao testar API:', error.message);
});

req.setTimeout(5000, () => {
  console.error('❌ Timeout na requisição');
  req.destroy();
});

req.end();