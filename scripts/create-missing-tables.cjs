const mysql = require('mysql2/promise');

async function createMissingTables() {
  let connection;
  
  try {
    console.log('🔍 Criando tabelas faltantes para notificações...\n');

    // Conectar ao banco de dados
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('✅ Conectado ao banco de dados');

    // 1. Criar tabela push_subscriptions
    console.log('\n📝 Criando tabela push_subscriptions...');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          endpoint TEXT NOT NULL,
          p256dh_key TEXT NOT NULL,
          auth_key TEXT NOT NULL,
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_push_subscriptions_user_id (user_id),
          INDEX idx_push_subscriptions_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Tabela push_subscriptions criada com sucesso');
    } catch (error) {
      console.log(`⚠️  Erro ao criar push_subscriptions: ${error.message}`);
    }

    // 2. Criar tabela notification_settings
    console.log('\n📝 Criando tabela notification_settings...');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS notification_settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          notification_type ENUM('equipment_alert', 'maintenance_due', 'service_order_update', 'system_alert') NOT NULL,
          enabled BOOLEAN DEFAULT TRUE,
          push_enabled BOOLEAN DEFAULT TRUE,
          email_enabled BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_user_notification_type (user_id, notification_type),
          INDEX idx_notification_settings_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Tabela notification_settings criada com sucesso');
    } catch (error) {
      console.log(`⚠️  Erro ao criar notification_settings: ${error.message}`);
    }

    // 3. Adicionar coluna is_read na tabela notifications se não existir
    console.log('\n📝 Verificando coluna is_read na tabela notifications...');
    try {
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'hospital_maintenance' 
        AND TABLE_NAME = 'notifications' 
        AND COLUMN_NAME = 'is_read'
      `);
      
      if (columns.length === 0) {
        await connection.execute(`
          ALTER TABLE notifications 
          ADD COLUMN is_read BOOLEAN DEFAULT FALSE AFTER read_status
        `);
        console.log('✅ Coluna is_read adicionada à tabela notifications');
      } else {
        console.log('✅ Coluna is_read já existe na tabela notifications');
      }
    } catch (error) {
      console.log(`⚠️  Erro ao adicionar coluna is_read: ${error.message}`);
    }

    // 4. Inserir configurações padrão para usuários existentes
    console.log('\n📝 Inserindo configurações padrão...');
    try {
      await connection.execute(`
        INSERT IGNORE INTO notification_settings (user_id, notification_type, enabled, push_enabled, email_enabled)
        SELECT u.id, 'equipment_alert', TRUE, TRUE, FALSE
        FROM users u
        WHERE NOT EXISTS (
          SELECT 1 FROM notification_settings ns 
          WHERE ns.user_id = u.id AND ns.notification_type = 'equipment_alert'
        )
      `);

      await connection.execute(`
        INSERT IGNORE INTO notification_settings (user_id, notification_type, enabled, push_enabled, email_enabled)
        SELECT u.id, 'maintenance_due', TRUE, TRUE, FALSE
        FROM users u
        WHERE NOT EXISTS (
          SELECT 1 FROM notification_settings ns 
          WHERE ns.user_id = u.id AND ns.notification_type = 'maintenance_due'
        )
      `);

      await connection.execute(`
        INSERT IGNORE INTO notification_settings (user_id, notification_type, enabled, push_enabled, email_enabled)
        SELECT u.id, 'service_order_update', TRUE, TRUE, FALSE
        FROM users u
        WHERE NOT EXISTS (
          SELECT 1 FROM notification_settings ns 
          WHERE ns.user_id = u.id AND ns.notification_type = 'service_order_update'
        )
      `);

      await connection.execute(`
        INSERT IGNORE INTO notification_settings (user_id, notification_type, enabled, push_enabled, email_enabled)
        SELECT u.id, 'system_alert', TRUE, TRUE, FALSE
        FROM users u
        WHERE NOT EXISTS (
          SELECT 1 FROM notification_settings ns 
          WHERE ns.user_id = u.id AND ns.notification_type = 'system_alert'
        )
      `);

      console.log('✅ Configurações padrão inseridas');
    } catch (error) {
      console.log(`⚠️  Erro ao inserir configurações padrão: ${error.message}`);
    }

    // 5. Verificar se as tabelas foram criadas
    console.log('\n🔍 Verificando tabelas criadas...');
    
    const tables = ['notifications', 'push_subscriptions', 'notification_settings'];
    for (const table of tables) {
      try {
        const [rows] = await connection.execute(`SHOW TABLES LIKE '${table}'`);
        if (rows.length > 0) {
          console.log(`✅ Tabela '${table}' existe`);
          
          // Contar registros
          const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
          console.log(`   Registros: ${count[0].count}`);
        } else {
          console.log(`❌ Tabela '${table}' não existe`);
        }
      } catch (error) {
        console.log(`❌ Erro ao verificar tabela '${table}': ${error.message}`);
      }
    }

    console.log('\n🎉 Criação de tabelas faltantes concluída!');

  } catch (error) {
    console.error('❌ Erro durante a criação:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar a criação
createMissingTables();