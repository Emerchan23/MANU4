// Script para testar todas as APIs Next.js
const BASE_URL = 'http://localhost:3000';

// APIs Next.js identificadas no diretório app/api
const nextjsAPIs = [
  // APIs principais
  { name: 'Categories', endpoint: '/api/categories', method: 'GET' },
  { name: 'Companies', endpoint: '/api/companies', method: 'GET' },
  { name: 'Equipment', endpoint: '/api/equipment', method: 'GET' },
  { name: 'Maintenance Types', endpoint: '/api/maintenance-types', method: 'GET' },
  { name: 'Notifications', endpoint: '/api/notifications', method: 'GET' },
  { name: 'Preventive Maintenance', endpoint: '/api/preventive-maintenance', method: 'GET' },
  { name: 'Preventive Maintenance Plans', endpoint: '/api/preventive-maintenance-plans', method: 'GET' },
  { name: 'Sectors', endpoint: '/api/sectors', method: 'GET' },
  { name: 'Service Orders', endpoint: '/api/service-orders', method: 'GET' },
  { name: 'Service Templates', endpoint: '/api/service-templates', method: 'GET' },
  { name: 'Subsectors', endpoint: '/api/subsectors', method: 'GET' },
  { name: 'System', endpoint: '/api/system', method: 'GET' },
  { name: 'Template Categories', endpoint: '/api/template-categories', method: 'GET' },
  
  // APIs de teste
  { name: 'Test Basic', endpoint: '/api/test-basic', method: 'GET' },
  { name: 'Test DB', endpoint: '/api/test-db', method: 'GET' },
  { name: 'Test Simple', endpoint: '/api/test-simple', method: 'GET' },
];

async function testAPI(api) {
  try {
    console.log(`🔍 Testando ${api.name}...`);
    
    const response = await fetch(`${BASE_URL}${api.endpoint}`, {
      method: api.method,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const status = response.status;
    const statusText = response.statusText;
    
    let responseData;
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }
    } catch (parseError) {
      responseData = 'Erro ao parsear resposta';
    }
    
    const success = status >= 200 && status < 300;
    
    if (success) {
      const dataLength = Array.isArray(responseData) ? responseData.length : 
                        (typeof responseData === 'object' && responseData !== null) ? Object.keys(responseData).length : 
                        typeof responseData === 'string' ? responseData.length : 0;
      console.log(`✅ ${api.name} - Status: ${status} (${dataLength} items/chars)`);
    } else {
      console.log(`❌ ${api.name} - Status: ${status} ${statusText}`);
      if (responseData && typeof responseData === 'object' && responseData.error) {
        console.log(`   Erro: ${responseData.error}`);
      }
    }
    
    return {
      name: api.name,
      endpoint: api.endpoint,
      status,
      statusText,
      success,
      data: responseData
    };
    
  } catch (error) {
    console.log(`❌ ${api.name} - Erro de conexão: ${error.message}`);
    return {
      name: api.name,
      endpoint: api.endpoint,
      status: 'CONNECTION_ERROR',
      success: false,
      error: error.message
    };
  }
}

async function testAllNextJSAPIs() {
  console.log('🚀 Testando todas as APIs Next.js...\n');
  
  const results = [];
  let successCount = 0;
  let errorCount = 0;
  
  for (const api of nextjsAPIs) {
    const result = await testAPI(api);
    results.push(result);
    
    if (result.success) {
      successCount++;
    } else {
      errorCount++;
    }
    
    // Pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n📊 RESUMO DOS TESTES NEXT.JS:');
  console.log(`✅ APIs funcionando: ${successCount}`);
  console.log(`❌ APIs com erro: ${errorCount}`);
  console.log(`📈 Taxa de sucesso: ${((successCount / nextjsAPIs.length) * 100).toFixed(1)}%`);
  
  if (errorCount > 0) {
    console.log('\n🔍 DETALHES DOS ERROS:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`- ${result.name} (${result.endpoint}): ${result.status}`);
      if (result.data && typeof result.data === 'object' && result.data.error) {
        console.log(`  Erro: ${result.data.error}`);
      }
    });
  }
  
  console.log('\n🏁 Teste das APIs Next.js concluído!');
  return { successCount, errorCount, results };
}

// Executar teste
testAllNextJSAPIs().catch(console.error);