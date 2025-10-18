-- =====================================================
-- MIGRAÇÃO: Adicionar campos categoria e subsetor à tabela equipment
-- Data: 2024
-- Descrição: Adiciona os campos category_id e subsector_id à tabela equipment
-- =====================================================

USE hospital_maintenance;

-- Adicionar campo category_id à tabela equipment
ALTER TABLE equipment 
ADD COLUMN category_id INT NULL AFTER sector_id,
ADD INDEX idx_category (category_id);

-- Adicionar campo subsector_id à tabela equipment
ALTER TABLE equipment 
ADD COLUMN subsector_id INT NULL AFTER category_id,
ADD INDEX idx_subsector (subsector_id);

-- Comentários sobre os campos
ALTER TABLE equipment 
MODIFY COLUMN category_id INT NULL COMMENT 'ID da categoria do equipamento',
MODIFY COLUMN subsector_id INT NULL COMMENT 'ID do subsetor do equipamento';

-- Verificar se as alterações foram aplicadas
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'sistema_manutencao' 
    AND TABLE_NAME = 'equipment' 
    AND COLUMN_NAME IN ('category_id', 'subsector_id')
ORDER BY ORDINAL_POSITION;