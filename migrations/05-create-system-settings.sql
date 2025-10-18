-- Migração para criar tabela de configurações globais do sistema
-- Arquivo: 05-create-system-settings.sql
-- Data: $(date)

USE hospital_maintenance;

-- Criar tabela system_settings para configurações globais
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inserir configurações padrão de personalização
INSERT IGNORE INTO system_settings (setting_key, setting_value, category, description) VALUES
('primary_color', '#3b82f6', 'personalization', 'Cor principal do sistema'),
('interface_density', 'comfortable', 'personalization', 'Densidade da interface do usuário'),
('border_radius', '10', 'personalization', 'Raio das bordas dos elementos'),
('animations_enabled', 'true', 'personalization', 'Habilitar animações na interface'),
('sidebar_compact', 'false', 'personalization', 'Sidebar compacta por padrão'),
('show_breadcrumbs', 'true', 'personalization', 'Mostrar breadcrumbs de navegação'),
('high_contrast', 'false', 'personalization', 'Modo de alto contraste');

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings (category);
CREATE INDEX IF NOT EXISTS idx_system_settings_key_category ON system_settings (setting_key, category);

-- Comentário sobre a migração
-- Esta tabela armazena configurações globais do sistema que se aplicam a todos os usuários
-- Categoria 'personalization' contém as configurações de aparência e comportamento padrão