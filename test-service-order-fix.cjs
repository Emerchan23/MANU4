const mysql = require('mysql2/promise');
const http = require('http');

async function testServiceOrderCreation() {
  try {
    console.log('🧪 Testando criação de ordem de serviço com type e observations...');
    
    const postData = JSON.stringify({
      equipment_id: 1,
      company_id: 1,
      description: 'Teste após correção dos parâmetros SQL',
      priority: 'alta',
      type: 'PREVENTIVA',
      observations: 'Observações de teste após correção dos parâmetros'
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/service-orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', async () => {
        try {
          const response = JSON.parse(data);
          console.log('✅ Ordem criada com ID:', response.id);
          
          // Aguardar um pouco e verificar no banco
          setTimeout(async () => {
            const connection = await mysql.createConnection({
              host: 'localhost',
              user: 'root',
              password: '',
              database: 'hospital_maintenance'
            });
            
            const [record] = await connection.execute('SELECT id, type, observations FROM service_orders WHERE id = ?', [response.id]);
            
            if (record.length > 0) {
              console.log('\n📊 Verificação no banco:');
              console.log('  ID:', record[0].id);
              console.log('  Type:', record[0].type);
              console.log('  Observations:', record[0].observations);
              
              if (record[0].type === 'PREVENTIVA' && record[0].observations === 'Observações de teste após correção dos parâmetros') {
                console.log('\n🎉 SUCESSO! Os dados foram salvos corretamente!');
              } else {
                console.log('\n❌ AINDA HÁ PROBLEMA: Os dados não foram salvos corretamente.');
              }
            }
            
            await connection.end();
          }, 1000);
          
        } catch (error) {
          console.error('❌ Erro ao processar resposta:', error.message);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erro na requisição:', error.message);
    });

    req.write(postData);
    req.end();
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testServiceOrderCreation();