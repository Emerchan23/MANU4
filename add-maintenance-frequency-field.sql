-- Adicionar campo maintenance_frequency_days na tabela equipment
ALTER TABLE equipment ADD COLUMN maintenance_frequency_days INT NULL COMMENT 'Frequência de manutenção em dias';

-- Verificar se o campo foi adicionado
DESCRIBE equipment;