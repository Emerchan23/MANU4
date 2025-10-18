const http = require('http');

console.log('🧪 TESTANDO API DE MANUTENÇÃO PREVENTIVA CORRIGIDA');
console.log('='.repeat(60));

// Dados de teste para criar uma nova manutenção preventiva
const testData = {
  equipmentId: 1,
  title: "Teste de Manutenção Preventiva - API Corrigida",
  description: "Teste para verificar se a API está funcionando após correções",
  frequency: "MONTHLY",
  maintenanceType: "INSPECTION",
  priority: "MEDIUM",
  scheduledDate: "2024-02-15T10:00:00.000Z",
  estimatedDuration: 120,
  estimatedCost: 150.00,
  notes: "Teste automatizado da API"
};

function testAPI() {
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

    console.log('📤 Enviando requisição POST para /api/preventive-maintenance...');
    console.log('📋 Dados enviados:', JSON.stringify(testData, null, 2));

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📥 Status da resposta:', res.statusCode);
        console.log('📥 Headers da resposta:', res.headers);
        
        try {
          const response = JSON.parse(data);
          console.log('📥 Resposta da API:', JSON.stringify(response, null, 2));
          
          if (res.statusCode === 201) {
            console.log('✅ SUCESSO: API funcionando corretamente!');
            console.log('✅ Manutenção preventiva criada com ID:', response.data?.id);
            resolve(response);
          } else {
            console.log('❌ ERRO: Status não esperado:', res.statusCode);
            console.log('❌ Resposta:', response);
            reject(new Error(`Status ${res.statusCode}: ${response.message || 'Erro desconhecido'}`));
          }
        } catch (parseError) {
          console.log('❌ ERRO: Resposta não é JSON válido');
          console.log('❌ Resposta bruta:', data);
          reject(parseError);
        }
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

// Função para testar GET (listar manutenções)
function testGET() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/preventive-maintenance',
      method: 'GET'
    };

    console.log('📤 Enviando requisição GET para /api/preventive-maintenance...');

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('📥 Status da resposta GET:', res.statusCode);
        
        try {
          const response = JSON.parse(data);
          console.log('📥 Número de manutenções encontradas:', response.data?.length || 0);
          
          if (res.statusCode === 200) {
            console.log('✅ SUCESSO: GET funcionando corretamente!');
            resolve(response);
          } else {
            console.log('❌ ERRO GET: Status não esperado:', res.statusCode);
            reject(new Error(`GET Status ${res.statusCode}`));
          }
        } catch (parseError) {
          console.log('❌ ERRO GET: Resposta não é JSON válido');
          console.log('❌ Resposta bruta:', data);
          reject(parseError);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ ERRO DE CONEXÃO GET:', error.message);
      reject(error);
    });

    req.end();
  });
}

// Executar testes
(async () => {
  try {
    console.log('🔄 Aguardando 2 segundos para garantir que o servidor esteja rodando...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Teste 1: GET (listar manutenções)
    console.log('\n1️⃣ TESTE GET - Listar manutenções existentes:');
    await testGET();
    
    // Teste 2: POST (criar nova manutenção)
    console.log('\n2️⃣ TESTE POST - Criar nova manutenção:');
    await testAPI();
    
    // Teste 3: GET novamente para verificar se foi criada
    console.log('\n3️⃣ TESTE GET FINAL - Verificar se foi criada:');
    await testGET();
    
    console.log('\n✅ TODOS OS TESTES PASSARAM!');
    console.log('✅ API de manutenção preventiva está funcionando corretamente!');
    
  } catch (error) {
    console.log('\n❌ TESTE FALHOU:', error.message);
    console.log('❌ Verifique se o servidor está rodando em http://localhost:3000');
  }
})();