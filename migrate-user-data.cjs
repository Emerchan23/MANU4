const mysql = require('mysql2/promise');

async function migrateUserData() {
  let connection;

  try {
    console.log('🔄 Iniciando migração dos dados de usuários...\n');

    // Conectar ao banco
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco de dados\n');
    
    // 1. Verificar dados atuais
    console.log('📊 Verificando dados atuais...');
    const [currentData] = await connection.execute(`
      SELECT id, nick, name, username, email, full_name 
      FROM users 
      ORDER BY id
    `);
    
    console.log('Dados atuais:');
    console.table(currentData);
    
    // 2. Migrar dados das colunas antigas para as novas
    console.log('\n🔄 Migrando dados...');
    
    for (const user of currentData) {
      const updates = [];
      const values = [];
      
      // Migrar nick -> username (se username estiver vazio)
      if (user.nick && !user.username) {
        updates.push('username = ?');
        values.push(user.nick);
        console.log(`- Migrando nick "${user.nick}" -> username para usuário ID ${user.id}`);
      }
      
      // Migrar name -> full_name (se full_name estiver vazio)
      if (user.name && !user.full_name) {
        updates.push('full_name = ?');
        values.push(user.name);
        console.log(`- Migrando name "${user.name}" -> full_name para usuário ID ${user.id}`);
      }
      
      // Criar email padrão se não existir
      if (!user.email && user.nick) {
        const defaultEmail = `${user.nick}@sistema.com`;
        updates.push('email = ?');
        values.push(defaultEmail);
        console.log(`- Criando email padrão "${defaultEmail}" para usuário ID ${user.id}`);
      }
      
      // Executar atualizações se houver
      if (updates.length > 0) {
        values.push(user.id);
        await connection.execute(
          `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
      }
    }
    
    // 3. Verificar dados após migração
    console.log('\n📊 Verificando dados após migração...');
    const [migratedData] = await connection.execute(`
      SELECT id, nick, name, username, email, full_name 
      FROM users 
      ORDER BY id
    `);
    
    console.log('Dados após migração:');
    console.table(migratedData);
    
    console.log('\n✅ Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrateUserData().catch(console.error);