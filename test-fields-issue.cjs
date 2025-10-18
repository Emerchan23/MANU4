const mysql = require('mysql2/promise');
const http = require('http');

async function testFieldsIssue() {
  console.log('🧪 Testando problemas com campos: Observações, Custo Estimado e Tipo de Manutenção...\n');
  
  try {
    // Teste 1: Criar ordem com todos os campos problemáticos
    console.log('📝 Teste 1: Criando ordem com Observações, Custo Estimado e Tipo PREVENTIVA...');
    
    const createData = {
      equipment_id: 1,
      type: 'PREVENTIVA',
      priority: 'alta',
      description: 'Teste dos campos problemáticos',
      observations: 'Estas são observações importantes que devem ser salvas',
      cost: 250.75,
      company_id: 1,
      requested_date: '15/01/2025',
      scheduled_date: '15/01/2025',
      created_by: 'system',
      assigned_to: null,
      status: 'ABERTA'
    };

    const createResponse = await makeRequest('POST', '/api/service-orders', createData);
    
    if (createResponse.statusCode === 201) {
      const orderId = createResponse.data.id;
      console.log(`✅ Ordem criada com ID: ${orderId}`);
      
      // Verificar no banco de dados
      const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hospital_maintenance'
      });
      
      const [rows] = await connection.execute(
        'SELECT id, type, observations, cost FROM service_orders WHERE id = ?',
        [orderId]
      );
      
      if (rows.length > 0) {
        const record = rows[0];
        console.log('📊 Dados salvos no banco:');
        console.log(`   - ID: ${record.id}`);
        console.log(`   - Tipo: ${record.type}`);
        console.log(`   - Observações: ${record.observations}`);
        console.log(`   - Custo: ${record.cost}`);
        
        // Verificar problemas
        const problems = [];
        if (record.type !== 'PREVENTIVA') {
          problems.push(`❌ Tipo incorreto: esperado 'PREVENTIVA', obtido '${record.type}'`);
        }
        if (!record.observations || record.observations !== createData.observations) {
          problems.push(`❌ Observações incorretas: esperado '${createData.observations}', obtido '${record.observations}'`);
        }
        if (!record.cost || parseFloat(record.cost) !== createData.cost) {
          problems.push(`❌ Custo incorreto: esperado '${createData.cost}', obtido '${record.cost}'`);
        }
        
        if (problems.length === 0) {
          console.log('✅ Todos os campos foram salvos corretamente na criação!');
        } else {
          console.log('❌ Problemas encontrados na criação:');
          problems.forEach(problem => console.log(`   ${problem}`));
        }
        
        // Teste 2: Atualizar a ordem para testar o problema do tipo reverter
        console.log('\n📝 Teste 2: Atualizando ordem para tipo CORRETIVA...');
        
        const updateData = {
          type: 'CORRETIVA',
          observations: 'Observações atualizadas - teste de atualização',
          cost: 300.50,
          description: 'Descrição atualizada',
          priority: 'media'
        };
        
        const updateResponse = await makeRequest('PUT', `/api/service-orders/${orderId}`, updateData);
        
        if (updateResponse.statusCode === 200) {
          console.log('✅ Requisição de atualização bem-sucedida');
          
          // Verificar no banco após atualização
          const [updatedRows] = await connection.execute(
            'SELECT id, type, observations, cost FROM service_orders WHERE id = ?',
            [orderId]
          );
          
          if (updatedRows.length > 0) {
            const updatedRecord = updatedRows[0];
            console.log('📊 Dados após atualização:');
            console.log(`   - ID: ${updatedRecord.id}`);
            console.log(`   - Tipo: ${updatedRecord.type}`);
            console.log(`   - Observações: ${updatedRecord.observations}`);
            console.log(`   - Custo: ${updatedRecord.cost}`);
            
            // Verificar problemas na atualização
            const updateProblems = [];
            if (updatedRecord.type !== 'CORRETIVA') {
              updateProblems.push(`❌ Tipo não atualizou: esperado 'CORRETIVA', obtido '${updatedRecord.type}'`);
            }
            if (!updatedRecord.observations || updatedRecord.observations !== updateData.observations) {
              updateProblems.push(`❌ Observações não atualizaram: esperado '${updateData.observations}', obtido '${updatedRecord.observations}'`);
            }
            if (!updatedRecord.cost || parseFloat(updatedRecord.cost) !== updateData.cost) {
              updateProblems.push(`❌ Custo não atualizou: esperado '${updateData.cost}', obtido '${updatedRecord.cost}'`);
            }
            
            if (updateProblems.length === 0) {
              console.log('✅ Todos os campos foram atualizados corretamente!');
            } else {
              console.log('❌ Problemas encontrados na atualização:');
              updateProblems.forEach(problem => console.log(`   ${problem}`));
            }
          }
        } else {
          console.log(`❌ Erro na atualização: ${updateResponse.statusCode}`);
          console.log(updateResponse.data);
        }
        
        // Teste 3: Testar novamente com tipo PREDITIVA
        console.log('\n📝 Teste 3: Atualizando para tipo PREDITIVA...');
        
        const updateData2 = {
          type: 'PREDITIVA',
          observations: 'Observações finais - teste PREDITIVA',
          cost: 450.25
        };
        
        const updateResponse2 = await makeRequest('PUT', `/api/service-orders/${orderId}`, updateData2);
        
        if (updateResponse2.statusCode === 200) {
          const [finalRows] = await connection.execute(
            'SELECT id, type, observations, cost FROM service_orders WHERE id = ?',
            [orderId]
          );
          
          if (finalRows.length > 0) {
            const finalRecord = finalRows[0];
            console.log('📊 Dados finais:');
            console.log(`   - Tipo: ${finalRecord.type}`);
            console.log(`   - Observações: ${finalRecord.observations}`);
            console.log(`   - Custo: ${finalRecord.cost}`);
            
            if (finalRecord.type === 'PREDITIVA') {
              console.log('✅ Tipo PREDITIVA salvo corretamente!');
            } else {
              console.log(`❌ Tipo PREDITIVA não foi salvo: obtido '${finalRecord.type}'`);
            }
          }
        }
      }
      
      await connection.end();
    } else {
      console.log(`❌ Erro ao criar ordem: ${createResponse.statusCode}`);
      console.log(createResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({ statusCode: res.statusCode, data: parsedData });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Executar o teste
testFieldsIssue();