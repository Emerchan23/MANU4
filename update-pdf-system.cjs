const mysql = require('mysql2/promise');

async function updatePDFSystem() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  try {
    console.log('🔧 Atualizando sistema de PDF...\n');
    
    // 1. Criar tabela pdf_settings melhorada
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS pdf_settings_enhanced (
        id INT AUTO_INCREMENT PRIMARY KEY,
        
        -- Configurações do Cabeçalho
        header_enabled BOOLEAN DEFAULT TRUE,
        header_title VARCHAR(255) DEFAULT 'ORDEM DE SERVIÇO',
        header_subtitle VARCHAR(255) DEFAULT 'Sistema de Manutenção',
        header_bg_color VARCHAR(7) DEFAULT '#2563eb',
        header_text_color VARCHAR(7) DEFAULT '#ffffff',
        header_height INT DEFAULT 80,
        header_font_size INT DEFAULT 18,
        header_subtitle_font_size INT DEFAULT 12,
        
        -- Configurações do Logo
        logo_enabled BOOLEAN DEFAULT TRUE,
        logo_position ENUM('left', 'center', 'right') DEFAULT 'left',
        logo_width INT DEFAULT 60,
        logo_height INT DEFAULT 40,
        logo_margin_x INT DEFAULT 15,
        logo_margin_y INT DEFAULT 15,
        
        -- Configurações da Empresa
        company_name VARCHAR(255) DEFAULT 'Sua Empresa',
        company_cnpj VARCHAR(20) DEFAULT '',
        company_address TEXT DEFAULT '',
        company_phone VARCHAR(20) DEFAULT '',
        company_email VARCHAR(100) DEFAULT '',
        
        -- Configurações do Rodapé
        footer_enabled BOOLEAN DEFAULT TRUE,
        footer_text VARCHAR(255) DEFAULT 'Documento gerado automaticamente pelo sistema',
        footer_bg_color VARCHAR(7) DEFAULT '#f8f9fa',
        footer_text_color VARCHAR(7) DEFAULT '#6b7280',
        footer_height INT DEFAULT 40,
        
        -- Configurações de Layout
        show_date BOOLEAN DEFAULT TRUE,
        show_page_numbers BOOLEAN DEFAULT TRUE,
        margin_top INT DEFAULT 20,
        margin_bottom INT DEFAULT 20,
        margin_left INT DEFAULT 15,
        margin_right INT DEFAULT 15,
        
        -- Configurações de Cores Gerais
        primary_color VARCHAR(7) DEFAULT '#2563eb',
        secondary_color VARCHAR(7) DEFAULT '#3b82f6',
        text_color VARCHAR(7) DEFAULT '#1f2937',
        border_color VARCHAR(7) DEFAULT '#e5e7eb',
        background_color VARCHAR(7) DEFAULT '#ffffff',
        
        -- Configurações de Assinatura
        signature_enabled BOOLEAN DEFAULT TRUE,
        signature_field1_label VARCHAR(100) DEFAULT 'Responsável pela Execução',
        signature_field2_label VARCHAR(100) DEFAULT 'Supervisor/Aprovador',
        
        -- Metadados
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela pdf_settings_enhanced criada');
    
    // 2. Criar tabela company_logos
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS company_logos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        original_name VARCHAR(255) NOT NULL,
        filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_size INT NOT NULL,
        width INT DEFAULT 0,
        height INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela company_logos criada');
    
    // 3. Inserir configuração padrão
    await connection.execute(`
      INSERT IGNORE INTO pdf_settings_enhanced (id, header_title, header_subtitle, company_name) 
      VALUES (1, 'ORDEM DE SERVIÇO', 'Sistema de Manutenção', 'FUNDO MUNICIPAL DE SAÚDE DE CHAPADÃO DO CÉU')
    `);
    console.log('✅ Configuração padrão inserida');
    
    // 4. Verificar tabelas criadas
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_ROWS 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'hospital_maintenance' 
      AND TABLE_NAME IN ('pdf_settings_enhanced', 'company_logos')
    `);
    
    console.log('\n📊 Tabelas criadas:');
    tables.forEach(table => {
      console.log(`  - ${table.TABLE_NAME}: ${table.TABLE_ROWS} registros`);
    });
    
    console.log('\n🎉 Sistema de PDF atualizado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

updatePDFSystem();