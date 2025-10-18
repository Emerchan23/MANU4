import http from 'http';
import { URL } from 'url';

// Dados de teste para ordem de serviço
const testServiceOrder = {
  equipment_id: 21, // ID do equipamento criado no teste anterior
  company_id: 1, // Assumindo que existe uma empresa com ID 1
  description: 'Ordem de serviço de teste para verificar salvamento',
  priority: 'high',
  requested_date: '2025-01-26',
  scheduled_date: '2025-01-27',
  warranty_days: 90,
  cost: 150.00,
  observations: 'Teste de salvamento de ordem de serviço',
  assigned_to: 1 // ID do técnico
};

console.log('🧪 Testando salvamento de ordem de serviço...');
console.log('Dados da ordem de serviço:', JSON.stringify(testServiceOrder, null, 2));

// Função para fazer requisição POST
function makePostRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/service-orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({ statusCode: res.statusCode, data: parsedData });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

// Executar teste
try {
  console.log('\n📡 Enviando requisição para /api/service-orders...');
  const response = await makePostRequest(testServiceOrder);
  
  console.log('\n📊 Resposta do servidor:');
  console.log('Status Code:', response.statusCode);
  console.log('Dados:', JSON.stringify(response.data, null, 2));
  
  if (response.statusCode === 200 || response.statusCode === 201) {
    console.log('\n✅ Ordem de serviço salva com sucesso!');
  } else {
    console.log('\n❌ Erro ao salvar ordem de serviço!');
    console.log('Status:', response.statusCode);
  }
  
} catch (error) {
  console.error('\n💥 Erro na requisição:', error.message);
  console.error('Stack:', error.stack);
}

console.log('\n🏁 Teste finalizado.');