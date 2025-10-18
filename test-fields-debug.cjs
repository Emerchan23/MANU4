const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testFinalFields() {
  console.log('🔍 TESTE FINAL - Verificando campos corrigidos\n');
  
  try {
    // 1. Testar API /api/maintenance-schedules/8
    console.log('📋 1. TESTANDO API /api/maintenance-schedules/8');
    
    const response = await fetch(`${BASE_URL}/api/maintenance-schedules/8`);
    const data = await response.json();
    
    console.log('   ✅ Status:', response.status);
    
    if (data.success && data.data) {
      const scheduleData = data.data;
      
      console.log('\n🔍 CAMPOS QUE ESTAVAM COM PROBLEMA:');
      console.log('   📝 maintenance_type:', scheduleData.maintenance_type || 'VAZIO/NULL');
      console.log('   💰 estimated_cost:', scheduleData.estimated_cost || 'VAZIO/NULL');
      console.log('   📊 status:', scheduleData.status || 'VAZIO/NULL');
      
      console.log('\n✅ VERIFICAÇÃO DOS VALORES:');
      console.log('   - maintenance_type é "preventiva"?', scheduleData.maintenance_type === 'preventiva' ? '✅ SIM' : '❌ NÃO');
      console.log('   - estimated_cost é "0.00"?', scheduleData.estimated_cost === '0.00' ? '✅ SIM' : '❌ NÃO');
      console.log('   - status é "SCHEDULED"?', scheduleData.status === 'SCHEDULED' ? '✅ SIM' : '❌ NÃO');
      
      console.log('\n📊 RESUMO DOS CAMPOS PROBLEMÁTICOS:');
      if (scheduleData.maintenance_type) {
        console.log('   ✅ Tipo de Manutenção: CARREGADO (' + scheduleData.maintenance_type + ')');
      } else {
        console.log('   ❌ Tipo de Manutenção: VAZIO');
      }
      
      if (scheduleData.estimated_cost !== null && scheduleData.estimated_cost !== undefined) {
        console.log('   ✅ Custo Estimado: CARREGADO (R$ ' + scheduleData.estimated_cost + ')');
      } else {
        console.log('   ❌ Custo Estimado: VAZIO');
      }
      
      if (scheduleData.status) {
        console.log('   ✅ Status: CARREGADO (' + scheduleData.status + ')');
      } else {
        console.log('   ❌ Status: VAZIO');
      }
      
    } else {
      console.log('   ❌ Erro na resposta:', data);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testFinalFields().catch(console.error);