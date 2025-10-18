const http = require('http');

console.log('🐛 DEBUG API DE MANUTENÇÃO PREVENTIVA');
console.log('='.repeat(60));

// Dados de teste simplificados
const testData = {
  equipmentId: 1,
  title: "Debug Test"
};

function debugAPI() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testData);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/preventive-maintenance',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('📤 Enviando requisição POST simplificada...');
    console.log('📋 Dados:', JSON.stringify(testData, null, 2));

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📥 Status:', res.statusCode);
        console.log('📥 Headers:', JSON.stringify(res.headers, null, 2));
        console.log('📥 Resposta bruta (primeiros 500 chars):', data.substring(0, 500));
        console.log('📥 Tamanho da resposta:', data.length, 'bytes');
        
        if (data.trim() === '') {
          console.log('❌ RESPOSTA VAZIA - Possível erro interno no servidor');
        } else {
          try {
            const response = JSON.parse(data);
            console.log('✅ JSON válido:', JSON.stringify(response, null, 2));
          } catch (parseError) {
            console.log('❌ JSON inválido:', parseError.message);
            console.log('❌ Conteúdo completo da resposta:');
            console.log(data);
          }
        }
        
        resolve(data);
      });
    });

    req.on('error', (error) => {
      console.log('❌ ERRO DE CONEXÃO:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Executar debug
(async () => {
  try {
    console.log('🔄 Aguardando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await debugAPI();
    
  } catch (error) {
    console.log('❌ DEBUG FALHOU:', error.message);
  }
})();