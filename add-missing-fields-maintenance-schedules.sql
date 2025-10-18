-- =====================================================
-- ADICIONAR CAMPOS FALTANTES NA TABELA maintenance_schedules
-- Script para corrigir campos que não estão sendo salvos
-- =====================================================

-- 1. ADICIONAR CAMPO company_id (empresa prestadora)
ALTER TABLE maintenance_schedules 
ADD COLUMN company_id INT(11) NULL COMMENT 'ID da empresa prestadora de serviços';

-- 2. ADICIONAR CAMPO observations (observações)
ALTER TABLE maintenance_schedules 
ADD COLUMN observations TEXT NULL COMMENT 'Observações adicionais do agendamento';

-- 3. ADICIONAR ÍNDICE PARA company_id
CREATE INDEX idx_company_id ON maintenance_schedules(company_id);

-- 4. ADICIONAR FOREIGN KEY para company_id (se a tabela companies existir)
-- Verificar se a tabela companies existe primeiro
SET @table_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES 
                     WHERE TABLE_SCHEMA = 'hospital_maintenance' 
                     AND TABLE_NAME = 'companies');

-- Se a tabela companies existir, adicionar a FK
SET @sql = IF(@table_exists > 0, 
    'ALTER TABLE maintenance_schedules ADD CONSTRAINT fk_maintenance_schedules_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL ON UPDATE CASCADE',
    'SELECT "Tabela companies não encontrada, FK não adicionada" as warning'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5. VERIFICAR SE OS CAMPOS FORAM ADICIONADOS CORRETAMENTE
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'hospital_maintenance' 
AND TABLE_NAME = 'maintenance_schedules'
AND COLUMN_NAME IN ('company_id', 'observations')
ORDER BY COLUMN_NAME;

-- 6. MOSTRAR ESTRUTURA ATUALIZADA DA TABELA
SELECT 'Campos adicionados com sucesso!' as status;
DESCRIBE maintenance_schedules;