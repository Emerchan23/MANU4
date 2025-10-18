-- Tabela para templates de PDF
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

-- Tabela para uploads de logos
CREATE TABLE IF NOT EXISTS logo_uploads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela para controle de exportações PDF
CREATE TABLE IF NOT EXISTS pdf_exports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  export_type VARCHAR(100) NOT NULL,
  file_size INT NOT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir template padrão para ordens de serviço
INSERT IGNORE INTO pdf_templates (name, type, header_config, footer_config, is_default) VALUES
('Template Padrão - Ordem de Serviço', 'service-order', 
 '{"showLogo": false, "logoPosition": "left", "title": "Ordem de Serviço", "subtitle": "Sistema de Manutenção", "showDate": true, "backgroundColor": "#f8f9fa", "textColor": "#333333"}',
 '{"showPageNumbers": true, "leftText": "Sistema de Manutenção", "centerText": "", "rightText": "", "backgroundColor": "#f8f9fa", "textColor": "#666666"}',
 true);

-- Inserir template padrão para relatórios
INSERT IGNORE INTO pdf_templates (name, type, header_config, footer_config, is_default) VALUES
('Template Padrão - Relatórios', 'reports', 
 '{"showLogo": false, "logoPosition": "left", "title": "Relatório", "subtitle": "Sistema de Manutenção", "showDate": true, "backgroundColor": "#f8f9fa", "textColor": "#333333"}',
 '{"showPageNumbers": true, "leftText": "Sistema de Manutenção", "centerText": "", "rightText": "", "backgroundColor": "#f8f9fa", "textColor": "#666666"}',
 true);

-- Inserir configurações padrão do sistema PDF
INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
('pdf_default_header_height', '80', 'Altura padrão do cabeçalho em pixels'),
('pdf_default_footer_height', '50', 'Altura padrão do rodapé em pixels'),
('pdf_logo_max_size', '2097152', 'Tamanho máximo do logo em bytes (2MB)'),
('pdf_logo_max_width', '200', 'Largura máxima do logo em pixels'),
('pdf_logo_max_height', '80', 'Altura máxima do logo em pixels'),
('pdf_logo_allowed_types', 'image/png,image/jpeg,image/jpg,image/svg+xml', 'Tipos de arquivo permitidos para logo'),
('pdf_logo_folder', '/public/uploads/logos', 'Pasta para armazenar logos'),
('pdf_temp_folder', '/tmp/pdf-exports', 'Pasta temporária para arquivos PDF');