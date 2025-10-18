// Script para testar APIs específicas e capturar erros detalhados

const BASE_URL = 'http://localhost:3000';

// APIs que apresentaram erro no teste anterior
const failedAPIs = [
  '/api/equipment/stats',
  '/api/sectors', 
  '/api/service-orders',
  '/api/service-orders/stats',
  '/api/notifications',
  '/api/users',
  '/api/companies',
  '/api/reports/maintenance-chart',
  '/api/sessions',
  '/api/user-settings',
  '/api/user-preferences'
];

async function testAPIWithDetails(url) {
  try {
    console.log(`\n🔍 Testando: ${url}`);
    
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const status = response.status;
    const statusText = response.statusText;
    
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    console.log(`Status: ${status} ${statusText}`);
    
    if (status >= 400) {
      console.log(`❌ Erro detectado:`);
      console.log(`Response:`, responseData);
    } else {
      console.log(`✅ API funcionando corretamente`);
    }
    
    return {
      url,
      status,
      statusText,
      success: status >= 200 && status < 300,
      data: responseData
    };
    
  } catch (error) {
    console.log(`❌ Erro de conexão: ${error.message}`);
    return {
      url,
      status: 'CONNECTION_ERROR',
      success: false,
      error: error.message
    };
  }
}

async function testErrorAPIs() {
  console.log('🚀 Testando APIs com erro para obter detalhes...\n');
  
  const results = [];
  
  for (const url of failedAPIs) {
    const result = await testAPIWithDetails(url);
    results.push(result);
    
    // Pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n📊 RESUMO DETALHADO:');
  const workingAPIs = results.filter(r => r.success);
  const errorAPIs = results.filter(r => !r.success);
  
  console.log(`✅ APIs funcionando: ${workingAPIs.length}`);
  console.log(`❌ APIs com erro: ${errorAPIs.length}`);
  
  if (errorAPIs.length > 0) {
    console.log('\n🔍 ANÁLISE DOS ERROS:');
    errorAPIs.forEach(api => {
      console.log(`\n- ${api.url}:`);
      console.log(`  Status: ${api.status}`);
      if (api.data && typeof api.data === 'object') {
        console.log(`  Erro: ${api.data.error || api.data.message || JSON.stringify(api.data)}`);
      } else if (api.error) {
        console.log(`  Erro: ${api.error}`);
      }
    });
  }
  
  console.log('\n🏁 Análise detalhada concluída!');
  return results;
}

// Executar teste detalhado
testErrorAPIs().catch(console.error);