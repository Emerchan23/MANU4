const http = require('http');

console.log('Testando API /api/equipment/1...');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/equipment/1',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000 // 10 segundos de timeout
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n--- Resposta da API ---');
    try {
      const jsonData = JSON.parse(data);
      console.log('Dados recebidos:', JSON.stringify(jsonData, null, 2));
      
      if (jsonData.success && jsonData.data && jsonData.data.id) {
        console.log('\n✅ API funcionando! Equipamento encontrado com ID:', jsonData.data.id);
      } else {
        console.log('\n❌ API retornou dados mas sem ID do equipamento');
      }
    } catch (error) {
      console.log('Resposta não é JSON válido:', data);
      console.log('Erro ao fazer parse:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error.message);
  if (error.code === 'ECONNREFUSED') {
    console.error('Servidor não está rodando na porta 3000');
  }
});

req.on('timeout', () => {
  console.error('❌ Timeout na requisição (10s)');
  req.destroy();
});

req.end();