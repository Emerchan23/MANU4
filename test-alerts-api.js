// Usar fetch nativo do Node.js 18+

async function testAlertsAPI() {
  console.log('🧪 Testando API de Alertas...\n');

  try {
    // Teste 1: GET - Listar alertas
    console.log('1. Testando GET /api/alerts...');
    const getResponse = await fetch('http://localhost:3000/api/alerts?limit=5');
    const getData = await getResponse.json();
    
    if (getData.success) {
      console.log('✅ GET OK - Alertas encontrados:', getData.data.length);
      console.log('📊 Estatísticas:', getData.statistics);
    } else {
      console.log('❌ GET falhou:', getData.error);
    }

    // Teste 2: POST - Criar alerta
    console.log('\n2. Testando POST /api/alerts...');
    const postData = {
      equipmentId: "1",
      tipo: "MANUTENCAO",
      prioridade: "ALTA",
      descricao: "Teste de criação via API Node.js",
      dataVencimento: "2024-12-31",
      notificados: ["admin@hospital.com", "tecnico@hospital.com"]
    };

    const postResponse = await fetch('http://localhost:3000/api/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    });

    const postResult = await postResponse.json();
    
    if (postResult.success) {
      console.log('✅ POST OK - Alerta criado com ID:', postResult.data.id);
      console.log('📝 Dados:', {
        id: postResult.data.id,
        tipo: postResult.data.tipo,
        prioridade: postResult.data.prioridade,
        descricao: postResult.data.descricao
      });
    } else {
      console.log('❌ POST falhou:', postResult.error);
      console.log('📋 Status:', postResponse.status);
      console.log('📋 Response:', await postResponse.text());
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testAlertsAPI();