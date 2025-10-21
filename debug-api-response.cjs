const http = require('http');

async function debugAPIResponse() {
  console.log('🔍 Debugando resposta da API /api/agendamentos...\n');

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/agendamentos?limit=1',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          console.log('📄 Resposta bruta da API:');
          console.log(data);
          console.log('\n' + '='.repeat(80) + '\n');
          
          const response = JSON.parse(data);
          
          if (response.success && response.data && response.data.length > 0) {
            const firstSchedule = response.data[0];
            console.log('🔍 Primeiro agendamento (objeto completo):');
            console.log(JSON.stringify(firstSchedule, null, 2));
            
            console.log('\n🔍 Propriedades do objeto:');
            Object.keys(firstSchedule).forEach(key => {
              console.log(`- ${key}: ${typeof firstSchedule[key]} = ${firstSchedule[key]}`);
            });
            
            console.log('\n🔍 Verificando especificamente maintenance_plan_name:');
            console.log('- Existe a propriedade?', 'maintenance_plan_name' in firstSchedule);
            console.log('- Valor:', firstSchedule.maintenance_plan_name);
            console.log('- Tipo:', typeof firstSchedule.maintenance_plan_name);
            console.log('- É null?', firstSchedule.maintenance_plan_name === null);
            console.log('- É undefined?', firstSchedule.maintenance_plan_name === undefined);
            console.log('- É string vazia?', firstSchedule.maintenance_plan_name === '');
          }
          
          resolve(response);
        } catch (error) {
          console.error('❌ Erro ao parsear JSON:', error.message);
          console.log('📄 Resposta bruta:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Erro na requisição:', error.message);
      reject(error);
    });

    req.end();
  });
}

debugAPIResponse().catch(console.error);