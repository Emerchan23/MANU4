const http = require('http');

function testCategoryAPI() {
  // Dados para criar uma categoria elétrica
  const categoryData = {
    name: 'Categoria API Teste ' + Date.now(),
    description: 'Categoria criada via teste da API',
    isElectrical: true
  };

  const postData = JSON.stringify(categoryData);

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

  console.log('🧪 Testando API de categorias...');
  console.log('📤 Enviando dados:', categoryData);

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('📥 Status da resposta:', res.statusCode);
      console.log('📥 Dados recebidos:', data);
      
      if (res.statusCode === 201) {
        try {
          const response = JSON.parse(data);
          console.log('✅ Categoria criada com sucesso!');
          console.log('📋 Dados da categoria:');
          console.log(`  - ID: ${response.id}`);
          console.log(`  - Nome: ${response.name}`);
          console.log(`  - Descrição: ${response.description}`);
          console.log(`  - Elétrica: ${response.is_electrical ? 'SIM' : 'NÃO'}`);
          
          // Agora vamos buscar todas as categorias para verificar
          testGetCategories();
        } catch (error) {
          console.error('❌ Erro ao parsear resposta:', error);
        }
      } else {
        console.error('❌ Erro na API:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Erro na requisição:', error.message);
  });

  req.write(postData);
  req.end();
}

function testGetCategories() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/categories',
    method: 'GET'
  };

  console.log('\n🔍 Buscando todas as categorias...');

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('📥 Status da resposta:', res.statusCode);
      
      if (res.statusCode === 200) {
        try {
          const categories = JSON.parse(data);
          console.log(`✅ ${categories.length} categorias encontradas:`);
          
          categories.forEach((cat, index) => {
            console.log(`  ${index + 1}. ${cat.name} - Elétrica: ${cat.is_electrical ? 'SIM' : 'NÃO'}`);
          });
        } catch (error) {
          console.error('❌ Erro ao parsear resposta:', error);
        }
      } else {
        console.error('❌ Erro na API:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Erro na requisição:', error.message);
  });

  req.end();
}

// Executar teste
testCategoryAPI();