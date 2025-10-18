const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function setupAuth() {
  let connection;

  try {
    console.log('🔐 Configurando Sistema de Autenticação...\n');

    // Conectar ao banco
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance',
      multipleStatements: true
    });
    
    console.log('✅ Conectado ao banco de dados\n');
    
    // Ler arquivo SQL
    const sqlFile = path.join(__dirname, 'create-auth-tables.sql');
    let sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Gerar hash real da senha admin123
    const adminPassword = await bcrypt.hash('admin123', 10);
    console.log('🔑 Hash da senha admin gerado:', adminPassword.substring(0, 20) + '...\n');
    
    // Substituir o hash placeholder pelo hash real
    sql = sql.replace(
      /\$2b\$10\$rQZ9vXqZ9vXqZ9vXqZ9vXuO7K8Z9vXqZ9vXqZ9vXqZ9vXqZ9vXqZ9/g,
      adminPassword
    );
    
    // Executar SQL
    console.log('📊 Criando tabelas de autenticação...');
    await connection.query(sql);
    console.log('✅ Tabelas criadas com sucesso!\n');
    
    // Verificar estrutura criada
    console.log('🔍 Verificando estrutura criada:\n');
    
    const tables = [
      'users',
      'roles', 
      'modules',
      'permissions',
      'user_roles',
      'user_sessions',
      'access_logs'
    ];
    
    for (const table of tables) {
      const [rows] = await connection.query(
        `SELECT COUNT(*) as count FROM ${table}`
      );
      console.log(`   ✓ ${table.padEnd(20)} - ${rows[0].count} registros`);
    }
    
    console.log('\n📋 Dados iniciais criados:\n');
    
    // Listar módulos
    const [modules] = await connection.query('SELECT name, description FROM modules ORDER BY name');
    console.log('   Módulos do Sistema:');
    modules.forEach(m => {
      console.log(`   • ${m.name.padEnd(20)} - ${m.description}`);
    });
    
    console.log('\n   Perfis de Acesso:');
    const [roles] = await connection.query('SELECT name, description FROM roles ORDER BY name');
    roles.forEach(r => {
      console.log(`   • ${r.name.padEnd(20)} - ${r.description}`);
    });
    
    console.log('\n   Usuário Padrão:');
    const [users] = await connection.query(
      'SELECT username, email, full_name, is_admin FROM users WHERE username = "admin"'
    );
    if (users.length > 0) {
      const user = users[0];
      console.log(`   • Username: ${user.username}`);
      console.log(`   • Email: ${user.email}`);
      console.log(`   • Nome: ${user.full_name}`);
      console.log(`   • Senha: admin123`);
      console.log(`   • Admin: ${user.is_admin ? 'Sim' : 'Não'}`);
    }
    
    // Verificar permissões do admin
    const [perms] = await connection.query(`
      SELECT 
        m.name as module,
        p.can_view,
        p.can_create,
        p.can_edit,
        p.can_delete,
        p.can_export
      FROM permissions p
      JOIN roles r ON p.role_id = r.id
      JOIN modules m ON p.module_id = m.id
      WHERE r.name = 'admin'
      ORDER BY m.name
    `);
    
    console.log('\n   Permissões do Admin:');
    perms.forEach(p => {
      const actions = [];
      if (p.can_view) actions.push('Ver');
      if (p.can_create) actions.push('Criar');
      if (p.can_edit) actions.push('Editar');
      if (p.can_delete) actions.push('Excluir');
      if (p.can_export) actions.push('Exportar');
      console.log(`   • ${p.module.padEnd(20)} - ${actions.join(', ')}`);
    });
    
    console.log('\n✅ Sistema de autenticação configurado com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Implementar API de autenticação');
    console.log('   2. Criar componente de Login');
    console.log('   3. Proteger rotas com middleware');
    console.log('   4. Criar página de gerenciamento de usuários\n');
    
  } catch (error) {
    console.error('❌ Erro ao configurar autenticação:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupAuth();
