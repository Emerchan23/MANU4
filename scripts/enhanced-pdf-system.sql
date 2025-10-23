-- =====================================================
-- SCRIPT DE ATUALIZAÇÃO DO SISTEMA DE PDF
-- Criação/atualização de tabelas para personalização completa
-- =====================================================

-- 1. Tabela para configurações gerais de PDF
CREATE TABLE IF NOT EXISTS pdf_settings (
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
);

-- 2. Tabela para logos da empresa
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
);

-- 3. Tabela para templates de PDF (se não existir)
CREATE TABLE IF NOT EXISTS pdf_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type ENUM('service-order', 'preventive-maintenance', 'reports', 'global') NOT NULL,
    header_config JSON NOT NULL,
    footer_config JSON NOT NULL,
    logo_config JSON NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Inserir configuração padrão se não existir
INSERT IGNORE INTO pdf_settings (id, header_title, header_subtitle, company_name) 
VALUES (1, 'ORDEM DE SERVIÇO', 'Sistema de Manutenção', 'Sua Empresa');

-- 5. Atualizar system_settings para incluir configurações de PDF
INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
('pdf_max_logo_size', '2097152', 'Tamanho máximo do logo em bytes (2MB)'),
('pdf_allowed_logo_types', 'image/png,image/jpeg,image/jpg,image/svg+xml', 'Tipos de arquivo permitidos para logo'),
('pdf_logo_upload_path', '/uploads/logos', 'Caminho para upload de logos'),
('pdf_temp_path', '/tmp/pdf-exports', 'Caminho temporário para PDFs');

-- 6. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pdf_settings_active ON pdf_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_company_logos_active ON company_logos(is_active);
CREATE INDEX IF NOT EXISTS idx_pdf_templates_type ON pdf_templates(type, is_active);

-- 7. Verificar se as tabelas foram criadas corretamente
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME IN ('pdf_settings', 'company_logos', 'pdf_templates')
ORDER BY TABLE_NAME;