-- Adicionar campo voltage na tabela equipment
ALTER TABLE equipment ADD COLUMN voltage VARCHAR(20) NULL COMMENT 'Voltagem do equipamento (ex: 110V, 220V, 380V)';

-- Verificar se o campo foi adicionado
DESCRIBE equipment;