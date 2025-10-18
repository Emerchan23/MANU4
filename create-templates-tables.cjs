const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configuração do banco de dados
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance',
  port: 3306
};

async function createTemplatesTables() {
  let connection;
  
  try {
    console.log('Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    
    // Ler o arquivo SQL
    const sqlFile = path.join(__dirname, '04-create-templates-tables.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Executar queries específicas uma por uma
    console.log('Criando tabela template_categories...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS template_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Criando tabela service_description_templates...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS service_description_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        category_id INT,
        is_active BOOLEAN DEFAULT TRUE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES template_categories(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_category (category_id),
        INDEX idx_active (is_active),
        INDEX idx_name (name)
      )
    `);
    
    console.log('Inserindo categorias iniciais...');
    await connection.execute(`
      INSERT IGNORE INTO template_categories (name, description) VALUES
      ('Manutenção Preventiva', 'Templates para manutenções preventivas'),
      ('Manutenção Corretiva', 'Templates para manutenções corretivas'),
      ('Instalação', 'Templates para instalação de equipamentos'),
      ('Calibração', 'Templates para calibração de equipamentos'),
      ('Limpeza', 'Templates para limpeza e higienização')
    `);
    
    console.log('Inserindo templates iniciais...');
    await connection.execute(`
      INSERT IGNORE INTO service_description_templates (name, description, category_id) VALUES
      ('Manutenção Preventiva Básica', 'Realizar inspeção visual, limpeza externa, verificação de conexões e teste de funcionamento.', 1),
      ('Troca de Filtros', 'Substituir filtros conforme especificação do fabricante. Verificar vedações e realizar teste de funcionamento.', 1),
      ('Reparo de Vazamento', 'Identificar origem do vazamento, substituir componentes danificados e testar estanqueidade.', 2),
      ('Instalação de Equipamento', 'Desembalar, posicionar, conectar utilidades, configurar parâmetros e realizar testes iniciais.', 3),
      ('Calibração de Instrumentos', 'Verificar precisão, ajustar conforme padrões, emitir certificado de calibração.', 4),
      ('Limpeza Geral', 'Realizar limpeza completa do equipamento, desinfecção e verificação de funcionamento.', 5),
      ('Substituição de Peças', 'Identificar peças defeituosas, substituir por peças originais e testar funcionamento.', 2),
      ('Verificação de Segurança', 'Verificar sistemas de segurança, alarmes e dispositivos de proteção.', 1),
      ('Atualização de Software', 'Realizar backup, instalar atualizações de software e verificar compatibilidade.', 2),
      ('Teste de Performance', 'Executar testes de performance, verificar parâmetros e documentar resultados.', 4)
    `);
    
    // Verificar se as tabelas foram criadas
    console.log('\nVerificando tabelas criadas...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_COMMENT 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'hospital_maintenance' 
      AND TABLE_NAME IN ('template_categories', 'service_description_templates')
    `);
    
    console.log('Tabelas encontradas:');
    tables.forEach(table => {
      console.log(`- ${table.TABLE_NAME}: ${table.TABLE_COMMENT || 'Sem comentário'}`);
    });
    
    // Verificar dados inseridos
    const [categories] = await connection.execute('SELECT COUNT(*) as count FROM template_categories');
    const [templates] = await connection.execute('SELECT COUNT(*) as count FROM service_description_templates');
    
    console.log(`\nDados inseridos:`);
    console.log(`- Categorias: ${categories[0].count}`);
    console.log(`- Templates: ${templates[0].count}`);
    
    console.log('\n✅ Tabelas de templates criadas com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar o script
createTemplatesTables();