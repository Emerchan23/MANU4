const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupRodaSistema() {
  let connection;

  try {
    console.log('🔄 Iniciando configuração do RODA SISTEMA...\n');
    console.log('📅 Configurando formato de data brasileiro (dd/mm/aaaa)\n');

    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance',
      multipleStatements: true,
      timezone: '-03:00', // Timezone de Brasília (UTC-3)
    });

    console.log('✅ Conectado ao banco de dados\n');

    // Set timezone for this session
    await connection.query("SET time_zone = '-03:00'");
    console.log('✅ Timezone configurado para America/Sao_Paulo (UTC-3)\n');

    // Create wheel_states table
    console.log('📋 Criando tabela wheel_states...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS wheel_states (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        direction ENUM('clockwise', 'counterclockwise', 'stopped') DEFAULT 'stopped',
        speed ENUM('slow', 'medium', 'fast', 'custom') DEFAULT 'medium',
        custom_speed INT DEFAULT 60,
        angle DECIMAL(10, 2) DEFAULT 0,
        is_active BOOLEAN DEFAULT FALSE,
        created_by INT,
        updated_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_name (name),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela wheel_states criada\n');

    // Create rotation_logs table
    console.log('📋 Criando tabela rotation_logs...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS rotation_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        wheel_id INT NOT NULL,
        action ENUM('start', 'stop', 'speed_change', 'direction_change', 'create', 'update') NOT NULL,
        user_id INT,
        details TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wheel_id) REFERENCES wheel_states(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_wheel_id (wheel_id),
        INDEX idx_timestamp (timestamp),
        INDEX idx_action (action)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela rotation_logs criada\n');

    // Insert default wheel state
    console.log('📝 Inserindo estado de roda padrão...');
    const [existingWheels] = await connection.query(
      'SELECT id FROM wheel_states WHERE name = ?',
      ['Sistema de Rotação Principal']
    );

    if (existingWheels.length === 0) {
      await connection.query(`
        INSERT INTO wheel_states (name, direction, speed, custom_speed, angle, is_active)
        VALUES ('Sistema de Rotação Principal', 'stopped', 'medium', 60, 0, FALSE)
      `);
      console.log('✅ Estado de roda padrão inserido\n');
    } else {
      console.log('ℹ️  Estado de roda padrão já existe\n');
    }

    // Create view for wheel statistics
    console.log('📊 Criando view de estatísticas...');
    await connection.query(`
      CREATE OR REPLACE VIEW v_wheel_statistics AS
      SELECT 
        ws.id,
        ws.name,
        ws.direction,
        ws.speed,
        ws.custom_speed,
        ws.is_active,
        COUNT(rl.id) as total_operations,
        MAX(rl.timestamp) as last_operation,
        SUM(CASE WHEN rl.action = 'start' THEN 1 ELSE 0 END) as start_count,
        SUM(CASE WHEN rl.action = 'stop' THEN 1 ELSE 0 END) as stop_count,
        SUM(CASE WHEN rl.action = 'speed_change' THEN 1 ELSE 0 END) as speed_changes,
        SUM(CASE WHEN rl.action = 'direction_change' THEN 1 ELSE 0 END) as direction_changes
      FROM wheel_states ws
      LEFT JOIN rotation_logs rl ON ws.id = rl.wheel_id
      GROUP BY ws.id, ws.name, ws.direction, ws.speed, ws.custom_speed, ws.is_active
    `);
    console.log('✅ View de estatísticas criada\n');

    // Create date formatting functions
    console.log('📅 Criando funções de formatação de data brasileira...');
    
    // Drop functions if they exist
    await connection.query('DROP FUNCTION IF EXISTS format_date_br');
    await connection.query('DROP FUNCTION IF EXISTS format_date_only_br');
    
    // Create format_date_br function
    await connection.query(`
      CREATE FUNCTION format_date_br(input_date DATETIME)
      RETURNS VARCHAR(20)
      DETERMINISTIC
      BEGIN
        RETURN DATE_FORMAT(input_date, '%d/%m/%Y %H:%i:%s');
      END
    `);
    
    // Create format_date_only_br function
    await connection.query(`
      CREATE FUNCTION format_date_only_br(input_date DATE)
      RETURNS VARCHAR(10)
      DETERMINISTIC
      BEGIN
        RETURN DATE_FORMAT(input_date, '%d/%m/%Y');
      END
    `);
    
    console.log('✅ Funções de formatação criadas\n');

    // Verify tables
    console.log('🔍 Verificando tabelas criadas...');
    const [wheelStates] = await connection.query('SELECT COUNT(*) as count FROM wheel_states');
    const [rotationLogs] = await connection.query('SELECT COUNT(*) as count FROM rotation_logs');

    console.log(`   - wheel_states: ${wheelStates[0].count} registros`);
    console.log(`   - rotation_logs: ${rotationLogs[0].count} registros\n`);

    // Test date formatting
    console.log('🧪 Testando formatação de data...');
    const [testDate] = await connection.query(`
      SELECT 
        NOW() as data_original,
        format_date_br(NOW()) as data_formatada_br,
        DATE_FORMAT(NOW(), '%d/%m/%Y %H:%i:%s') as data_mysql_format
    `);
    console.log(`   Data original: ${testDate[0].data_original}`);
    console.log(`   Data formatada BR: ${testDate[0].data_formatada_br}`);
    console.log(`   Data MySQL format: ${testDate[0].data_mysql_format}\n`);

    console.log('✅ RODA SISTEMA configurado com sucesso!\n');
    console.log('📌 Formato de Data Configurado:');
    console.log('   - Timezone: America/Sao_Paulo (UTC-3)');
    console.log('   - Formato de exibição: dd/mm/aaaa HH:mm:ss');
    console.log('   - Armazenamento: TIMESTAMP (UTC no banco)\n');
    console.log('📌 Próximos passos:');
    console.log('   1. Acesse /roda-sistema para visualizar o sistema');
    console.log('   2. Use os controles para iniciar/parar a rotação');
    console.log('   3. Ajuste velocidade e direção conforme necessário');
    console.log('   4. Monitore logs e estatísticas em tempo real');
    console.log('   5. Todas as datas serão exibidas no formato brasileiro\n');

  } catch (error) {
    console.error('❌ Erro ao configurar RODA SISTEMA:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão com banco de dados encerrada');
    }
  }
}

// Run the setup
setupRodaSistema().catch(console.error);
