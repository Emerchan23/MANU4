const http = require('http');

console.log('🔬 TESTE API BÁSICA');
console.log('='.repeat(30));

function testBasicAPI(method, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method
    };

    console.log(`📤 ${method} ${path}`);

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`📥 Status: ${res.statusCode}, Length: ${data.length}`);
        console.log(`📥 Response: ${data}`);
        resolve({ status: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.log('❌ Erro:', error.message);
      reject(error);
    });

    req.end();
  });
}

(async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n1️⃣ GET básico:');
    await testBasicAPI('GET', '/api/test-basic');
    
    console.log('\n2️⃣ POST básico:');
    await testBasicAPI('POST', '/api/test-basic');
    
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
})();