// Teste do botão de logout
// Usar fetch nativo do Node.js 18+

async function testLogoutButton() {
  console.log('🔐 Testando funcionalidade de logout...\n');

  const baseURL = 'http://localhost:3000';
  const loginEndpoint = `${baseURL}/api/auth/login`;
  const logoutEndpoint = `${baseURL}/api/auth/logout`;

  // 1. Fazer login primeiro
  console.log('📋 Passo 1: Fazendo login...');
  try {
    const loginResponse = await fetch(loginEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    console.log(`📊 Login Status: ${loginResponse.status} ${loginResponse.statusText}`);
    
    if (loginResponse.status === 200) {
      const loginData = await loginResponse.text();
      console.log(`📥 Login Resposta: ${loginData}`);
      
      // Obter cookies do login
      const cookies = loginResponse.headers.get('set-cookie');
      console.log(`🍪 Cookies recebidos: ${cookies}`);
      
      if (cookies) {
        // 2. Testar logout
        console.log('\n📋 Passo 2: Testando logout...');
        
        const logoutResponse = await fetch(logoutEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': cookies
          }
        });
        
        console.log(`📊 Logout Status: ${logoutResponse.status} ${logoutResponse.statusText}`);
        const logoutData = await logoutResponse.text();
        console.log(`📥 Logout Resposta: ${logoutData}`);
        
        if (logoutResponse.status === 200) {
          console.log('✅ Logout funcionando corretamente!');
        } else {
          console.log('❌ Erro no logout');
        }
      } else {
        console.log('⚠️ Nenhum cookie foi definido no login');
      }
    } else {
      const loginError = await loginResponse.text();
      console.log(`❌ Erro no login: ${loginError}`);
    }

  } catch (error) {
    console.log(`❌ Erro na requisição: ${error.message}`);
  }

  console.log('\n' + '─'.repeat(50));
  console.log('🎯 Teste do botão de logout concluído');
}

// Executar teste
testLogoutButton().catch(console.error);