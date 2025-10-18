// Usar fetch nativo do Node.js 18+

async function testLoginAPI() {
  console.log('🔐 Testando endpoint de login...\n');

  const baseURL = 'http://localhost:3000';
  const loginEndpoint = `${baseURL}/api/auth/login`;

  // Dados de teste
  const testCredentials = [
    {
      name: 'Admin com username',
      data: { username: 'admin', password: 'admin123' }
    },
    {
      name: 'Admin com email',
      data: { username: 'admin@sistema.com', password: 'admin123' }
    },
    {
      name: 'Credenciais inválidas',
      data: { username: 'admin', password: 'senhaerrada' }
    }
  ];

  for (const test of testCredentials) {
    console.log(`\n📋 Teste: ${test.name}`);
    console.log(`📤 Enviando: ${JSON.stringify(test.data)}`);

    try {
      const response = await fetch(loginEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(test.data)
      });

      console.log(`📊 Status: ${response.status} ${response.statusText}`);

      const responseData = await response.text();
      console.log(`📥 Resposta: ${responseData}`);

      // Verificar cookies se login foi bem-sucedido
      if (response.status === 200) {
        const cookies = response.headers.get('set-cookie');
        if (cookies) {
          console.log(`🍪 Cookies definidos: ${cookies}`);
        } else {
          console.log('⚠️  Nenhum cookie foi definido');
        }
      }

    } catch (error) {
      console.log(`❌ Erro na requisição: ${error.message}`);
    }

    console.log('─'.repeat(50));
  }

  // Teste adicional: verificar se o endpoint existe
  console.log('\n🔍 Verificando se o endpoint existe...');
  try {
    const response = await fetch(loginEndpoint, {
      method: 'GET'
    });
    console.log(`📊 GET Status: ${response.status} ${response.statusText}`);
    
    if (response.status === 405) {
      console.log('✅ Endpoint existe (Method Not Allowed é esperado para GET)');
    } else {
      const text = await response.text();
      console.log(`📥 Resposta GET: ${text}`);
    }
  } catch (error) {
    console.log(`❌ Erro ao verificar endpoint: ${error.message}`);
  }
}

// Executar teste
testLoginAPI().catch(console.error);