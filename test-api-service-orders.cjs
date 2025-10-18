const http = require('http');

function testServiceOrdersAPI() {
  console.log('🔍 Testando API /api/service-orders...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/service-orders',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('\n📄 Resposta da API:');
      console.log('==================');
      
      try {
        const jsonData = JSON.parse(data);
        console.log('✅ JSON válido recebido');
        console.log('📊 Dados:', JSON.stringify(jsonData, null, 2));
        
        if (jsonData.data && Array.isArray(jsonData.data)) {
          console.log(`\n📈 Total de ordens de serviço: ${jsonData.data.length}`);
          
          if (jsonData.data.length > 0) {
            console.log('\n📋 Primeira ordem de serviço:');
            console.log(JSON.stringify(jsonData.data[0], null, 2));
          }
        } else if (jsonData.error) {
          console.log(`❌ Erro na API: ${jsonData.error}`);
        }
        
      } catch (error) {
        console.log('❌ Erro ao parsear JSON:', error.message);
        console.log('📄 Resposta bruta:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Erro na requisição:', error.message);
  });

  req.end();
}

testServiceOrdersAPI();