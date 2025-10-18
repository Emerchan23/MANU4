const mysql = require('mysql2/promise');

async function testAuthDebug() {
  let connection;

  try {
    console.log('🔍 Testando Sistema de Autenticação...\n');

    // Conectar ao banco
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco de dados\n');
    
    // 1. Verificar se existem usuários
    console.log('1. Verificando usuários no banco:');
    const [users] = await connection.execute(
      'SELECT id, username, email, full_name, is_active, is_admin FROM users LIMIT 5'
    );
    console.log(`   📊 Total de usuários: ${users.length}`);
    users.forEach(user => {
      console.log(`   - ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Ativo: ${user.is_active}`);
    });
    console.log('');

    // 2. Verificar sessões ativas
    console.log('2. Verificando sessões ativas:');
    const [sessions] = await connection.execute(
      'SELECT id, user_id, session_id, expires_at FROM user_sessions WHERE expires_at > NOW() LIMIT 5'
    );
    console.log(`   📊 Sessões ativas: ${sessions.length}`);
    sessions.forEach(session => {
      console.log(`   - ID: ${session.id}, User ID: ${session.user_id}, Expira: ${session.expires_at}`);
    });
    console.log('');

    // 3. Verificar estrutura da tabela user_sessions
    console.log('3. Verificando estrutura da tabela user_sessions:');
    const [structure] = await connection.execute('DESCRIBE user_sessions');
    console.log('   Colunas:');
    structure.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    console.log('');

    // 4. Verificar se existe cookie de autenticação (simulação)
    console.log('4. Simulando verificação de cookie:');
    console.log('   ⚠️  Não é possível verificar cookies do navegador via Node.js');
    console.log('   💡 Para verificar: abra DevTools > Application > Cookies > localhost:3000');
    console.log('   🔍 Procure por: auth_token');
    console.log('');

    // 5. Testar função getCurrentUser simulada
    console.log('5. Testando lógica de autenticação:');
    if (sessions.length > 0) {
      const testSession = sessions[0];
      console.log(`   🧪 Testando com sessão ID: ${testSession.id}`);
      
      // Buscar usuário da sessão
      const [userFromSession] = await connection.execute(
        'SELECT u.id, u.username, u.email, u.full_name, u.is_active, u.is_admin FROM users u WHERE u.id = ? AND u.is_active = TRUE',
        [testSession.user_id]
      );
      
      if (userFromSession.length > 0) {
        console.log('   ✅ Usuário encontrado para a sessão:');
        console.log(`      - Nome: ${userFromSession[0].full_name}`);
        console.log(`      - Email: ${userFromSession[0].email}`);
        console.log(`      - Admin: ${userFromSession[0].is_admin ? 'Sim' : 'Não'}`);
      } else {
        console.log('   ❌ Usuário não encontrado ou inativo para a sessão');
      }
    } else {
      console.log('   ⚠️  Nenhuma sessão ativa encontrada');
    }
    console.log('');

    // 6. Verificar configuração JWT
    console.log('6. Verificando configuração JWT:');
    console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? 'Configurado' : 'Não configurado (usando padrão)'}`);
    console.log('');

    console.log('🎯 Diagnóstico completo!');
    console.log('');
    console.log('📋 Próximos passos para resolver o erro:');
    console.log('1. Verificar se existe cookie "auth_token" no navegador');
    console.log('2. Fazer login novamente se não houver cookie');
    console.log('3. Verificar se o servidor está rodando na porta 3000');
    console.log('4. Verificar se não há problemas de CORS');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testAuthDebug().catch(console.error);