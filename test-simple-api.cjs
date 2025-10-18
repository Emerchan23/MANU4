const http = require('http');

console.log('🧪 TESTANDO API SIMPLIFICADA');
console.log('='.repeat(50));

function testSimpleAPI(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    console.log(`📤 ${method} ${path}`);
    if (data) console.log('📋 Dados:', JSON.stringify(data, null, 2));

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log(`📥 Status: ${res.statusCode}`);
        console.log(`📥 Response length: ${responseData.length}`);
        
        if (responseData.length > 0) {
          try {
            const parsed = JSON.parse(responseData);
            console.log('✅ JSON válido:', JSON.stringify(parsed, null, 2));
            resolve({ status: res.statusCode, data: parsed });
          } catch (parseError) {
            console.log('❌ JSON inválido:', responseData);
            resolve({ status: res.statusCode, data: responseData });
          }
        } else {
          console.log('❌ Resposta vazia');
          resolve({ status: res.statusCode, data: null });
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Erro de conexão:', error.message);
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Executar testes
(async () => {
  try {
    console.log('🔄 Aguardando servidor...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Teste 1: GET da API simplificada
    console.log('\n1️⃣ Testando GET da API simplificada:');
    await testSimpleAPI('GET', '/api/preventive-maintenance-simple');
    
    // Teste 2: POST da API simplificada
    console.log('\n2️⃣ Testando POST da API simplificada:');
    await testSimpleAPI('POST', '/api/preventive-maintenance-simple', {
      test: 'dados de teste'
    });
    
    // Teste 3: POST da API original para comparação
    console.log('\n3️⃣ Testando POST da API original:');
    await testSimpleAPI('POST', '/api/preventive-maintenance', {
      equipmentId: 1,
      title: 'Teste'
    });
    
    console.log('\n🏁 Testes concluídos');
    
  } catch (error) {
    console.log('❌ Erro nos testes:', error.message);
  }
})();