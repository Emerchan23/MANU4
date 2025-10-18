const http = require('http');

async function testAPIUpdate() {
  console.log('=== TESTE DA API DE ATUALIZAÇÃO DE EQUIPAMENTOS ===\n');

  // Dados de teste que simulam o que o frontend deveria enviar
  const testData = {
    name: 'Equipamento Teste API',
    model: 'Modelo API Test',
    serial_number: 'SN-API-123',
    manufacturer: 'Fabricante API',
    sector_id: 1,
    category_id: 1,
    subsector_id: 2, // Este é o campo que não está sendo salvo
    voltage: '220V',  // Este é o campo que não está sendo salvo
    installation_date: '2024-01-15',
    maintenance_frequency_days: 30,
    status: 'ativo',
    observations: 'Teste via API',
    patrimonio_number: 'PAT-API-001'
  };

  console.log('📤 Dados que serão enviados para a API:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('');

  const postData = JSON.stringify(testData);

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/equipment/1', // Testando com equipamento ID 1
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log(`📡 Status da resposta: ${res.statusCode}`);
      console.log(`📋 Headers da resposta:`, res.headers);
      console.log('');

      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log('📥 Resposta da API:');
        try {
          const parsedResponse = JSON.parse(responseData);
          console.log(JSON.stringify(parsedResponse, null, 2));
        } catch (e) {
          console.log('Resposta não é JSON válido:');
          console.log(responseData);
        }
        console.log('');
        
        if (res.statusCode === 200) {
          console.log('✅ API respondeu com sucesso!');
        } else {
          console.log(`❌ API retornou erro: ${res.statusCode}`);
        }
        
        resolve(responseData);
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erro na requisição:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Função para verificar se os dados foram salvos no banco
async function verifyDatabaseSave() {
  const mysql = require('mysql2/promise');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  try {
    const [rows] = await connection.execute('SELECT * FROM equipment WHERE id = 1');
    
    if (rows.length > 0) {
      const equipment = rows[0];
      console.log('🔍 VERIFICAÇÃO NO BANCO DE DADOS:');
      console.log(`   ID: ${equipment.id}`);
      console.log(`   Nome: ${equipment.name}`);
      console.log(`   Subsector_id: ${equipment.subsector_id} ${equipment.subsector_id ? '✅' : '❌ NULL'}`);
      console.log(`   Voltage: ${equipment.voltage} ${equipment.voltage ? '✅' : '❌ NULL'}`);
      console.log(`   Última atualização: ${equipment.updated_at}`);
      console.log('');
      
      if (equipment.subsector_id && equipment.voltage) {
        console.log('🎉 SUCESSO: Ambos os campos foram salvos!');
      } else {
        console.log('⚠️  PROBLEMA: Um ou ambos os campos não foram salvos!');
        
        if (!equipment.subsector_id) {
          console.log('   - subsector_id está NULL');
        }
        if (!equipment.voltage) {
          console.log('   - voltage está NULL');
        }
      }
    } else {
      console.log('❌ Equipamento não encontrado no banco');
    }
  } finally {
    await connection.end();
  }
}

async function runTest() {
  try {
    await testAPIUpdate();
    console.log('\n' + '='.repeat(50));
    await verifyDatabaseSave();
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

runTest();