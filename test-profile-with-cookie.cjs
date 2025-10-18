const mysql = require('mysql2/promise');
const { SignJWT } = require('jose');

async function testProfileWithCookie() {
  let connection;

  try {
    console.log('🔍 Testando /api/profile com cookie simulado...\n');

    // Conectar ao banco
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco de dados\n');
    
    // 1. Buscar uma sessão ativa
    const [sessions] = await connection.execute(
      'SELECT session_id, user_id FROM user_sessions WHERE expires_at > NOW() LIMIT 1'
    );
    
    if (sessions.length === 0) {
      console.log('❌ Nenhuma sessão ativa encontrada. Criando nova sessão...');
      
      // Criar nova sessão para o usuário admin
      const JWT_SECRET = new TextEncoder().encode(
        process.env.JWT_SECRET || 'your-secret-key-change-in-production-min-32-chars'
      );
      
      const token = await new SignJWT({ userId: 1 })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET);
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      await connection.execute(
        'INSERT INTO user_sessions (user_id, session_id, expires_at) VALUES (?, ?, ?)',
        [1, token, expiresAt]
      );
      
      console.log('✅ Nova sessão criada');
      console.log(`Token: ${token.substring(0, 50)}...`);
      
      // Testar com o novo token
      await testApiWithToken(token);
    } else {
      const session = sessions[0];
      console.log(`✅ Sessão ativa encontrada para usuário ID: ${session.user_id}`);
      console.log(`Token: ${session.session_id.substring(0, 50)}...`);
      
      // Testar com o token existente
      await testApiWithToken(session.session_id);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function testApiWithToken(token) {
  try {
    console.log('\n🧪 Testando requisição com cookie...');
    
    const response = await fetch('http://localhost:3000/api/profile', {
      method: 'GET',
      headers: {
        'Cookie': `auth_token=${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Status da resposta: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Sucesso! Dados do perfil:');
      console.log(`   - Nome: ${data.user?.name || 'N/A'}`);
      console.log(`   - Email: ${data.user?.email || 'N/A'}`);
      console.log(`   - Username: ${data.user?.username || 'N/A'}`);
      console.log(`   - Role: ${data.user?.role || 'N/A'}`);
    } else {
      const errorData = await response.text();
      console.log('❌ Erro na resposta:');
      console.log(`   Status: ${response.status}`);
      console.log(`   Dados: ${errorData}`);
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

testProfileWithCookie().catch(console.error);