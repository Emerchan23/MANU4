const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testSpecificFields() {
  console.log('🔍 TESTANDO CAMPOS ESPECÍFICOS - Tipo Manutenção, Custo Estimado e Status\n');
  
  try {
    // 1. Testar API /api/maintenance-schedules/8
    console.log('📋 1. TESTANDO API /api/maintenance-schedules/8');
    console.log('   URL:', `${BASE_URL}/api/maintenance-schedules/8`);
    
    const response = await fetch(`${BASE_URL}/api/maintenance-schedules/8`);
    const data = await response.json();
    
    console.log('   ✅ Status:', response.status);
    console.log('   📊 Resposta completa:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      const scheduleData = data.data;
      
      console.log('\n🔍 CAMPOS ESPECÍFICOS QUE ESTÃO COM PROBLEMA:');
      console.log('   📝 maintenance_type:', scheduleData.maintenance_type || 'VAZIO/NULL');
      console.log('   💰 estimated_cost:', scheduleData.estimated_cost || 'VAZIO/NULL');
      console.log('   📊 status:', scheduleData.status || 'VAZIO/NULL');
      
      console.log('\n🔍 OUTROS CAMPOS RELACIONADOS:');
      console.log('   🔧 type:', scheduleData.type || 'VAZIO/NULL');
      console.log('   💵 cost:', scheduleData.cost || 'VAZIO/NULL');
      console.log('   📈 priority:', scheduleData.priority || 'VAZIO/NULL');
      
      console.log('\n🔍 TODOS OS CAMPOS DISPONÍVEIS:');
      Object.keys(scheduleData).forEach(key => {
        console.log(`   ${key}: ${scheduleData[key]}`);
      });
      
    } else {
      console.log('   ❌ Erro na resposta:', data);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testSpecificFields().catch(console.error);