-- =====================================================
-- SCRIPT DE VERIFICAÇÃO DA ESTRUTURA DO BANCO DE DADOS
-- Sistema de Manutenção - MariaDB
-- =====================================================

-- Verificar se as tabelas principais existem
SELECT 
    'Verificando tabelas principais...' as status;

SELECT 
    TABLE_NAME,
    TABLE_TYPE,
    ENGINE,
    TABLE_ROWS,
    CREATE_TIME,
    UPDATE_TIME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME IN (
        'service_orders',
        'maintenance_schedules',
        'maintenance_plans',
        'equipment',
        'companies',
        'sectors',
        'subsectors',
        'users',
        'service_templates',
        'template_categories',
        'maintenance_history',
        'maintenance_schedule',
        'scheduled_notifications',
        'tipos_manutencao',
        'service_description_templates'
    )
ORDER BY TABLE_NAME;

-- Verificar estrutura da tabela service_orders
SELECT 
    'Estrutura da tabela service_orders' as status;

SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_KEY,
    EXTRA
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'service_orders'
ORDER BY ORDINAL_POSITION;

-- Verificar estrutura da tabela maintenance_schedules
SELECT 
    'Estrutura da tabela maintenance_schedules' as status;

SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_KEY,
    EXTRA
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'maintenance_schedules'
ORDER BY ORDINAL_POSITION;

-- Verificar estrutura da tabela equipment
SELECT 
    'Estrutura da tabela equipment' as status;

SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_KEY,
    EXTRA
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'equipment'
ORDER BY ORDINAL_POSITION;

-- Verificar chaves estrangeiras da tabela service_orders
SELECT 
    'Chaves estrangeiras da tabela service_orders' as status;

SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'service_orders'
    AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY CONSTRAINT_NAME;

-- Verificar chaves estrangeiras da tabela maintenance_schedules
SELECT 
    'Chaves estrangeiras da tabela maintenance_schedules' as status;

SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'maintenance_schedules'
    AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY CONSTRAINT_NAME;

-- Verificar índices da tabela service_orders
SELECT 
    'Índices da tabela service_orders' as status;

SELECT 
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX,
    NON_UNIQUE,
    INDEX_TYPE
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'service_orders'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- Verificar se há dados nas tabelas principais
SELECT 
    'Contagem de registros nas tabelas principais' as status;

SELECT 
    'service_orders' as tabela,
    COUNT(*) as total_registros
FROM service_orders
UNION ALL
SELECT 
    'maintenance_schedules' as tabela,
    COUNT(*) as total_registros
FROM maintenance_schedules
UNION ALL
SELECT 
    'equipment' as tabela,
    COUNT(*) as total_registros
FROM equipment
UNION ALL
SELECT 
    'companies' as tabela,
    COUNT(*) as total_registros
FROM companies
UNION ALL
SELECT 
    'sectors' as tabela,
    COUNT(*) as total_registros
FROM sectors
UNION ALL
SELECT 
    'users' as tabela,
    COUNT(*) as total_registros
FROM users;

-- Verificar tipos de dados de campos de data
SELECT 
    'Verificando campos de data' as status;

SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND (
        COLUMN_NAME LIKE '%date%' 
        OR COLUMN_NAME LIKE '%_at'
        OR DATA_TYPE IN ('date', 'datetime', 'timestamp')
    )
    AND TABLE_NAME IN (
        'service_orders',
        'maintenance_schedules',
        'maintenance_plans',
        'equipment',
        'companies'
    )
ORDER BY TABLE_NAME, COLUMN_NAME;

-- Verificar tipos de dados de campos monetários
SELECT 
    'Verificando campos monetários' as status;

SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_TYPE,
    NUMERIC_PRECISION,
    NUMERIC_SCALE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
    AND (
        COLUMN_NAME LIKE '%cost%' 
        OR COLUMN_NAME LIKE '%price%'
        OR COLUMN_NAME LIKE '%value%'
        OR DATA_TYPE = 'decimal'
    )
    AND TABLE_NAME IN (
        'service_orders',
        'maintenance_schedules',
        'maintenance_plans',
        'equipment'
    )
ORDER BY TABLE_NAME, COLUMN_NAME;
