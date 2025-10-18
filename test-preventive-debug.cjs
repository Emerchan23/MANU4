// Script para debugar problema de agendamentos de manutenção preventiva não aparecendo
const BASE_URL = 'http://localhost:3000';

// Dados de teste para criar um agendamento
const testData = {
  equipmentId: "1",
  title: "Teste de Manutenção Preventiva",
  description: "Teste para verificar se o agendamento aparece na lista",
  frequency: "MONTHLY",
  maintenanceType: "INSPECTION",
  priority: "MEDIUM",
  scheduledDate: "2024-02-15",
  estimatedDuration: "120",
  estimatedCost: "150.00",
  notes: "Teste de debug"
};

async function testPreventiveMaintenanceFlow() {
  console.log('🔍 DEBUGANDO PROBLEMA DE AGENDAMENTOS NÃO APARECEREM\n');
  
  try {
    // 1. Primeiro, vamos ver quantos agendamentos existem atualmente
    console.log('📊 1. Verificando agendamentos existentes...');
    const getResponse = await fetch(`${BASE_URL}/api/preventive-maintenance`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const currentData = await getResponse.json();
    console.log(`Status GET inicial: ${getResponse.status}`);
    console.log(`Agendamentos existentes: ${currentData.data ? currentData.data.length : 0}`);
    
    if (currentData.data && currentData.data.length > 0) {
      console.log('📋 Últimos agendamentos:');
      currentData.data.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title} - ${item.scheduled_date} (Status: ${item.status})`);
      });
    }
    
    // 2. Criar um novo agendamento
    console.log('\n🚀 2. Criando novo agendamento...');
    console.log('Dados enviados:', JSON.stringify(testData, null, 2));
    
    const postResponse = await fetch(`${BASE_URL}/api/preventive-maintenance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const postResult = await postResponse.json();
    console.log(`Status POST: ${postResponse.status}`);
    console.log('Resposta POST:', JSON.stringify(postResult, null, 2));
    
    if (postResponse.status !== 201) {
      console.log('❌ ERRO: POST não retornou status 201');
      return;
    }
    
    // 3. Aguardar um pouco e verificar se o agendamento aparece
    console.log('\n⏳ 3. Aguardando 2 segundos e verificando novamente...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const getResponse2 = await fetch(`${BASE_URL}/api/preventive-maintenance`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const newData = await getResponse2.json();
    console.log(`Status GET após criação: ${getResponse2.status}`);
    console.log(`Agendamentos após criação: ${newData.data ? newData.data.length : 0}`);
    
    // 4. Comparar os resultados
    const initialCount = currentData.data ? currentData.data.length : 0;
    const newCount = newData.data ? newData.data.length : 0;
    
    console.log('\n📈 4. ANÁLISE DOS RESULTADOS:');
    console.log(`Agendamentos antes: ${initialCount}`);
    console.log(`Agendamentos depois: ${newCount}`);
    console.log(`Diferença: ${newCount - initialCount}`);
    
    if (newCount > initialCount) {
      console.log('✅ SUCESSO: Novo agendamento foi criado e aparece na lista!');
      
      // Mostrar o novo agendamento
      const newItem = newData.data.find(item => item.title === testData.title);
      if (newItem) {
        console.log('📝 Novo agendamento encontrado:');
        console.log(`  ID: ${newItem.id}`);
        console.log(`  Título: ${newItem.title}`);
        console.log(`  Equipamento: ${newItem.equipment_name}`);
        console.log(`  Data: ${newItem.scheduled_date}`);
        console.log(`  Status: ${newItem.status}`);
      }
    } else {
      console.log('❌ PROBLEMA: Agendamento foi criado mas NÃO aparece na lista!');
      console.log('🔍 Possíveis causas:');
      console.log('  - Problema na query GET');
      console.log('  - Dados não foram salvos no banco');
      console.log('  - Filtros na interface estão escondendo o item');
      console.log('  - Cache ou problema de sincronização');
    }
    
    // 5. Verificar se há filtros ou problemas na query
    console.log('\n🔍 5. Verificando detalhes da resposta GET...');
    if (newData.data && newData.data.length > 0) {
      console.log('📋 Todos os agendamentos retornados:');
      newData.data.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title} - ${item.scheduled_date} (ID: ${item.id}, Status: ${item.status})`);
      });
    } else {
      console.log('⚠️  Nenhum agendamento retornado pela API GET');
    }
    
  } catch (error) {
    console.error('❌ ERRO no teste:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Executar o teste
testPreventiveMaintenanceFlow().catch(console.error);