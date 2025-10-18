-- Criação das tabelas para substituir localStorage
-- Arquivo: 03-create-session-tables.sql
-- Data: $(date)

USE hospital_maintenance;

-- Tabela para sessões de usuário (substitui localStorage para auth_token, currentUser, isAuthenticated)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_data JSON NOT NULL, -- Armazena dados do usuário (nome, role, etc.)
    is_authenticated BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela para configurações de personalização (substitui localStorage para system-personalization)
CREATE TABLE IF NOT EXISTS user_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_setting (user_id, setting_key)
);

-- Tabela para preferências do usuário (substitui localStorage para userType)
CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    preference_key VARCHAR(100) NOT NULL,
    preference_value VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_preference (user_id, preference_key)
);

-- Inserir configurações padrão de personalização para usuários existentes
INSERT IGNORE INTO user_settings (user_id, setting_key, setting_value)
SELECT 
    id as user_id,
    'system-personalization' as setting_key,
    JSON_OBJECT(
        'primaryColor', '#3b82f6',
        'interfaceSize', 'medium',
        'borderRadius', 'medium',
        'showAnimations', true,
        'compactSidebar', false,
        'showBreadcrumbs', true,
        'highContrast', false
    ) as setting_value
FROM users;

-- Inserir preferência padrão de tipo de usuário
INSERT IGNORE INTO user_preferences (user_id, preference_key, preference_value)
SELECT 
    id as user_id,
    'userType' as preference_key,
    role as preference_value
FROM users;

-- Procedure para limpeza de sessões expiradas
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS CleanExpiredSessions()
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
END //
DELIMITER ;

-- Event para executar limpeza automaticamente a cada hora
CREATE EVENT IF NOT EXISTS cleanup_expired_sessions
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
DO
  CALL CleanExpiredSessions();

-- Ativar o event scheduler se não estiver ativo
SET GLOBAL event_scheduler = ON;