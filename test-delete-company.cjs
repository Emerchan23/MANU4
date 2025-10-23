const https = require('https');
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            ok: res.statusCode >= 200 && res.statusCode < 300,
            json: () => Promise.resolve(jsonData),
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            ok: res.statusCode >= 200 && res.statusCode < 300,
            text: () => Promise.resolve(data),
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testDeleteCompany() {
  console.log('🧪 Testando DELETE de empresa...');
  
  try {
    // Primeiro, vamos listar as empresas para ver qual podemos tentar deletar
    console.log('📋 Listando empresas disponíveis...');
    const listResponse = await makeRequest('http://localhost:3000/api/companies');
    const listData = await listResponse.json();
    
    console.log('Status da listagem:', listResponse.status);
    console.log('Dados das empresas:', JSON.stringify(listData, null, 2));
    
    if (listData.success && listData.companies && listData.companies.length > 0) {
      // Vamos tentar deletar uma empresa que não tenha dependências
      // Procurar por uma empresa que não seja a primeira (que tem ordens de serviço)
      let companyToDelete = null;
      for (let i = 1; i < listData.companies.length; i++) {
        companyToDelete = listData.companies[i];
        break;
      }
      
      if (!companyToDelete) {
        companyToDelete = listData.companies[0];
      }
      
      console.log(`\n🗑️ Tentando deletar empresa ID: ${companyToDelete.id} - ${companyToDelete.name}`);
      
      const deleteResponse = await makeRequest(`http://localhost:3000/api/companies/${companyToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Status da exclusão:', deleteResponse.status);
      console.log('Headers da resposta:', deleteResponse.headers);
      
      const deleteData = await deleteResponse.json();
      console.log('Resposta da exclusão:', JSON.stringify(deleteData, null, 2));
      
      if (!deleteResponse.ok) {
        console.log('❌ Erro na exclusão!');
        console.log('Status:', deleteResponse.status);
        console.log('Mensagem:', deleteData.message || deleteData.error);
      } else {
        console.log('✅ Exclusão bem-sucedida!');
      }
    } else {
      console.log('❌ Nenhuma empresa encontrada para testar');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    console.error('Stack trace:', error.stack);
  }
}

testDeleteCompany();