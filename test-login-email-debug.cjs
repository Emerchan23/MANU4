// Teste específico para debug do erro de login por email

async function testLoginEmailDebug() {
  console.log('🔐 Debug específico do erro de login por email...\n');

  const baseURL = 'http://localhost:3000';
  const loginEndpoint = `${baseURL}/api/auth/login`;

  // Teste com email
  const testData = { 
    username: 'admin@sistema.com', 
    password: 'admin123' 
  };

  console.log(`📤 Enviando: ${JSON.stringify(testData)}`);

  try {
    const response = await fetch(loginEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    // Capturar headers de resposta
    console.log('\n📋 Headers de resposta:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    const responseData = await response.text();
    console.log(`\n📥 Resposta completa: ${responseData}`);

    // Tentar parsear como JSON
    try {
      const jsonData = JSON.parse(responseData);
      console.log('\n📊 Dados JSON parseados:');
      console.log(JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log('\n⚠️  Resposta não é JSON válido');
    }

  } catch (error) {
    console.log(`❌ Erro na requisição: ${error.message}`);
    console.log('Stack:', error.stack);
  }
}

// Executar teste
testLoginEmailDebug().catch(console.error);