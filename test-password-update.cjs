const mysql = require('mysql2/promise');
const crypto = require('crypto');

// Database connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
});

// Simple password hashing function (same as API)
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

async function testPasswordUpdate() {
  try {
    await connection.connect();
    console.log('Conectado ao banco de dados');

    // First, let's check the current user
    const [users] = await connection.execute(
      'SELECT id, nick, name, password FROM users WHERE nick = ?',
      ['admin@sistema.com']
    );

    if (users.length === 0) {
      console.log('Usuário admin@sistema.com não encontrado');
      return;
    }

    const user = users[0];
    console.log('Usuário encontrado:', {
      id: user.id,
      nick: user.nick,
      name: user.name,
      hasPassword: !!user.password
    });

    // Test updating password via API simulation
    const newPassword = 'novasenha123';
    const hashedNewPassword = hashPassword(newPassword);
    
    console.log('Nova senha hash:', hashedNewPassword);

    // Update password in database
    const [result] = await connection.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedNewPassword, user.id]
    );

    console.log('Resultado da atualização:', result);

    // Verify the update
    const [updatedUsers] = await connection.execute(
      'SELECT id, nick, name, password FROM users WHERE id = ?',
      [user.id]
    );

    const updatedUser = updatedUsers[0];
    console.log('Usuário após atualização:', {
      id: updatedUser.id,
      nick: updatedUser.nick,
      name: updatedUser.name,
      passwordChanged: updatedUser.password === hashedNewPassword
    });

    console.log('Teste de atualização de senha concluído com sucesso!');

  } catch (error) {
    console.error('Erro no teste:', error);
  } finally {
    await connection.end();
  }
}

testPasswordUpdate();