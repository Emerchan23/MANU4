const crypto = require('crypto');

// Função para hash de senha
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function testLoginFlow() {
  console.log('🧪 Testando Fluxo de Login via API\n');
  console.log('='.repeat(60));

  const baseUrl = 'http://localhost:3000';
  
  // Teste 1: Login com usuário
  console.log('\n📝 Teste 1: Login com username');
  console.log('-'.repeat(60));
  
  try {
    const response1 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    const data1 = await response1.json();
    
    console.log('Status:', response1.status);
    console.log('Sucesso:', data1.success);
    
    if (data1.success) {
      console.log('✅ Login com username funcionou!');
      console.log('Usuário:', data1.user.username);
      console.log('Email:', data1.user.email);
      console.log('Admin:', data1.user.is_admin);
      console.log('Permissões:', data1.permissions.length);
    } else {
      console.log('❌ Falha no login:', data1.error);
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  // Teste 2: Login com email
  console.log('\n📝 Teste 2: Login com email');
  console.log('-'.repeat(60));
  
  try {
    const response2 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin@sistema.com',
        password: 'admin123'
      })
    });

    const data2 = await response2.json();
    
    console.log('Status:', response2.status);
    console.log('Sucesso:', data2.success);
    
    if (data2.success) {
      console.log('✅ Login com email funcionou!');
      console.log('Usuário:', data2.user.username);
      console.log('Email:', data2.user.email);
      console.log('Admin:', data2.user.is_admin);
      console.log('Permissões:', data2.permissions.length);
    } else {
      console.log('❌ Falha no login:', data2.error);
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  // Teste 3: Login com senha incorreta
  console.log('\n📝 Teste 3: Login com senha incorreta');
  console.log('-'.repeat(60));
  
  try {
    const response3 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'senhaerrada'
      })
    });

    const data3 = await response3.json();
    
    console.log('Status:', response3.status);
    console.log('Sucesso:', data3.success);
    
    if (!data3.success && response3.status === 401) {
      console.log('✅ Validação de senha funcionou corretamente!');
      console.log('Erro:', data3.error);
    } else {
      console.log('❌ Validação de senha não funcionou como esperado');
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  // Teste 4: Login com usuário inexistente
  console.log('\n📝 Teste 4: Login com usuário inexistente');
  console.log('-'.repeat(60));
  
  try {
    const response4 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'usuarioinexistente',
        password: 'qualquersenha'
      })
    });

    const data4 = await response4.json();
    
    console.log('Status:', response4.status);
    console.log('Sucesso:', data4.success);
    
    if (!data4.success && response4.status === 401) {
      console.log('✅ Validação de usuário funcionou corretamente!');
      console.log('Erro:', data4.error);
    } else {
      console.log('❌ Validação de usuário não funcionou como esperado');
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  // Teste 5: Login sem credenciais
  console.log('\n📝 Teste 5: Login sem credenciais');
  console.log('-'.repeat(60));
  
  try {
    const response5 = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    const data5 = await response5.json();
    
    console.log('Status:', response5.status);
    console.log('Sucesso:', data5.success);
    
    if (!data5.success && response5.status === 400) {
      console.log('✅ Validação de campos obrigatórios funcionou!');
      console.log('Erro:', data5.error);
    } else {
      console.log('❌ Validação de campos não funcionou como esperado');
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ TESTES CONCLUÍDOS!');
  console.log('='.repeat(60));
  console.log('\n💡 Dicas:');
  console.log('   - Certifique-se de que o servidor está rodando em http://localhost:3000');
  console.log('   - Execute: npm run dev');
  console.log('   - Verifique os logs do servidor para mais detalhes\n');
}

// Executar testes
testLoginFlow().catch(error => {
  console.error('\n❌ Erro fatal:', error);
  console.log('\n💡 Certifique-se de que:');
  console.log('   1. O servidor Next.js está rodando (npm run dev)');
  console.log('   2. O banco de dados está configurado');
  console.log('   3. As migrações foram executadas\n');
});
