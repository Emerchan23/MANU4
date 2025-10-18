const http = require('http');

// Dados de teste
const testData = {
  name: "Equipamento Teste",
  model: "Modelo Teste",
  serial_number: "SN123456",
  manufacturer: "Fabricante Teste",
  sector_id: 1,
  category_id: 1,
  subsector_id: 2,
  installation_date: "2024-01-01",
  maintenance_frequency_days: 30,
  observations: "Teste de atualização",
  patrimonio_number: "5454",
  voltage: "380V",
  status: "ativo"
};

console.log('🔧 Testando API PUT /api/equipment/1');
console.log('📤 Dados enviados:', JSON.stringify(testData, null, 2));

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/equipment/1',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log('📊 Status da resposta:', res.statusCode);
  console.log('📋 Headers da resposta:', res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📥 Resposta recebida:');
    try {
      const jsonResponse = JSON.parse(data);
      console.log(JSON.stringify(jsonResponse, null, 2));
    } catch (e) {
      console.log('❌ Resposta não é JSON válido:');
      console.log(data);
    }
    
    if (res.statusCode === 200) {
      console.log('✅ Atualização bem-sucedida!');
    } else {
      console.log('❌ Erro na atualização. Status:', res.statusCode);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erro na requisição:', e.message);
});

// Enviar os dados
req.write(postData);
req.end();

console.log('⏳ Aguardando resposta do servidor...');