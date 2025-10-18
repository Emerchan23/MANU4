// Script para testar o envio de dados do formulário de equipamentos
const http = require('http');

// Dados de teste simulando o que o formulário deveria enviar
const testData = {
  name: 'Equipamento Teste',
  manufacturer: 'Fabricante Teste',
  model: 'Modelo Teste',
  serial_number: 'SN123456',
  patrimonio_number: 'PAT789',
  category_id: 1,
  sector_id: 1,
  subsector_id: 2, // Campo que deveria ser salvo
  voltage: '380V', // Campo que deveria ser salvo
  installation_date: '2024-01-15',
  maintenance_frequency_days: 30,
  status: 'Ativo',
  observations: 'Teste de salvamento de subsetor e voltagem'
};

function testFormSubmission() {
  const postData = JSON.stringify(testData);
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/equipment/1', // Testando atualização do equipamento ID 1
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('🧪 TESTANDO ENVIO DE DADOS DO FORMULÁRIO');
  console.log('Dados sendo enviados:', JSON.stringify(testData, null, 2));
  console.log('\n🔍 Campos específicos:');
  console.log('subsector_id:', testData.subsector_id, '(tipo:', typeof testData.subsector_id, ')');
  console.log('voltage:', testData.voltage, '(tipo:', typeof testData.voltage, ')');
  console.log('\n📡 Enviando requisição PUT para /api/equipment/1...');

  const req = http.request(options, (res) => {
    console.log('\n📥 RESPOSTA RECEBIDA:');
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    
    let responseBody = '';
    res.on('data', (chunk) => {
      responseBody += chunk;
    });
    
    res.on('end', () => {
      console.log('\n📦 Corpo da resposta:');
      try {
        const response = JSON.parse(responseBody);
        console.log(JSON.stringify(response, null, 2));
      } catch (e) {
        console.log('Resposta não é JSON:', responseBody);
      }
      
      console.log('\n' + '='.repeat(50));
      console.log('✅ Teste concluído!');
      console.log('\nVerifique:');
      console.log('1. Os logs do servidor de debug acima');
      console.log('2. Se os campos subsector_id e voltage foram interceptados');
      console.log('3. Se a resposta indica sucesso na atualização');
    });
  });

  req.on('error', (e) => {
    console.error('❌ Erro na requisição:', e.message);
  });

  // Enviar os dados
  req.write(postData);
  req.end();
}

// Aguardar um pouco para garantir que o servidor esteja pronto
setTimeout(() => {
  testFormSubmission();
}, 1000);

console.log('🚀 Iniciando teste de envio de formulário em 1 segundo...');