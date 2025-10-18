import fetch from 'node-fetch';

// Simular um token válido (você precisará usar um token real para teste completo)
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoidGVzdGUiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMzYwMH0.test';

async function testUserCreation() {
  console.log('🧪 Testando criação de usuário...');
  
  const userData = {
    username: 'teste_usuario_' + Date.now(),
    email: 'teste' + Date.now() + '@exemplo.com',
    password: 'senha123',
    role: 'operador',
    sector: 'Produção'
  };
  
  try {
    console.log('📤 Enviando requisição para criar usuário:', userData.username);
    
    const response = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`
      },
      body: JSON.stringify(userData)
    });
    
    console.log('📊 Status da resposta:', response.status);
    console.log('📋 Headers da resposta:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('📄 Corpo da resposta:', responseText);
    
    if (response.ok) {
      console.log('✅ Usuário criado com sucesso!');
      const result = JSON.parse(responseText);
      console.log('👤 Dados do usuário criado:', result);
    } else {
      console.log('❌ Erro ao criar usuário');
      console.log('🔍 Detalhes do erro:', responseText);
    }
    
  } catch (error) {
    console.log('💥 Erro na requisição:', error.message);
    console.log('🔧 Stack trace:', error.stack);
  }
}

// Testar também a validação do token
async function testTokenValidation() {
  console.log('\n🔐 Testando validação de token...');
  
  try {
    const response = await fetch('http://localhost:3000/api/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${testToken}`
      }
    });
    
    console.log('📊 Status da validação:', response.status);
    const responseText = await response.text();
    console.log('📄 Resposta da validação:', responseText);
    
  } catch (error) {
    console.log('💥 Erro na validação:', error.message);
  }
}

// Executar testes
async function runTests() {
  console.log('🚀 Iniciando testes de criação de usuário...');
  console.log('=' .repeat(50));
  
  await testTokenValidation();
  await testUserCreation();
  
  console.log('\n' + '=' .repeat(50));
  console.log('✨ Testes concluídos!');
}

runTests().catch(console.error);