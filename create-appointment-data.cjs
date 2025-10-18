const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function createAppointmentData() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao MariaDB...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados MariaDB');
    
    // Verificar se existe equipamento
    console.log('\n🔍 Verificando equipamentos...');
    const [equipment] = await connection.execute('SELECT * FROM equipment LIMIT 1');
    
    if (equipment.length === 0) {
      console.log('📝 Criando equipamento padrão...');
      await connection.execute(`
        INSERT INTO equipment (name, model, serial_number, manufacturer, status) 
        VALUES ('Ventilador Pulmonar', 'VP-2024', 'VP123456789', 'MedTech', 'ATIVO')
      `);
      console.log('✅ Equipamento criado');
    } else {
      console.log('✅ Equipamento já existe');
    }
    
    // Verificar se existe empresa
    console.log('\n🔍 Verificando empresas...');
    const [empresas] = await connection.execute('SELECT * FROM empresas WHERE name = ?', ['TechMed Soluções']);
    
    if (empresas.length === 0) {
      console.log('📝 Criando empresa padrão...');
      await connection.execute(`
        INSERT INTO empresas (name, cnpj, phone, email, contact_person) 
        VALUES ('TechMed Soluções', '12.345.678/0001-90', '(11) 9999-9999', 'contato@techmed.com', 'João Silva')
      `);
      console.log('✅ Empresa criada');
    } else {
      console.log('✅ Empresa já existe');
    }
    
    // Verificar se existe usuário
    console.log('\n🔍 Verificando usuários...');
    const [users] = await connection.execute('SELECT * FROM users LIMIT 1');
    
    if (users.length === 0) {
      console.log('📝 Criando usuário padrão...');
      await connection.execute(`
        INSERT INTO users (username, email, password_hash, full_name, is_active) 
        VALUES ('teste', 'teste@teste.com', 'hash123', 'Teste Usuario', 1)
      `);
      console.log('✅ Usuário criado');
    } else {
      console.log('✅ Usuário já existe');
    }
    
    // Criar tabela maintenance_schedules se não existir
    console.log('\n🔍 Verificando tabela maintenance_schedules...');
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabela maintenance_schedules verificada/criada');
    
    console.log('\n🎉 Todos os dados necessários foram criados/verificados!');
    
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
createAppointmentData()
  .then(() => {
    console.log('\n✅ Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro na execução:', error);
    process.exit(1);
  });