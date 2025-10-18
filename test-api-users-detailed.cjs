const http = require('http');

function testApiUsers() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/users',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const users = JSON.parse(data);
          console.log('🔍 Resposta da API /api/users:');
          console.log('Status:', res.statusCode);
          console.log('Dados completos:');
          console.log(JSON.stringify(users, null, 2));
          
          console.log('\n📧 Verificação de emails:');
          users.forEach((user, index) => {
            console.log(`Usuário ${index + 1}:`);
            console.log(`  ID: ${user.id}`);
            console.log(`  Username: ${user.username}`);
            console.log(`  Name: ${user.name}`);
            console.log(`  Email: ${user.email || 'NULL/VAZIO'}`);
            console.log(`  Role: ${user.role}`);
            console.log('---');
          });
          
          resolve(users);
        } catch (error) {
          console.error('Erro ao parsear JSON:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Erro na requisição:', error);
      reject(error);
    });

    req.end();
  });
}

testApiUsers().catch(console.error);