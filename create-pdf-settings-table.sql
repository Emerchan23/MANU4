-- Tabela para configurações de PDF personalizáveis
CREATE TABLE IF NOT EXISTS pdf_settings (
    id INT(11) NOT NULL AUTO_INCREMENT,
    
    -- Configurações do Cabeçalho
    header_title VARCHAR(100) DEFAULT 'ORDEM DE SERVIÇO',
    header_subtitle VARCHAR(100) DEFAULT 'Documento de Manutenção',
    header_bg_color VARCHAR(7) DEFAULT '#1e40af',
    header_text_color VARCHAR(7) DEFAULT '#ffffff',
    header_height INT DEFAULT 35,
    
    -- Configurações do Logo
    logo_enabled BOOLEAN DEFAULT FALSE,
    logo_path VARCHAR(255) NULL,
    logo_width INT DEFAULT 50,
    logo_height INT DEFAULT 30,
    logo_position_x INT DEFAULT 15,
    logo_position_y INT DEFAULT 8,
    
    -- Configurações de Cores
    primary_color VARCHAR(7) DEFAULT '#1e40af',
    accent_color VARCHAR(7) DEFAULT '#3b82f6',
    text_color VARCHAR(7) DEFAULT '#1f2937',
    border_color VARCHAR(7) DEFAULT '#e5e7eb',
    background_color VARCHAR(7) DEFAULT '#ffffff',
    
    -- Configurações de Fontes
    font_family VARCHAR(50) DEFAULT 'helvetica',
    title_font_size INT DEFAULT 18,
    subtitle_font_size INT DEFAULT 10,
    section_font_size INT DEFAULT 12,
    text_font_size INT DEFAULT 9,
    
    -- Configurações de Layout
    page_margin INT DEFAULT 15,
    section_spacing INT DEFAULT 15,
    line_height INT DEFAULT 5,
    border_width DECIMAL(3,1) DEFAULT 0.5,
    
    -- Configurações de Empresa (padrão)
    company_name VARCHAR(255) DEFAULT 'MANUTENÇÃO INDUSTRIAL LTDA',
    company_cnpj VARCHAR(20) DEFAULT '12.345.678/0001-90',
    company_address TEXT DEFAULT 'Rua das Indústrias, 1000 - Distrito Industrial - São Paulo/SP - CEP: 01234-567',
    
    -- Metadados
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir configuração padrão
INSERT INTO pdf_settings (
    header_title,
    header_subtitle,
    header_bg_color,
    header_text_color,
    primary_color,
    accent_color,
    text_color,
    border_color,
    company_name,
    company_cnpj,
    company_address
) VALUES (
    'ORDEM DE SERVIÇO',
    'Documento de Manutenção',
    '#1e40af',
    '#ffffff',
    '#1e40af',
    '#3b82f6',
    '#1f2937',
    '#e5e7eb',
    'MANUTENÇÃO INDUSTRIAL LTDA',
    '12.345.678/0001-90',
    'Rua das Indústrias, 1000 - Distrito Industrial - São Paulo/SP - CEP: 01234-567'
) ON DUPLICATE KEY UPDATE id=id;