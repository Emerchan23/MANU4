const http = require('http');

// Configuração base
const BASE_URL = 'localhost';
const PORT = 3000;

// Cores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

// Função para fazer requisições HTTP
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : null;
          resolve({
            statusCode: res.statusCode,
            data: parsedData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Função para log colorido
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Função para testar um endpoint
async function testEndpoint(method, path, data = null, expectedStatus = 200) {
  try {
    const response = await makeRequest(method, path, data);
    const success = response.statusCode === expectedStatus;
    
    log(`  ${method} ${path}: ${success ? '✓' : '✗'} (${response.statusCode})`, success ? 'green' : 'red');
    
    if (!success) {
      log(`    Esperado: ${expectedStatus}, Recebido: ${response.statusCode}`, 'yellow');
      if (response.data && typeof response.data === 'string') {
        log(`    Erro: ${response.data.substring(0, 100)}...`, 'yellow');
      }
    }
    
    return { success, response };
  } catch (error) {
    log(`  ${method} ${path}: ✗ (Erro de conexão)`, 'red');
    log(`    ${error.message}`, 'yellow');
    return { success: false, error };
  }
}

// Dados de teste
const testData = {
  category: {
    name: 'Categoria Teste API',
    description: 'Categoria criada para teste da API'
  },
  company: {
    name: 'Empresa Teste API',
    cnpj: '12345678000199',
    address: 'Rua Teste, 123',
    phone: '11999999999',
    email: 'teste@empresa.com'
  },
  sector: {
    name: 'Setor Teste API',
    description: 'Setor criado para teste da API',
    company_id: 1
  },
  subsector: {
    name: 'Subsetor Teste API',
    description: 'Subsetor criado para teste da API',
    sector_id: 1
  },
  equipment: {
    name: 'Equipamento Teste API',
    model: 'Modelo Teste',
    serial_number: 'SN123456789',
    category_id: 1,
    company_id: 1,
    sector_id: 1,
    subsector_id: 1,
    status: 'ativo',
    criticality: 'alta',
    location: 'Sala Teste'
  },
  serviceOrder: {
    equipment_id: 1,
    description: 'Ordem de serviço teste API',
    priority: 'alta',
    type: 'preventiva'
  },
  user: {
    name: 'Usuário Teste API',
    email: 'teste@usuario.com',
    password: '123456',
    role: 'technician'
  }
};

// Função principal de teste
async function runAllTests() {
  log('\n=== TESTE COMPLETO DE TODAS AS APIs ===\n', 'bold');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    apis: {}
  };

  // Teste da API de Categorias
  log('🔍 Testando API /api/categories', 'blue');
  results.apis.categories = {
    name: 'Categories API',
    tests: []
  };
  
  let test = await testEndpoint('GET', '/api/categories');
  results.apis.categories.tests.push({ method: 'GET', path: '/api/categories', success: test.success });
  results.total++; if (test.success) results.passed++; else results.failed++;
  
  test = await testEndpoint('POST', '/api/categories', testData.category, 201);
  results.apis.categories.tests.push({ method: 'POST', path: '/api/categories', success: test.success });
  results.total++; if (test.success) results.passed++; else results.failed++;
  
  // Teste da API de Empresas
  log('\n🏢 Testando API /api/companies', 'blue');
  results.apis.companies = {
    name: 'Companies API',
    tests: []
  };
  
  test = await testEndpoint('GET', '/api/companies');
  results.apis.companies.tests.push({ method: 'GET', path: '/api/companies', success: test.success });
  results.total++; if (test.success) results.passed++; else results.failed++;
  
  test = await testEndpoint('POST', '/api/companies', testData.company, 201);
  results.apis.companies.tests.push({ method: 'POST', path: '/api/companies', success: test.success });
  results.total++; if (test.success) results.passed++; else results.failed++;
  
  // Teste da API de Setores
  log('\n🏭 Testando API /api/sectors', 'blue');
  results.apis.sectors = {
    name: 'Sectors API',
    tests: []
  };
  
  test = await testEndpoint('GET', '/api/sectors');
  results.apis.sectors.tests.push({ method: 'GET', path: '/api/sectors', success: test.success });
  results.total++; if (test.success) results.passed++; else results.failed++;
  
  test = await testEndpoint('POST', '/api/sectors', testData.sector, 201);
  results.apis.sectors.tests.push({ method: 'POST', path: '/api/sectors', success: test.success });
  results.total++; if (test.success) results.passed++; else results.failed++;
  
  // Teste da API de Subsetores
  log('\n📂 Testando API /api/subsectors', 'blue');
  results.apis.subsectors = {
    name: 'Subsectors API',
    tests: []
  };
  
  test = await testEndpoint('GET', '/api/subsectors');
  results.apis.subsectors.tests.push({ method: 'GET', path: '/api/subsectors', success: test.success });
  results.total++; if (test.success) results.passed++; else results.failed++;
  
  test = await testEndpoint('POST', '/api/subsectors', testData.subsector, 201);
  results.apis.subsectors.tests.push({ method: 'POST', path: '/api/subsectors', success: test.success });
  results.total++; if (test.success) results.passed++; else results.failed++;
  
  // Teste da API de Equipamentos
  log('\n⚙️ Testando API /api/equipment', 'blue');
  results.apis.equipment = {
    name: 'Equipment API',
    tests: []
  };
  
  test = await testEndpoint('GET', '/api/equipment');
  results.apis.equipment.tests.push({ method: 'GET', path: '/api/equipment', success: test.success });
  results.total++; if (test.success) results.passed++; else results.failed++;
  
  test = await testEndpoint('POST', '/api/equipment', testData.equipment, 201);
  results.apis.equipment.tests.push({ method: 'POST', path: '/api/equipment', success: test.success });
  results.total++; if (test.success) results.passed++; else results.failed++;
  
  // Teste da API de Ordens de Serviço
  log('\n📋 Testando API /api/service-orders', 'blue');
  results.apis.serviceOrders = {
    name: 'Service Orders API',
    tests: []
  };
  
  test = await testEndpoint('GET', '/api/service-orders');
  results.apis.serviceOrders.tests.push({ method: 'GET', path: '/api/service-orders', success: test.success });
  results.total++; if (test.success) results.passed++; else results.failed++;
  
  test = await testEndpoint('POST', '/api/service-orders', testData.serviceOrder, 201);
  results.apis.serviceOrders.tests.push({ method: 'POST', path: '/api/service-orders', success: test.success });
  results.total++; if (test.success) results.passed++; else results.failed++;
  
  // Teste da API de Usuários
  log('\n👤 Testando API /api/users', 'blue');
  results.apis.users = {
    name: 'Users API',
    tests: []
  };
  
  test = await testEndpoint('GET', '/api/users');
  results.apis.users.tests.push({ method: 'GET', path: '/api/users', success: test.success });
  results.total++; if (test.success) results.passed++; else results.failed++;
  
  test = await testEndpoint('POST', '/api/users', testData.user, 201);
  results.apis.users.tests.push({ method: 'POST', path: '/api/users', success: test.success });
  results.total++; if (test.success) results.passed++; else results.failed++;
  
  // Teste da API de Dashboard
  log('\n📊 Testando API /api/dashboard', 'blue');
  results.apis.dashboard = {
    name: 'Dashboard API',
    tests: []
  };
  
  test = await testEndpoint('GET', '/api/dashboard/stats');
  results.apis.dashboard.tests.push({ method: 'GET', path: '/api/dashboard/stats', success: test.success });
  results.total++; if (test.success) results.passed++; else results.failed++;
  
  // Teste da API de Notificações
  log('\n🔔 Testando API /api/notifications', 'blue');
  results.apis.notifications = {
    name: 'Notifications API',
    tests: []
  };
  
  test = await testEndpoint('GET', '/api/notifications');
  results.apis.notifications.tests.push({ method: 'GET', path: '/api/notifications', success: test.success });
  results.total++; if (test.success) results.passed++; else results.failed++;
  
  // Teste da API de Relatórios
  log('\n📈 Testando API /api/reports', 'blue');
  results.apis.reports = {
    name: 'Reports API',
    tests: []
  };
  
  test = await testEndpoint('GET', '/api/reports/stats');
  results.apis.reports.tests.push({ method: 'GET', path: '/api/reports/stats', success: test.success });
  results.total++; if (test.success) results.passed++; else results.failed++;
  
  // Teste de Health Check
  log('\n❤️ Testando Health Check', 'blue');
  results.apis.health = {
    name: 'Health Check',
    tests: []
  };
  
  test = await testEndpoint('GET', '/api/health');
  results.apis.health.tests.push({ method: 'GET', path: '/api/health', success: test.success });
  results.total++; if (test.success) results.passed++; else results.failed++;
  
  // Relatório final
  log('\n=== RELATÓRIO FINAL ===', 'bold');
  log(`Total de testes: ${results.total}`, 'blue');
  log(`Testes aprovados: ${results.passed}`, 'green');
  log(`Testes falharam: ${results.failed}`, 'red');
  log(`Taxa de sucesso: ${((results.passed / results.total) * 100).toFixed(1)}%`, 'yellow');
  
  // Detalhes por API
  log('\n=== DETALHES POR API ===', 'bold');
  Object.entries(results.apis).forEach(([key, api]) => {
    const apiPassed = api.tests.filter(t => t.success).length;
    const apiTotal = api.tests.length;
    const apiRate = ((apiPassed / apiTotal) * 100).toFixed(1);
    
    log(`\n${api.name}:`, 'blue');
    log(`  Testes: ${apiPassed}/${apiTotal} (${apiRate}%)`, apiPassed === apiTotal ? 'green' : 'yellow');
    
    api.tests.forEach(test => {
      log(`  ${test.method} ${test.path}: ${test.success ? '✓' : '✗'}`, test.success ? 'green' : 'red');
    });
  });
  
  log('\n=== TESTE CONCLUÍDO ===\n', 'bold');
}

// Executar os testes
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, testEndpoint };