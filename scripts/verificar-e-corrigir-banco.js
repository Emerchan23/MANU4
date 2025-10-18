import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

async function verificarECorrigirBanco() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado com sucesso!\n');

    // ========== VERIFICAR E CORRIGIR TABELA USERS ==========
    console.log('📋 Verificando tabela USERS...');
    const [usersColumns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);
    
    console.log(`   Encontradas ${usersColumns.length} colunas`);
    
    const requiredUsersColumns = [
      { name: 'id', type: 'INT', nullable: 'NO', key: 'PRI' },
      { name: 'username', type: 'VARCHAR', nullable: 'NO' },
      { name: 'email', type: 'VARCHAR', nullable: 'NO' },
      { name: 'password_hash', type: 'VARCHAR', nullable: 'NO' },
      { name: 'full_name', type: 'VARCHAR', nullable: 'YES' },
      { name: 'is_active', type: 'TINYINT', nullable: 'YES' },
      { name: 'is_admin', type: 'TINYINT', nullable: 'YES' },
      { name: 'sector_id', type: 'INT', nullable: 'YES' },
      { name: 'created_at', type: 'TIMESTAMP', nullable: 'YES' },
      { name: 'updated_at', type: 'TIMESTAMP', nullable: 'YES' },
      { name: 'last_login', type: 'DATETIME', nullable: 'YES' }
    ];

    // ========== VERIFICAR E CORRIGIR TABELA EQUIPMENT ==========
    console.log('\n📋 Verificando tabela EQUIPMENT...');
    const [equipmentColumns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'equipment'
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);
    
    console.log(`   Encontradas ${equipmentColumns.length} colunas`);

    const requiredEquipmentColumns = [
      'id', 'name', 'patrimonio', 'category_id', 'sector_id', 'subsector_id',
      'company_id', 'manufacturer', 'model', 'serial_number', 'acquisition_date',
      'warranty_expiry', 'status', 'location', 'voltage', 'power', 'observations',
      'next_preventive_maintenance', 'last_preventive_maintenance', 'maintenance_frequency',
      'created_at', 'updated_at'
    ];

    const existingEquipmentCols = equipmentColumns.map(col => col.COLUMN_NAME);
    const missingEquipmentCols = requiredEquipmentColumns.filter(col => !existingEquipmentCols.includes(col));
    
    if (missingEquipmentCols.length > 0) {
      console.log(`   ⚠️  Colunas faltando: ${missingEquipmentCols.join(', ')}`);
      
      for (const col of missingEquipmentCols) {
        let alterQuery = '';
        switch(col) {
          case 'patrimonio':
            alterQuery = 'ALTER TABLE equipment ADD COLUMN patrimonio VARCHAR(100) NULL AFTER name';
            break;
          case 'voltage':
            alterQuery = 'ALTER TABLE equipment ADD COLUMN voltage VARCHAR(50) NULL';
            break;
          case 'power':
            alterQuery = 'ALTER TABLE equipment ADD COLUMN power VARCHAR(50) NULL';
            break;
          case 'next_preventive_maintenance':
            alterQuery = 'ALTER TABLE equipment ADD COLUMN next_preventive_maintenance DATE NULL';
            break;
          case 'last_preventive_maintenance':
            alterQuery = 'ALTER TABLE equipment ADD COLUMN last_preventive_maintenance DATE NULL';
            break;
          case 'maintenance_frequency':
            alterQuery = 'ALTER TABLE equipment ADD COLUMN maintenance_frequency INT NULL COMMENT "Frequência em dias"';
            break;
        }
        
        if (alterQuery) {
          await connection.query(alterQuery);
          console.log(`   ✅ Coluna ${col} adicionada`);
        }
      }
    } else {
      console.log('   ✅ Todas as colunas necessárias existem');
    }

    // ========== VERIFICAR E CORRIGIR TABELA SERVICE_ORDERS ==========
    console.log('\n📋 Verificando tabela SERVICE_ORDERS...');
    const [serviceOrdersColumns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'service_orders'
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);
    
    console.log(`   Encontradas ${serviceOrdersColumns.length} colunas`);

    const requiredServiceOrdersColumns = [
      'id', 'order_number', 'equipment_id', 'company_id', 'description', 'priority',
      'status', 'type', 'requested_date', 'scheduled_date', 'completion_date',
      'warranty_days', 'warranty_expiry', 'cost', 'observations', 'created_by',
      'assigned_to', 'maintenance_type_id', 'created_at', 'updated_at'
    ];

    const existingServiceOrdersCols = serviceOrdersColumns.map(col => col.COLUMN_NAME);
    const missingServiceOrdersCols = requiredServiceOrdersColumns.filter(col => !existingServiceOrdersCols.includes(col));
    
    if (missingServiceOrdersCols.length > 0) {
      console.log(`   ⚠️  Colunas faltando: ${missingServiceOrdersCols.join(', ')}`);
      
      for (const col of missingServiceOrdersCols) {
        let alterQuery = '';
        switch(col) {
          case 'type':
            alterQuery = "ALTER TABLE service_orders ADD COLUMN type ENUM('PREVENTIVA', 'CORRETIVA', 'PREDITIVA') DEFAULT 'CORRETIVA'";
            break;
          case 'warranty_days':
            alterQuery = 'ALTER TABLE service_orders ADD COLUMN warranty_days INT DEFAULT 0';
            break;
          case 'warranty_expiry':
            alterQuery = 'ALTER TABLE service_orders ADD COLUMN warranty_expiry DATE NULL';
            break;
          case 'maintenance_type_id':
            alterQuery = 'ALTER TABLE service_orders ADD COLUMN maintenance_type_id INT NULL';
            break;
        }
        
        if (alterQuery) {
          await connection.query(alterQuery);
          console.log(`   ✅ Coluna ${col} adicionada`);
        }
      }
    } else {
      console.log('   ✅ Todas as colunas necessárias existem');
    }

    // ========== VERIFICAR E CORRIGIR TABELA NOTIFICATIONS ==========
    console.log('\n📋 Verificando tabela NOTIFICATIONS...');
    const [notificationsExists] = await connection.query(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'notifications'
    `, [dbConfig.database]);

    if (notificationsExists[0].count === 0) {
      console.log('   ⚠️  Tabela não existe. Criando...');
      await connection.query(`
        CREATE TABLE notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type ENUM('info', 'warning', 'error', 'success', 'manutencao_proxima', 'garantia_vencendo', 'servico_atrasado') DEFAULT 'info',
          related_id INT NULL,
          related_type VARCHAR(50) NULL,
          is_read TINYINT(1) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          read_at DATETIME NULL,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_read (user_id, is_read),
          INDEX idx_created (created_at),
          INDEX idx_type (type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('   ✅ Tabela notifications criada');
    } else {
      console.log('   ✅ Tabela existe');
    }

    // ========== VERIFICAR E CORRIGIR TABELA MAINTENANCE_TYPES ==========
    console.log('\n📋 Verificando tabela MAINTENANCE_TYPES...');
    const [maintenanceTypesExists] = await connection.query(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'maintenance_types'
    `, [dbConfig.database]);

    if (maintenanceTypesExists[0].count === 0) {
      console.log('   ⚠️  Tabela não existe. Criando...');
      await connection.query(`
        CREATE TABLE maintenance_types (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT NULL,
          category ENUM('PREVENTIVA', 'CORRETIVA', 'PREDITIVA') NOT NULL,
          frequency_days INT NULL COMMENT 'Frequência padrão em dias',
          is_active TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_name (name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('   ✅ Tabela maintenance_types criada');
      
      // Inserir tipos padrão
      await connection.query(`
        INSERT INTO maintenance_types (name, description, category, frequency_days) VALUES
        ('Limpeza Geral', 'Limpeza e higienização do equipamento', 'PREVENTIVA', 30),
        ('Calibração', 'Calibração de instrumentos e equipamentos', 'PREVENTIVA', 90),
        ('Troca de Filtros', 'Substituição de filtros', 'PREVENTIVA', 60),
        ('Lubrificação', 'Lubrificação de partes móveis', 'PREVENTIVA', 30),
        ('Inspeção Visual', 'Inspeção visual de componentes', 'PREVENTIVA', 15),
        ('Reparo Emergencial', 'Reparo de falha inesperada', 'CORRETIVA', NULL),
        ('Substituição de Peças', 'Troca de componentes danificados', 'CORRETIVA', NULL),
        ('Análise Preditiva', 'Análise de condição do equipamento', 'PREDITIVA', 60)
      `);
      console.log('   ✅ Tipos de manutenção padrão inseridos');
    } else {
      console.log('   ✅ Tabela existe');
    }

    // ========== VERIFICAR E CORRIGIR TABELA SYSTEM_SETTINGS ==========
    console.log('\n📋 Verificando tabela SYSTEM_SETTINGS...');
    const [systemSettingsExists] = await connection.query(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'system_settings'
    `, [dbConfig.database]);

    if (systemSettingsExists[0].count === 0) {
      console.log('   ⚠️  Tabela não existe. Criando...');
      await connection.query(`
        CREATE TABLE system_settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          setting_key VARCHAR(100) NOT NULL UNIQUE,
          setting_value TEXT NULL,
          setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
          category VARCHAR(50) NOT NULL COMMENT 'geral, notificacoes, empresa, etc',
          description TEXT NULL,
          is_locked TINYINT(1) DEFAULT 0 COMMENT 'Se true, não pode ser editado pela interface',
          updated_by INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
          INDEX idx_category (category),
          INDEX idx_key (setting_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('   ✅ Tabela system_settings criada');
      
      // Inserir configurações padrão
      await connection.query(`
        INSERT INTO system_settings (setting_key, setting_value, setting_type, category, description) VALUES
        ('company_name', 'Hospital Maintenance', 'string', 'empresa', 'Nome da empresa'),
        ('company_cnpj', '', 'string', 'empresa', 'CNPJ da empresa'),
        ('company_address', '', 'string', 'empresa', 'Endereço da empresa'),
        ('company_phone', '', 'string', 'empresa', 'Telefone da empresa'),
        ('company_email', '', 'string', 'empresa', 'Email da empresa'),
        ('notification_maintenance_days', '7', 'number', 'notificacoes', 'Dias de antecedência para alertar manutenção'),
        ('notification_warranty_days', '30', 'number', 'notificacoes', 'Dias de antecedência para alertar vencimento de garantia'),
        ('notification_enabled', 'true', 'boolean', 'notificacoes', 'Notificações habilitadas'),
        ('system_language', 'pt-BR', 'string', 'geral', 'Idioma do sistema'),
        ('system_timezone', 'America/Sao_Paulo', 'string', 'geral', 'Fuso horário do sistema')
      `);
      console.log('   ✅ Configurações padrão inseridas');
    } else {
      console.log('   ✅ Tabela existe');
    }

    // ========== VERIFICAR E CORRIGIR TABELA COMPANIES ==========
    console.log('\n📋 Verificando tabela COMPANIES...');
    const [companiesColumns] = await connection.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'companies'
    `, [dbConfig.database]);
    
    const existingCompaniesCols = companiesColumns.map(col => col.COLUMN_NAME);
    const requiredCompaniesCols = ['id', 'name', 'cnpj', 'address', 'phone', 'email', 'contract_start', 'contract_end', 'is_active', 'created_at', 'updated_at'];
    const missingCompaniesCols = requiredCompaniesCols.filter(col => !existingCompaniesCols.includes(col));
    
    if (missingCompaniesCols.length > 0) {
      console.log(`   ⚠️  Colunas faltando: ${missingCompaniesCols.join(', ')}`);
      
      for (const col of missingCompaniesCols) {
        let alterQuery = '';
        switch(col) {
          case 'contract_start':
            alterQuery = 'ALTER TABLE companies ADD COLUMN contract_start DATE NULL';
            break;
          case 'contract_end':
            alterQuery = 'ALTER TABLE companies ADD COLUMN contract_end DATE NULL';
            break;
          case 'is_active':
            alterQuery = 'ALTER TABLE companies ADD COLUMN is_active TINYINT(1) DEFAULT 1';
            break;
        }
        
        if (alterQuery) {
          await connection.query(alterQuery);
          console.log(`   ✅ Coluna ${col} adicionada`);
        }
      }
    } else {
      console.log('   ✅ Todas as colunas necessárias existem');
    }

    // ========== VERIFICAR E CORRIGIR TABELA SECTORS ==========
    console.log('\n📋 Verificando tabela SECTORS...');
    const [sectorsExists] = await connection.query(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sectors'
    `, [dbConfig.database]);

    if (sectorsExists[0].count === 0) {
      console.log('   ⚠️  Tabela não existe. Criando...');
      await connection.query(`
        CREATE TABLE sectors (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT NULL,
          company_id INT NULL,
          is_active TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
          INDEX idx_company (company_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('   ✅ Tabela sectors criada');
    } else {
      console.log('   ✅ Tabela existe');
    }

    // ========== VERIFICAR E CORRIGIR TABELA CATEGORIES ==========
    console.log('\n📋 Verificando tabela CATEGORIES...');
    const [categoriesExists] = await connection.query(`
      SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'categories'
    `, [dbConfig.database]);

    if (categoriesExists[0].count === 0) {
      console.log('   ⚠️  Tabela não existe. Criando...');
      await connection.query(`
        CREATE TABLE categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT NULL,
          is_active TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('   ✅ Tabela categories criada');
    } else {
      console.log('   ✅ Tabela existe');
    }

    // ========== RESUMO FINAL ==========
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA VERIFICAÇÃO');
    console.log('='.repeat(60));
    
    const [tables] = await connection.query(`
      SELECT TABLE_NAME, TABLE_ROWS 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [dbConfig.database]);
    
    console.log('\n📋 Tabelas no banco de dados:');
    tables.forEach(table => {
      console.log(`   - ${table.TABLE_NAME}: ${table.TABLE_ROWS} registros`);
    });
    
    console.log('\n✅ Verificação e correção concluídas com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão com o banco de dados encerrada.');
    }
  }
}

verificarECorrigirBanco();
