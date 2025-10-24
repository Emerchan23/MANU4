const { default: fetch } = require('node-fetch');

async function testLoginAPI() {
  console.log('🧪 Testando API de Login...\n');

  const testUsers = [
    { username: 'admin', password: 'admin123', expected: 'ADMIN' },
    { username: 'gestor.teste', password: 'gestor123', expected: 'USER' },
    { username: 'tecnico.teste', password: 'tecnico123', expected: 'USER' },
    { username: 'usuario.teste', password: 'usuario123', expected: 'USER' }
  ];

  for (const testUser of testUsers) {
    console.log(`\n🔐 Testando login: ${testUser.username}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: testUser.username,
          password: testUser.password
        })
      });

      const data = await response.json();
      
      console.log(`Status: ${response.status}`);
      console.log(`Response:`, data);
      
      if (response.ok && data.success) {
        console.log(`✅ LOGIN SUCESSO - ${testUser.username}`);
        console.log(`   Nome: ${data.user.name}`);
        console.log(`   Role: ${data.user.role}`);
        console.log(`   Admin: ${data.user.isAdmin ? 'SIM' : 'NÃO'}`);
      } else {
        console.log(`❌ LOGIN FALHOU - ${testUser.username}`);
        console.log(`   Erro: ${data.error}`);
      }
      
    } catch (error) {
      console.log(`❌ ERRO DE CONEXÃO - ${testUser.username}`);
      console.log(`   Erro: ${error.message}`);
    }
  }

  console.log('\n🏁 Teste concluído!');
}

testLoginAPI();