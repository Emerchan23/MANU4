const https = require('https');
const http = require('http');

// Função para fazer requisições HTTP
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.port === 443 ? https : http;
    
    const req = protocol.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonBody,
            body: body
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: body,
            body: body
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testLoginRedirect() {
  console.log('🔐 Testando fluxo completo de login e redirecionamento...\n');

  try {
    // 1. Fazer login
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      username: 'admin',
      password: 'admin123'
    });

    console.log(`📊 Status do login: ${loginResponse.status}`);
    console.log(`📋 Resposta:`, loginResponse.data);

    // Verificar se há cookie de sessão
    const setCookieHeader = loginResponse.headers['set-cookie'];
    console.log(`🍪 Set-Cookie header:`, setCookieHeader);

    if (!setCookieHeader) {
      console.log('❌ Nenhum cookie foi definido no login!');
      return;
    }

    // Extrair o token do cookie
    let authToken = null;
    if (setCookieHeader) {
      const authCookie = setCookieHeader.find(cookie => cookie.startsWith('auth_token='));
      if (authCookie) {
        authToken = authCookie.split('=')[1].split(';')[0];
        console.log(`✅ Token extraído: ${authToken.substring(0, 20)}...`);
      }
    }

    if (!authToken) {
      console.log('❌ Token não encontrado no cookie!');
      return;
    }

    // 2. Testar acesso à página raiz com o cookie
    console.log('\n2️⃣ Testando acesso à página raiz com cookie...');
    const rootResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${authToken}`
      }
    });

    console.log(`📊 Status da página raiz: ${rootResponse.status}`);
    console.log(`📍 Location header:`, rootResponse.headers.location);

    // 3. Testar acesso ao dashboard
    console.log('\n3️⃣ Testando acesso ao dashboard...');
    const dashboardResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/dashboard',
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${authToken}`
      }
    });

    console.log(`📊 Status do dashboard: ${dashboardResponse.status}`);
    console.log(`📍 Location header:`, dashboardResponse.headers.location);

    // 4. Verificar se o middleware está funcionando
    console.log('\n4️⃣ Testando middleware com API protegida...');
    const apiResponse = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/users',
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${authToken}`
      }
    });

    console.log(`📊 Status da API: ${apiResponse.status}`);
    if (apiResponse.status !== 200) {
      console.log(`❌ Erro na API:`, apiResponse.data);
    } else {
      console.log(`✅ API funcionando corretamente`);
    }

    // 5. Verificar sessão no banco
    console.log('\n5️⃣ Verificando sessão no banco de dados...');
    const mysql = require('mysql2/promise');
    
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    const [sessions] = await connection.execute(
      'SELECT * FROM user_sessions WHERE session_id = ? AND expires_at > NOW()',
      [authToken]
    );

    console.log(`📊 Sessões encontradas: ${sessions.length}`);
    if (sessions.length > 0) {
      console.log(`✅ Sessão válida encontrada para usuário ID: ${sessions[0].user_id}`);
    } else {
      console.log(`❌ Nenhuma sessão válida encontrada no banco!`);
    }

    await connection.end();

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack:', error.stack);
  }
}

testLoginRedirect().catch(console.error);