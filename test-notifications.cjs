// Script para testar as APIs de notificações com banco de dados real
const http = require('http');
const { URL } = require('url');

const BASE_URL = 'http://localhost:3000/api/notifications';
const USER_ID = 1; // ID do usuário para teste

// Função para fazer requisições HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function testNotificationsAPI() {
  console.log('🧪 Iniciando testes das APIs de notificações...\n');

  try {
    // 1. Testar contagem de notificações não lidas
    console.log('1️⃣ Testando contagem de notificações não lidas...');
    const countResponse = await makeRequest(`${BASE_URL}/count?user_id=${USER_ID}`);
    console.log('✅ Contagem:', countResponse.data);
    console.log('');

    // 2. Testar busca de notificações
    console.log('2️⃣ Testando busca de notificações...');
    const getResponse = await makeRequest(`${BASE_URL}?user_id=${USER_ID}&limit=5`);
    console.log('✅ Notificações encontradas:', getResponse.data.length);
    if (getResponse.data.length > 0) {
      console.log('Primeira notificação:', getResponse.data[0]);
    }
    console.log('');

    // 3. Testar criação de nova notificação
    console.log('3️⃣ Testando criação de nova notificação...');
    const newNotification = {
      user_id: USER_ID,
      type: 'teste',
      title: 'Teste de Notificação',
      message: 'Esta é uma notificação de teste criada via API',
      related_id: null,
      related_type: null
    };

    const postResponse = await makeRequest(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newNotification)
    });
    console.log('✅ Notificação criada:', postResponse.data);
    const createdNotificationId = postResponse.data.id;
    console.log('');

    // 4. Testar marcação como lida
    if (createdNotificationId) {
      console.log('4️⃣ Testando marcação como lida...');
      const markReadResponse = await makeRequest(BASE_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark-read',
          notificationId: createdNotificationId
        })
      });
      console.log('✅ Notificação marcada como lida:', markReadResponse.data);
      console.log('');

      // 5. Testar exclusão de notificação específica
      console.log('5️⃣ Testando exclusão de notificação específica...');
      const deleteResponse = await makeRequest(`${BASE_URL}?id=${createdNotificationId}`, {
        method: 'DELETE'
      });
      console.log('✅ Notificação deletada:', deleteResponse.data);
      console.log('');
    } else {
      console.log('⚠️ Não foi possível obter o ID da notificação criada, pulando testes de marcação e exclusão');
    }

    // 6. Verificar contagem final
    console.log('6️⃣ Verificando contagem final...');
    const finalCountResponse = await makeRequest(`${BASE_URL}/count?user_id=${USER_ID}`);
    console.log('✅ Contagem final:', finalCountResponse.data);

    console.log('\n🎉 Todos os testes concluídos com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

// Executar os testes
testNotificationsAPI();