-- =====================================================
-- CORREÇÃO DA TABELA maintenance_schedules
-- Script para corrigir incompatibilidades com a API
-- =====================================================

-- 1. ADICIONAR CAMPO created_by (que está faltando)
ALTER TABLE maintenance_schedules 
ADD COLUMN created_by INT(11) NULL COMMENT 'ID do usuário que criou o agendamento';

-- 2. CORRIGIR ENUM DE PRIORIDADE para aceitar valores em inglês
ALTER TABLE maintenance_schedules 
MODIFY COLUMN priority ENUM('baixa','media','alta','critica','low','medium','high','critical') DEFAULT 'media';

-- 3. CORRIGIR ENUM DE MAINTENANCE_TYPE para aceitar valores em inglês
ALTER TABLE maintenance_schedules 
MODIFY COLUMN maintenance_type ENUM('preventiva','corretiva','preditiva','Preventiva','Corretiva','Preditiva') NOT NULL DEFAULT 'preventiva';

-- 4. ADICIONAR ÍNDICE PARA O NOVO CAMPO created_by
CREATE INDEX idx_created_by ON maintenance_schedules(created_by);

-- 5. VERIFICAR SE A ESTRUTURA FOI ATUALIZADA CORRETAMENTE
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'hospital_maintenance' 
AND TABLE_NAME = 'maintenance_schedules'
AND COLUMN_NAME IN ('created_by', 'priority', 'maintenance_type')
ORDER BY COLUMN_NAME;

-- 6. MOSTRAR ESTRUTURA COMPLETA DA TABELA
DESCRIBE maintenance_schedules;