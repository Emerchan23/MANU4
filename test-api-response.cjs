const http = require('http');

function testApiResponse() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/agendamentos?limit=5',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('✅ Resposta da API recebida');
        console.log('📊 Status:', res.statusCode);
        
        if (response.success && response.data) {
          console.log(`📋 Total de agendamentos: ${response.data.length}`);
          
          // Verificar os primeiros 3 agendamentos
          response.data.slice(0, 3).forEach((schedule, index) => {
            console.log(`\n📝 Agendamento ${index + 1}:`);
            console.log(`  ID: ${schedule.id}`);
            console.log(`  Equipment: ${schedule.equipment_name}`);
            console.log(`  Status: ${schedule.status}`);
            console.log(`  Maintenance Plan ID: ${schedule.maintenance_plan_id || 'NULL'}`);
            console.log(`  Maintenance Plan Name: '${schedule.maintenance_plan_name || 'NULL'}'`);
            console.log(`  Description: ${schedule.description?.substring(0, 50)}...`);
          });
          
          // Verificar se algum agendamento tem maintenance_plan_name
          const withPlan = response.data.filter(s => s.maintenance_plan_name && s.maintenance_plan_name !== 'NULL');
          console.log(`\n🎯 Agendamentos com plano de manutenção: ${withPlan.length}`);
          
          if (withPlan.length > 0) {
            console.log('✅ Encontrados agendamentos com plano:');
            withPlan.forEach(schedule => {
              console.log(`  ID: ${schedule.id}, Plano: '${schedule.maintenance_plan_name}'`);
            });
          } else {
            console.log('❌ Nenhum agendamento com plano de manutenção encontrado na resposta da API');
          }
          
        } else {
          console.log('❌ Resposta da API inválida:', response);
        }
      } catch (error) {
        console.error('❌ Erro ao parsear resposta:', error.message);
        console.log('📄 Resposta bruta:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Erro na requisição:', error.message);
  });

  req.end();
}

console.log('🔍 Testando resposta da API /api/agendamentos...');
testApiResponse();