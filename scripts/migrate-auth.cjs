const mysql = require('mysql2/promise');
const crypto = require('crypto');

// Função simples para hash de senha
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function migrateAuth() {
  let connection;

  try {
    console.log('🔐 Migrando Sistema de Autenticação...\n');

    // Conectar ao banco
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance',
      multipleStatements: true
    });

    console.log('✅ Conectado ao banco de dados\n');

    // 1. Verificar e adicionar colunas na tabela users
    console.log('📊 Verificando estrutura da tabela users...');

    const [columns] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = 'hospital_maintenance' AND TABLE_NAME = 'users'`
    );

    const existingColumns = columns.map(c => c.COLUMN_NAME);
    console.log('   Colunas existentes:', existingColumns.join(', '));

    // Adicionar colunas faltantes (adaptado à estrutura existente)
    const columnsToAdd = [
      { name: 'username', sql: 'ADD COLUMN username VARCHAR(50) UNIQUE AFTER id', check: true },
      { name: 'email', sql: 'ADD COLUMN email VARCHAR(100) UNIQUE AFTER username', check: true },
      { name: 'password_hash', sql: 'ADD COLUMN password_hash VARCHAR(255) AFTER password', check: true },
      { name: 'full_name', sql: 'ADD COLUMN full_name VARCHAR(100) AFTER password_hash', check: true },
      { name: 'is_active', sql: 'ADD COLUMN is_active BOOLEAN DEFAULT TRUE AFTER full_name', check: true },
      { name: 'is_admin', sql: 'ADD COLUMN is_admin BOOLEAN DEFAULT FALSE AFTER is_active', check: true },
      { name: 'last_login', sql: 'ADD COLUMN last_login TIMESTAMP NULL AFTER is_admin', check: true }
    ];

    for (const col of columnsToAdd) {
      if (!existingColumns.includes(col.name)) {
        console.log(`   ➕ Adicionando coluna ${col.name}...`);
        await connection.query(`ALTER TABLE users ${col.sql}`);
      } else {
        console.log(`   ✓ Coluna ${col.name} já existe`);
      }
    }
    
    // 2. Criar tabelas novas
    console.log('\n📊 Criando tabelas de autenticação...\n');
    
    // Tabela de Perfis/Roles
    await connection.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✓ Tabela roles criada');
    
    // Tabela de Módulos
    await connection.query(`
      CREATE TABLE IF NOT EXISTS modules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT,
        route VARCHAR(100),
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✓ Tabela modules criada');
    
    // Tabela de Permissões
    await connection.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_id INT NOT NULL,
        module_id INT NOT NULL,
        can_view BOOLEAN DEFAULT FALSE,
        can_create BOOLEAN DEFAULT FALSE,
        can_edit BOOLEAN DEFAULT FALSE,
        can_delete BOOLEAN DEFAULT FALSE,
        can_export BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
        UNIQUE KEY unique_role_module (role_id, module_id),
        INDEX idx_role_id (role_id),
        INDEX idx_module_id (module_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✓ Tabela permissions criada');
    
    // Tabela de Relacionamento Usuário-Role
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        role_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_role (user_id, role_id),
        INDEX idx_user_id (user_id),
        INDEX idx_role_id (role_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✓ Tabela user_roles criada');
    
    // Tabela de Sessões
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(500) UNIQUE NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_token (token),
        INDEX idx_user_id (user_id),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✓ Tabela user_sessions criada');
    
    // Tabela de Logs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS access_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        action VARCHAR(50) NOT NULL,
        module VARCHAR(50),
        ip_address VARCHAR(45),
        user_agent TEXT,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_action (action),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✓ Tabela access_logs criada');
    
    // 3. Inserir dados iniciais
    console.log('\n📝 Inserindo dados iniciais...\n');
    
    // Módulos
    await connection.query(`
      INSERT IGNORE INTO modules (name, description, route, icon) VALUES
      ('dashboard', 'Dashboard Principal', '/dashboard', 'LayoutDashboard'),
      ('equipments', 'Gestão de Equipamentos', '/equipments', 'Wrench'),
      ('service-orders', 'Ordens de Serviço', '/service-orders', 'ClipboardList'),
      ('preventive', 'Manutenção Preventiva', '/preventive', 'Calendar'),
      ('corrective', 'Manutenção Corretiva', '/corrective', 'AlertTriangle'),
      ('predictive', 'Manutenção Preditiva', '/predictive', 'TrendingUp'),
      ('users', 'Gestão de Usuários', '/users', 'Users'),
      ('settings', 'Configurações', '/settings', 'Settings')
    `);
    console.log('   ✓ Módulos inseridos');
    
    // Roles
    await connection.query(`
      INSERT IGNORE INTO roles (name, description) VALUES
      ('admin', 'Administrador - Acesso total ao sistema'),
      ('manager', 'Gerente - Acesso a relatórios e aprovações'),
      ('technician', 'Técnico - Execução de manutenções'),
      ('viewer', 'Visualizador - Apenas leitura')
    `);
    console.log('   ✓ Perfis inseridos');
    
    // Permissões para ADMIN
    await connection.query(`
      INSERT IGNORE INTO permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, can_export)
      SELECT r.id, m.id, TRUE, TRUE, TRUE, TRUE, TRUE
      FROM roles r
      CROSS JOIN modules m
      WHERE r.name = 'admin'
    `);
    console.log('   ✓ Permissões do admin configuradas');
    
    // 4. Atualizar usuário existente ou criar admin
    const [existingUsers] = await connection.query('SELECT id, email FROM users LIMIT 1');

    if (existingUsers.length > 0) {
      const user = existingUsers[0];
      const adminPassword = hashPassword('admin123');

      // Atualizar usuário existente
      await connection.query(`
        UPDATE users
        SET username = 'admin',
            email = 'admin@sistema.com',
            password_hash = ?,
            full_name = 'Administrador do Sistema',
            is_active = TRUE,
            is_admin = TRUE
        WHERE id = ?
      `, [adminPassword, user.id]);

      console.log(`   ✓ Usuário existente (ID: ${user.id}) atualizado para admin`);
      console.log(`   🔑 Hash da senha: ${adminPassword.substring(0, 20)}...`);

      // Associar ao perfil admin
      await connection.query(`
        INSERT IGNORE INTO user_roles (user_id, role_id)
        SELECT ?, r.id FROM roles r WHERE r.name = 'admin'
      `, [user.id]);

    } else {
      // Criar novo usuário admin
      const adminPassword = hashPassword('admin123');

      const [result] = await connection.query(`
        INSERT INTO users (username, email, password_hash, full_name, is_admin, is_active)
        VALUES ('admin', 'admin@sistema.com', ?, 'Administrador do Sistema', TRUE, TRUE)
      `, [adminPassword]);

      const userId = result.insertId;
      console.log(`   ✓ Usuário admin criado (ID: ${userId})`);
      console.log(`   🔑 Hash da senha: ${adminPassword.substring(0, 20)}...`);

      // Associar ao perfil admin
      await connection.query(`
        INSERT INTO user_roles (user_id, role_id)
        SELECT ?, r.id FROM roles r WHERE r.name = 'admin'
      `, [userId]);
    }
    
    // 5. Verificar resultado
    console.log('\n🔍 Verificando estrutura criada:\n');
    
    const tables = ['users', 'roles', 'modules', 'permissions', 'user_roles', 'user_sessions', 'access_logs'];
    
    for (const table of tables) {
      const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`   ✓ ${table.padEnd(20)} - ${rows[0].count} registros`);
    }
    
    console.log('\n✅ Migração concluída com sucesso!');
    console.log('\n📝 Credenciais de acesso:');
    console.log('   • Username: admin');
    console.log('   • Senha: admin123\n');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrateAuth();
