-- Migração para adicionar campos de personalização na tabela user_preferences
-- Arquivo: 04-add-personalization-fields.sql
-- Data: $(date)

USE hospital_maintenance;

-- Adicionar novos campos para personalização na tabela user_preferences
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS theme VARCHAR(50) DEFAULT 'light',
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'pt-BR',
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS dashboard_layout JSON DEFAULT NULL,
ADD COLUMN IF NOT EXISTS primary_color VARCHAR(50) DEFAULT 'blue',
ADD COLUMN IF NOT EXISTS interface_size VARCHAR(20) DEFAULT 'comfortable',
ADD COLUMN IF NOT EXISTS border_radius INT DEFAULT 10,
ADD COLUMN IF NOT EXISTS show_animations BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS compact_sidebar BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS show_breadcrumbs BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS high_contrast BOOLEAN DEFAULT FALSE;

-- Inserir configurações padrão para usuários existentes que não têm preferências
INSERT IGNORE INTO user_preferences (
    user_id, 
    preference_key, 
    preference_value,
    theme,
    language,
    notifications_enabled,
    primary_color,
    interface_size,
    border_radius,
    show_animations,
    compact_sidebar,
    show_breadcrumbs,
    high_contrast
)
SELECT 
    id as user_id,
    'personalization' as preference_key,
    'default' as preference_value,
    'light' as theme,
    'pt-BR' as language,
    TRUE as notifications_enabled,
    'blue' as primary_color,
    'comfortable' as interface_size,
    10 as border_radius,
    TRUE as show_animations,
    FALSE as compact_sidebar,
    TRUE as show_breadcrumbs,
    FALSE as high_contrast
FROM users 
WHERE id NOT IN (
    SELECT DISTINCT user_id 
    FROM user_preferences 
    WHERE preference_key = 'personalization'
);

-- Criar índice para melhor performance nas consultas de personalização
CREATE INDEX IF NOT EXISTS idx_user_preferences_personalization 
ON user_preferences (user_id, primary_color, interface_size);