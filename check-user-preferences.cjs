const mysql = require('mysql2/promise');

async function checkUserPreferences() {
  let connection;

  try {
    console.log('🔍 Verificando tabela user_preferences...\n');

    // Conectar ao banco
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco de dados\n');
    
    // 1. Verificar se a tabela existe
    console.log('1. Verificando se a tabela user_preferences existe:');
    try {
      const [tables] = await connection.execute(
        "SHOW TABLES LIKE 'user_preferences'"
      );
      
      if (tables.length === 0) {
        console.log('❌ Tabela user_preferences não existe!');
        console.log('💡 Criando tabela user_preferences...\n');
        
        await connection.execute(`
          CREATE TABLE user_preferences (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            theme VARCHAR(20) DEFAULT 'light',
            language VARCHAR(10) DEFAULT 'pt-BR',
            notifications_enabled BOOLEAN DEFAULT TRUE,
            email_notifications BOOLEAN DEFAULT TRUE,
            dashboard_layout VARCHAR(20) DEFAULT 'default',
            items_per_page INT DEFAULT 25,
            timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
            primary_color VARCHAR(20) DEFAULT 'blue',
            interface_size VARCHAR(20) DEFAULT 'medium',
            border_radius VARCHAR(20) DEFAULT 'medium',
            show_animations BOOLEAN DEFAULT TRUE,
            compact_sidebar BOOLEAN DEFAULT FALSE,
            show_breadcrumbs BOOLEAN DEFAULT TRUE,
            high_contrast BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_user_preferences (user_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        console.log('✅ Tabela user_preferences criada com sucesso!');
      } else {
        console.log('✅ Tabela user_preferences existe');
      }
    } catch (error) {
      console.log('❌ Erro ao verificar/criar tabela:', error.message);
      return;
    }
    
    // 2. Verificar estrutura da tabela
    console.log('\n2. Verificando estrutura da tabela:');
    const [structure] = await connection.execute('DESCRIBE user_preferences');
    console.log('   Colunas:');
    structure.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // 3. Verificar dados existentes
    console.log('\n3. Verificando dados existentes:');
    const [preferences] = await connection.execute(
      'SELECT * FROM user_preferences LIMIT 5'
    );
    console.log(`   📊 Total de registros: ${preferences.length}`);
    preferences.forEach(pref => {
      console.log(`   - User ID: ${pref.user_id}, Theme: ${pref.theme}, Language: ${pref.language}`);
    });
    
    // 4. Criar preferências padrão para usuário admin se não existir
    console.log('\n4. Verificando preferências do usuário admin:');
    const [adminPrefs] = await connection.execute(
      'SELECT * FROM user_preferences WHERE user_id = 1'
    );
    
    if (adminPrefs.length === 0) {
      console.log('   ⚠️  Usuário admin não tem preferências. Criando...');
      await connection.execute(`
        INSERT INTO user_preferences (
          user_id, theme, language, notifications_enabled, email_notifications,
          dashboard_layout, items_per_page, timezone
        ) VALUES (1, 'light', 'pt-BR', TRUE, TRUE, 'default', 25, 'America/Sao_Paulo')
      `);
      console.log('   ✅ Preferências padrão criadas para usuário admin');
    } else {
      console.log('   ✅ Usuário admin já tem preferências configuradas');
    }
    
    console.log('\n🎯 Verificação completa!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkUserPreferences().catch(console.error);