const http = require('http');

console.log('🔬 TESTE SUPER SIMPLES - API PREVENTIVE MAINTENANCE');
console.log('='.repeat(60));

// Teste GET primeiro
function testGET() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/preventive-maintenance',
      method: 'GET'
    };

    console.log('📤 Testando GET...');

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('📥 GET Status:', res.statusCode);
        console.log('📥 GET Response length:', data.length);
        if (res.statusCode === 200) {
          console.log('✅ GET funcionando!');
          resolve(true);
        } else {
          console.log('❌ GET falhou');
          reject(new Error('GET failed'));
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ GET Error:', error.message);
      reject(error);
    });

    req.end();
  });
}

// Teste POST mínimo
function testPOST() {
  return new Promise((resolve, reject) => {
    const testData = JSON.stringify({
      equipmentId: 1,
      title: "Teste Mínimo"
    });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/preventive-maintenance',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testData)
      }
    };

    console.log('📤 Testando POST com dados mínimos...');

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('📥 POST Status:', res.statusCode);
        console.log('📥 POST Response length:', data.length);
        console.log('📥 POST Response:', data || '(vazio)');
        
        if (res.statusCode === 201 || res.statusCode === 200) {
          console.log('✅ POST funcionando!');
          resolve(true);
        } else {
          console.log('❌ POST falhou com status:', res.statusCode);
          resolve(false); // Não rejeitamos para continuar o debug
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ POST Error:', error.message);
      reject(error);
    });

    req.write(testData);
    req.end();
  });
}

// Executar testes
(async () => {
  try {
    console.log('🔄 Aguardando servidor...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Teste 1: GET
    await testGET();
    
    // Teste 2: POST
    await testPOST();
    
    console.log('🏁 Testes concluídos');
    
  } catch (error) {
    console.log('❌ Erro nos testes:', error.message);
  }
})();