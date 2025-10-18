import http from 'http';
import { URL } from 'url';

// Dados de teste para categoria
const testCategory = {
  name: 'Categoria Teste ' + Date.now(),
  isElectrical: true,
  description: 'Categoria para teste de salvamento'
};

console.log('🧪 Testando salvamento de categoria...');
console.log('Dados da categoria:', JSON.stringify(testCategory, null, 2));

// Função para fazer requisição POST
function makePostRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/categories',
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
  console.log('\n📡 Enviando requisição para /api/categories...');
  const response = await makePostRequest(testCategory);
  
  console.log('\n📊 Resposta do servidor:');
  console.log('Status Code:', response.statusCode);
  console.log('Dados:', JSON.stringify(response.data, null, 2));
  
  if (response.statusCode === 200 || response.statusCode === 201) {
    console.log('\n✅ Categoria salva com sucesso!');
  } else {
    console.log('\n❌ Erro ao salvar categoria!');
    console.log('Status:', response.statusCode);
  }
  
} catch (error) {
  console.error('\n💥 Erro na requisição:', error.message);
  console.error('Stack:', error.stack);
}

console.log('\n🏁 Teste finalizado.');