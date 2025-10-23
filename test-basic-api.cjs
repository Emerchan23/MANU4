const fs = require('fs');

async function testBasicApi() {
  try {
    console.log('🔄 Testando endpoint básico (sem PDF)...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout
    
    const response = await fetch('http://localhost:3000/api/relatorios/equipment/13/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        equipmentId: 13
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log(`📊 Status da resposta: ${response.status}`);
    console.log(`📄 Content-Type: ${response.headers.get('content-type')}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Erro na API: ${response.status} - ${response.statusText}`);
      console.log(`📄 Conteúdo do erro:`, errorText);
      return;
    }

    const data = await response.json();
    console.log(`✅ Resposta recebida com sucesso!`);
    console.log(`📋 Dados:`, JSON.stringify(data, null, 2));

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ Timeout: A requisição demorou mais de 5 segundos');
    } else {
      console.error('❌ Erro ao testar API:', error.message);
    }
  }
}

testBasicApi();