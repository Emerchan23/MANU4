const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function executeSQLDirect() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados MariaDB');
    
    // 1. Criar tabela maintenance_types
    console.log('\n1. Criando tabela maintenance_types...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS maintenance_types (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT NULL,
          category ENUM('preventiva', 'corretiva', 'calibracao', 'instalacao', 'desinstalacao', 'consultoria') NOT NULL DEFAULT 'preventiva',
          isActive TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_name (name),
          INDEX idx_category (category),
          INDEX idx_is_active (isActive)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela maintenance_types criada');
    
    // 2. Inserir dados iniciais
    console.log('\n2. Inserindo dados iniciais...');
    await connection.execute(`
      INSERT IGNORE INTO maintenance_types (name, description, category, isActive) VALUES
      ('Preventiva', 'Manutenção preventiva regular', 'preventiva', 1),
      ('Corretiva', 'Manutenção corretiva para reparos', 'corretiva', 1),
      ('Calibração', 'Calibração de equipamentos', 'calibracao', 1),
      ('Instalação', 'Instalação de novos equipamentos', 'instalacao', 1),
      ('Desinstalação', 'Remoção de equipamentos', 'desinstalacao', 1),
      ('Consultoria', 'Serviços de consultoria técnica', 'consultoria', 1)
    `);
    console.log('✅ Dados iniciais inseridos');
    
    // 3. Verificar se a chave estrangeira já existe
    console.log('\n3. Verificando chave estrangeira...');
    const [existingFK] = await connection.execute(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'service_orders' 
        AND COLUMN_NAME = 'maintenance_type_id'
        AND REFERENCED_TABLE_NAME = 'maintenance_types'
    `);
    
    if (existingFK.length === 0) {
      console.log('Adicionando chave estrangeira...');
      await connection.execute(`
        ALTER TABLE service_orders 
        ADD CONSTRAINT fk_service_orders_maintenance_type 
        FOREIGN KEY (maintenance_type_id) REFERENCES maintenance_types(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
      `);
      console.log('✅ Chave estrangeira adicionada');
    } else {
      console.log('⚠️  Chave estrangeira já existe');
    }
    
    // 4. Verificar resultado
    console.log('\n4. Verificando resultado...');
    const [types] = await connection.execute('SELECT id, name, category, isActive FROM maintenance_types');
    console.log(`✅ Tabela maintenance_types: ${types.length} registros`);
    
    console.log('Tipos de manutenção disponíveis:');
    types.forEach(type => {
      console.log(`  - ID: ${type.id}, Nome: ${type.name}, Categoria: ${type.category}, Ativo: ${type.isActive ? 'Sim' : 'Não'}`);
    });
    
    // 5. Verificar chave estrangeira final
    const [finalFK] = await connection.execute(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'service_orders' 
        AND COLUMN_NAME = 'maintenance_type_id'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    if (finalFK.length > 0) {
      console.log('✅ Chave estrangeira configurada corretamente');
      finalFK.forEach(fk => {
        console.log(`  - ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });
    } else {
      console.log('❌ Chave estrangeira não encontrada');
    }
    
    console.log('\n🎉 Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a execução:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

executeSQLDirect();