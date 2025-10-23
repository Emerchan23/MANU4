const mysql = require('mysql2/promise');

async function debugUserUpdate() {
  let connection;
  
  try {
    console.log('🔍 Debugando atualização de usuário...\n');
    
    // Conectar ao banco de dados
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco de dados\n');
    
    const userId = 19;
    
    // Verificar se o usuário existe
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    console.log('📋 Usuário atual:', users[0]);
    console.log('');
    
    // Testar a query de atualização
    const updateData = {
      full_name: 'Usuário de Teste - EDITADO',
      email: 'teste.editado@exemplo.com',
      username: 'teste.usuario.editado',
      is_active: true,
      is_admin: false
    };
    
    console.log('📝 Dados para atualização:', updateData);
    console.log('');
    
    // Construir query de atualização
    const updateFields = [];
    const updateValues = [];
    
    if (updateData.full_name) {
      updateFields.push("full_name = ?");
      updateValues.push(updateData.full_name);
    }
    
    if (updateData.email !== undefined) {
      updateFields.push("email = ?");
      updateValues.push(updateData.email);
    }
    
    if (updateData.username) {
      updateFields.push("username = ?");
      updateValues.push(updateData.username);
    }
    
    if (updateData.is_active !== undefined) {
      updateFields.push("is_active = ?");
      updateValues.push(updateData.is_active);
    }
    
    if (updateData.is_admin !== undefined) {
      updateFields.push("is_admin = ?");
      updateValues.push(updateData.is_admin);
    }
    
    updateFields.push("updated_at = CURRENT_TIMESTAMP");
    updateValues.push(userId);
    
    const query = `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`;
    
    console.log('🔧 Query SQL:', query);
    console.log('📊 Valores:', updateValues);
    console.log('');
    
    // Executar a atualização
    const [result] = await connection.execute(query, updateValues);
    
    console.log('✅ Resultado da atualização:', result);
    console.log('');
    
    // Verificar o usuário atualizado
    const [updatedUsers] = await connection.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    
    console.log('📋 Usuário após atualização:', updatedUsers[0]);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada');
    }
  }
}

// Executar o debug
debugUserUpdate();