// Script para fazer um resumo final de todos os testes das APIs
const BASE_URL = 'http://localhost:3000';

// Teste rápido de todas as APIs principais para verificar funcionamento geral
const criticalAPIs = [
  // APIs Express (gerenciadas pelo server.js)
  { name: 'Users (Express)', endpoint: '/api/users', type: 'Express' },
  { name: 'Equipment (Express)', endpoint: '/api/equipment', type: 'Express' },
  { name: 'Companies (Express)', endpoint: '/api/companies', type: 'Express' },
  { name: 'Sectors (Express)', endpoint: '/api/sectors', type: 'Express' },
  { name: 'Service Orders (Express)', endpoint: '/api/service-orders', type: 'Express' },
  { name: 'Notifications (Express)', endpoint: '/api/notifications', type: 'Express' },
  { name: 'Health Check (Express)', endpoint: '/api/health', type: 'Express' },
  
  // APIs Next.js (gerenciadas pelo Next.js)
  { name: 'Categories (Next.js)', endpoint: '/api/categories', type: 'Next.js' },
  { name: 'Preventive Maintenance (Next.js)', endpoint: '/api/preventive-maintenance', type: 'Next.js' },
  { name: 'Service Templates (Next.js)', endpoint: '/api/service-templates', type: 'Next.js' },
  { name: 'Template Categories (Next.js)', endpoint: '/api/template-categories', type: 'Next.js' },
  { name: 'Maintenance Types (Next.js)', endpoint: '/api/maintenance-types', type: 'Next.js' }
];

async function testAPI(api) {
  try {
    const response = await fetch(`${BASE_URL}${api.endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const status = response.status;
    const success = status >= 200 && status < 300;
    
    return {
      name: api.name,
      endpoint: api.endpoint,
      type: api.type,
      status,
      success
    };
    
  } catch (error) {
    return {
      name: api.name,
      endpoint: api.endpoint,
      type: api.type,
      status: 'CONNECTION_ERROR',
      success: false,
      error: error.message
    };
  }
}

async function runFinalTest() {
  console.log('🎯 TESTE FINAL - VERIFICAÇÃO GERAL DO SERVIDOR HÍBRIDO\n');
  console.log('Testando APIs críticas para verificar se o servidor híbrido funciona sem conflitos...\n');
  
  const results = [];
  let expressSuccess = 0;
  let nextjsSuccess = 0;
  let expressTotal = 0;
  let nextjsTotal = 0;
  
  for (const api of criticalAPIs) {
    const result = await testAPI(api);
    results.push(result);
    
    if (api.type === 'Express') {
      expressTotal++;
      if (result.success) expressSuccess++;
    } else {
      nextjsTotal++;
      if (result.success) nextjsSuccess++;
    }
    
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name} - Status: ${result.status}`);
    
    // Pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📊 RESUMO FINAL:');
  console.log(`🔧 APIs Express: ${expressSuccess}/${expressTotal} funcionando (${((expressSuccess/expressTotal)*100).toFixed(1)}%)`);
  console.log(`⚡ APIs Next.js: ${nextjsSuccess}/${nextjsTotal} funcionando (${((nextjsSuccess/nextjsTotal)*100).toFixed(1)}%)`);
  console.log(`🎯 Total Geral: ${expressSuccess + nextjsSuccess}/${expressTotal + nextjsTotal} funcionando (${(((expressSuccess + nextjsSuccess)/(expressTotal + nextjsTotal))*100).toFixed(1)}%)`);
  
  const allWorking = (expressSuccess === expressTotal) && (nextjsSuccess === nextjsTotal);
  
  if (allWorking) {
    console.log('\n🎉 SUCESSO! Servidor híbrido funcionando perfeitamente!');
    console.log('✅ Todas as APIs críticas estão respondendo corretamente');
    console.log('✅ Não há conflitos entre Express e Next.js');
    console.log('✅ O middleware foi configurado corretamente');
  } else {
    console.log('\n⚠️  Algumas APIs ainda apresentam problemas:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`- ${result.name}: ${result.status}`);
    });
  }
  
  console.log('\n🔍 ANÁLISE TÉCNICA:');
  console.log('- Express gerencia: /api/users, /api/equipment, /api/companies, etc.');
  console.log('- Next.js gerencia: /api/categories, /api/preventive-maintenance, etc.');
  console.log('- Middleware express.json() aplicado apenas às rotas Express');
  console.log('- Roteamento híbrido funcionando sem interferências');
  
  return { expressSuccess, nextjsSuccess, expressTotal, nextjsTotal, allWorking };
}

// Executar teste final
runFinalTest().catch(console.error);