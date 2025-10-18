const http = require('http');

console.log('🔬 TESTE API DEBUG');
console.log('='.repeat(30));

function testDebugAPI(method, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/preventive-maintenance-debug',
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    console.log(`📤 ${method} /api/preventive-maintenance-debug`);

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        console.log(`📥 Status: ${res.statusCode}`);
        console.log(`📥 Headers:`, res.headers);
        console.log(`📥 Response Length: ${responseData.length}`);
        console.log(`📥 Response: ${responseData}`);
        
        try {
          const parsed = JSON.parse(responseData);
          console.log('✅ JSON válido');
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          console.log('❌ JSON inválido:', e.message);
          resolve({ status: res.statusCode, data: responseData, error: 'Invalid JSON' });
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Erro de conexão:', error.message);
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

(async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n1️⃣ GET debug:');
    await testDebugAPI('GET');
    
    console.log('\n2️⃣ POST debug:');
    await testDebugAPI('POST', { equipmentId: 1, title: 'Debug Test' });
    
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
})();