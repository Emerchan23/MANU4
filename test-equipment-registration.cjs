// Script para testar o cadastro de equipamento simulando o frontend
const https = require('http');

// Dados de teste para o equipamento
const equipmentData = {
  name: 'Ventilador Pulmonar Teste',
  brand: 'MedTech',
  model: 'VP-2000-TEST',
  serial_number: 'SN-TEST-123456',
  category_id: 1, // Equipamentos Respiratórios (elétrico)
  sector_id: 1,   // Administração
  subsector_id: 1, // UTI Adulto
  acquisition_date: '2024-01-15',
  maintenance_interval_days: 365,
  specifications: JSON.stringify({
    description: 'Ventilador pulmonar para UTI com monitoramento avançado',
    features: ['Monitoramento de pressão', 'Alarmes de segurança', 'Interface digital'],
    voltage: '220V',
    power: '150W'
  })
};

console.log('🚀 Iniciando teste de cadastro de equipamento...');
console.log('📋 Dados do equipamento:', JSON.stringify(equipmentData, null, 2));

// Configuração da requisição
const postData = JSON.stringify(equipmentData);
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/equipment',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

// Fazer a requisição
const req = https.request(options, (res) => {
  console.log(`\n📡 Status da resposta: ${res.statusCode}`);
  console.log('📋 Headers:', res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n📄 Resposta da API:');
    try {
      const response = JSON.parse(data);
      console.log(JSON.stringify(response, null, 2));
      
      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('\n✅ Equipamento cadastrado com sucesso!');
        console.log('🆔 ID do equipamento:', response.id || response.equipmentId);
        
        // Agora vamos verificar se foi salvo no banco
        console.log('\n🔍 Verificando se foi salvo no banco de dados...');
        setTimeout(() => {
          verifyInDatabase(response.id || response.equipmentId);
        }, 1000);
      } else {
        console.log('\n❌ Erro no cadastro do equipamento');
        console.log('💬 Detalhes:', response);
      }
    } catch (error) {
      console.log('\n❌ Erro ao processar resposta JSON:', error.message);
      console.log('📄 Resposta bruta:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Erro na requisição:', error.message);
});

// Enviar os dados
req.write(postData);
req.end();

// Função para verificar no banco de dados
function verifyInDatabase(equipmentId) {
  console.log(`\n🔍 Buscando equipamento ID ${equipmentId} no banco...`);
  
  const getOptions = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/equipment/${equipmentId}`,
    method: 'GET'
  };
  
  const getReq = https.request(getOptions, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`\n📡 Status da busca: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        try {
          const equipment = JSON.parse(data);
          console.log('\n✅ Equipamento encontrado no banco de dados!');
          console.log('📋 Dados salvos:', JSON.stringify(equipment, null, 2));
          
          // Verificar integridade dos dados
          console.log('\n🔍 Verificando integridade dos dados...');
          const checks = [
            { field: 'name', expected: equipmentData.name, actual: equipment.name },
            { field: 'brand', expected: equipmentData.brand, actual: equipment.brand },
            { field: 'model', expected: equipmentData.model, actual: equipment.model },
            { field: 'serial_number', expected: equipmentData.serial_number, actual: equipment.serial_number },
            { field: 'category_id', expected: equipmentData.category_id, actual: equipment.category_id },
            { field: 'sector_id', expected: equipmentData.sector_id, actual: equipment.sector_id },
            { field: 'subsector_id', expected: equipmentData.subsector_id, actual: equipment.subsector_id }
          ];
          
          let allValid = true;
          checks.forEach(check => {
            const isValid = check.expected === check.actual;
            console.log(`${isValid ? '✅' : '❌'} ${check.field}: ${check.actual} ${isValid ? '(OK)' : `(Esperado: ${check.expected})`}`);
            if (!isValid) allValid = false;
          });
          
          console.log(`\n${allValid ? '🎉' : '⚠️'} Resultado final: ${allValid ? 'TODOS OS DADOS FORAM SALVOS CORRETAMENTE!' : 'ALGUNS DADOS NÃO CONFEREM!'}`);
          
        } catch (error) {
          console.log('\n❌ Erro ao processar dados do equipamento:', error.message);
          console.log('📄 Resposta bruta:', data);
        }
      } else {
        console.log('\n❌ Equipamento não encontrado no banco de dados');
        console.log('📄 Resposta:', data);
      }
    });
  });
  
  getReq.on('error', (error) => {
    console.error('\n❌ Erro ao buscar no banco:', error.message);
  });
  
  getReq.end();
}

console.log('\n⏳ Aguardando resposta da API...');