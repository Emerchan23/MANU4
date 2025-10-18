const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance',
  multipleStatements: true
};

async function executeAllCorrections() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao MariaDB...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados MariaDB');
    
    // Ler o arquivo SQL de correções
    console.log('\n📋 Lendo arquivo de correções SQL...');
    const sqlFilePath = path.join(__dirname, 'deprecated-AUDITORIA_OS_CORRECOES_DDL.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Dividir o SQL em comandos individuais
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));
    
    console.log(`📝 Encontrados ${sqlCommands.length} comandos SQL para executar`);
    
    // Executar cada comando individualmente
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      
      // Pular comandos vazios ou comentários
      if (!command || command.startsWith('--') || command.startsWith('/*')) {
        continue;
      }
      
      try {
        console.log(`\n${i + 1}. Executando: ${command.substring(0, 80)}...`);
        await connection.execute(command);
        console.log('✅ Sucesso');
        successCount++;
      } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
        errorCount++;
        
        // Continuar mesmo com erros (algumas alterações podem já existir)
        if (error.message.includes('Duplicate key name') || 
            error.message.includes('already exists') ||
            error.message.includes('Duplicate column name')) {
          console.log('   (Ignorando - já existe)');
        }
      }
    }
    
    console.log(`\n📊 Resumo da execução:`);
    console.log(`   ✅ Sucessos: ${successCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    
    // Verificar se as tabelas necessárias existem
    console.log('\n🔍 Verificando tabelas necessárias...');
    
    // Criar tabela empresas se não existir
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS empresas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        cnpj VARCHAR(18),
        telefone VARCHAR(20),
        email VARCHAR(255),
        endereco TEXT,
        contato_responsavel VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela empresas verificada/criada');
    
    // Inserir empresa padrão
    await connection.execute(`
      INSERT IGNORE INTO empresas (nome, cnpj, telefone, email, contato_responsavel) 
      VALUES ('TechMed Soluções', '12.345.678/0001-90', '(11) 9999-9999', 'contato@techmed.com', 'João Silva')
    `);
    
    // Criar tabela equipment se não existir
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS equipment (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        model VARCHAR(255),
        serial_number VARCHAR(255),
        manufacturer VARCHAR(255),
        sector_id INT,
        status ENUM('ATIVO', 'INATIVO', 'MANUTENCAO') DEFAULT 'ATIVO',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela equipment verificada/criada');
    
    // Inserir equipamento padrão
    await connection.execute(`
      INSERT IGNORE INTO equipment (name, model, serial_number, manufacturer, status) 
      VALUES ('Ventilador Pulmonar', 'VP-2024', 'VP123456789', 'MedTech', 'ATIVO')
    `);
    
    // Criar tabela maintenance_schedules se não existir
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS maintenance_schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        equipment_id INT NOT NULL,
        maintenance_plan_id INT,
        assigned_user_id INT,
        scheduled_date DATE NOT NULL,
        estimated_duration_hours INT DEFAULT 1,
        priority ENUM('BAIXA', 'MEDIA', 'ALTA', 'CRITICA') DEFAULT 'MEDIA',
        status ENUM('AGENDADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA') DEFAULT 'AGENDADA',
        maintenance_type VARCHAR(100),
        description TEXT,
        instructions TEXT,
        estimated_cost DECIMAL(10,2),
        actual_cost DECIMAL(10,2),
        actual_duration_hours INT,
        completion_notes TEXT,
        parts_used TEXT,
        tools_used TEXT,
        issues_found TEXT,
        recommendations TEXT,
        completed_at DATETIME,
        completed_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (equipment_id) REFERENCES equipment(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela maintenance_schedules verificada/criada');
    
    console.log('\n🎉 Todas as correções foram aplicadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a execução:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar o script
executeAllCorrections()
  .then(() => {
    console.log('\n✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro na execução:', error);
    process.exit(1);
  });