const mysql = require('mysql2/promise');

async function createNotificationsTable() {
  let connection;
  
  try {
    console.log('🔍 Criando tabela notifications...\n');

    // Conectar diretamente ao banco de dados
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('✅ Conectado ao banco de dados');

    // Verificar se a tabela já existe
    const [tables] = await connection.execute("SHOW TABLES LIKE 'notifications'");
    
    if (tables.length > 0) {
      console.log('⚠️ Tabela notifications já existe');
      
      // Verificar estrutura
      const [structure] = await connection.execute('DESCRIBE notifications');
      console.log('📋 Estrutura atual:');
      structure.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
      });
      
    } else {
      console.log('📝 Criando tabela notifications...');
      
      // Criar tabela notifications
      await connection.execute(`
        CREATE TABLE notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          type ENUM('manutencao_preventiva', 'servico_atrasado', 'administrativo', 'info', 'warning', 'error', 'success') DEFAULT 'info',
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          read_status BOOLEAN DEFAULT FALSE,
          priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
          related_id INT NULL,
          related_type ENUM('equipment', 'service_order') NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_read_status (read_status),
          INDEX idx_created_at (created_at),
          INDEX idx_type (type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log('✅ Tabela notifications criada com sucesso');
    }

    // Inserir algumas notificações de teste
    console.log('\n📝 Inserindo notificações de teste...');
    
    const testNotifications = [
      {
        user_id: 1,
        type: 'info',
        title: 'Sistema Atualizado',
        message: 'O sistema foi atualizado com sucesso.',
        priority: 'low'
      },
      {
        user_id: 1,
        type: 'manutencao_preventiva',
        title: 'Manutenção Preventiva Agendada',
        message: 'Manutenção preventiva agendada para equipamento X.',
        priority: 'medium'
      },
      {
        user_id: 1,
        type: 'servico_atrasado',
        title: 'Serviço em Atraso',
        message: 'O serviço #123 está em atraso.',
        priority: 'high'
      }
    ];

    for (const notif of testNotifications) {
      await connection.execute(`
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (?, ?, ?, ?)
      `, [notif.user_id, notif.type, notif.title, notif.message]);
    }

    console.log('✅ Notificações de teste inseridas');

    // Verificar dados inseridos
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM notifications');
    console.log(`📊 Total de notificações: ${count[0].total}`);

    console.log('\n🎉 Tabela notifications configurada com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar
createNotificationsTable();