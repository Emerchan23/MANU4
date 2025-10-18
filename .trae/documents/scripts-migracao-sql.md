# Scripts SQL para Migração - Português Brasileiro

## 1. Script Principal de Migração

### 1.1 Preparação e Backup
```sql
-- ============================================
-- SCRIPT DE MIGRAÇÃO - TABELAS PORTUGUÊS BR
-- Data: $(date)
-- Versão: 1.0
-- ============================================

-- Fazer backup antes de iniciar
-- mysqldump -u root -p hospital_maintenance > backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql

USE hospital_maintenance;

-- Verificar tabelas existentes
SHOW TABLES;

-- Criar log de migração
CREATE TABLE IF NOT EXISTS log_migracao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    etapa VARCHAR(100),
    status ENUM('iniciado', 'concluido', 'erro'),
    mensagem TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO log_migracao (etapa, status, mensagem) 
VALUES ('INICIO_MIGRACAO', 'iniciado', 'Iniciando migração para português brasileiro');
```

### 1.2 Criação das Novas Tabelas

```sql
-- ============================================
-- CRIAÇÃO DAS NOVAS TABELAS EM PORTUGUÊS
-- ============================================

-- 1. TIPOS DE MANUTENÇÃO
DROP TABLE IF EXISTS tipos_manutencao;
CREATE TABLE tipos_manutencao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_nome (nome),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tipos de manutenção do sistema';

INSERT INTO log_migracao (etapa, status, mensagem) 
VALUES ('CRIAR_TIPOS_MANUTENCAO', 'concluido', 'Tabela tipos_manutencao criada');

-- 2. CATEGORIAS DE TEMPLATES
DROP TABLE IF EXISTS categorias_templates;
CREATE TABLE categorias_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Categorias para organizar templates de descrição de serviços';

INSERT INTO log_migracao (etapa, status, mensagem) 
VALUES ('CRIAR_CATEGORIAS_TEMPLATES', 'concluido', 'Tabela categorias_templates criada');

-- 3. EMPRESAS
DROP TABLE IF EXISTS empresas;
CREATE TABLE empresas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(100),
    endereco TEXT,
    especialidades TEXT COMMENT 'Especialidades da empresa separadas por vírgula',
    contratos JSON COMMENT 'Contratos da empresa em formato JSON',
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_nome (nome),
    INDEX idx_cnpj (cnpj),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Empresas terceirizadas';

INSERT INTO log_migracao (etapa, status, mensagem) 
VALUES ('CRIAR_EMPRESAS', 'concluido', 'Tabela empresas criada');

-- 4. SETORES
DROP TABLE IF EXISTS setores;
CREATE TABLE setores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    gerente_id INT,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_nome (nome),
    INDEX idx_ativo (ativo),
    INDEX idx_gerente (gerente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Setores do hospital';

INSERT INTO log_migracao (etapa, status, mensagem) 
VALUES ('CRIAR_SETORES', 'concluido', 'Tabela setores criada');

-- 5. USUÁRIOS
DROP TABLE IF EXISTS usuarios;
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_usuario VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    nome_completo VARCHAR(200),
    senha_hash VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    admin BOOLEAN DEFAULT FALSE,
    ultimo_login TIMESTAMP NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_nome_usuario (nome_usuario),
    INDEX idx_email (email),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Usuários do sistema';

INSERT INTO log_migracao (etapa, status, mensagem) 
VALUES ('CRIAR_USUARIOS', 'concluido', 'Tabela usuarios criada');

-- 6. EQUIPAMENTOS
DROP TABLE IF EXISTS equipamentos;
CREATE TABLE equipamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    modelo VARCHAR(100),
    fabricante VARCHAR(100),
    numero_serie VARCHAR(100),
    setor_id INT,
    localizacao VARCHAR(200),
    status ENUM('ativo', 'inativo', 'manutencao') DEFAULT 'ativo',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (setor_id) REFERENCES setores(id) ON DELETE SET NULL,
    INDEX idx_nome (nome),
    INDEX idx_setor (setor_id),
    INDEX idx_status (status),
    INDEX idx_numero_serie (numero_serie)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Equipamentos hospitalares';

INSERT INTO log_migracao (etapa, status, mensagem) 
VALUES ('CRIAR_EQUIPAMENTOS', 'concluido', 'Tabela equipamentos criada');

-- 7. TEMPLATES DE DESCRIÇÃO DE SERVIÇOS
DROP TABLE IF EXISTS templates_descricao_servicos;
CREATE TABLE templates_descricao_servicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT NOT NULL,
    categoria_id INT,
    ativo BOOLEAN DEFAULT TRUE,
    criado_por INT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (categoria_id) REFERENCES categorias_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (criado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_categoria (categoria_id),
    INDEX idx_ativo (ativo),
    INDEX idx_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Templates pré-definidos para descrições de serviços de manutenção';

INSERT INTO log_migracao (etapa, status, mensagem) 
VALUES ('CRIAR_TEMPLATES_SERVICOS', 'concluido', 'Tabela templates_descricao_servicos criada');

-- 8. ORDENS DE SERVIÇO
DROP TABLE IF EXISTS ordens_servico;
CREATE TABLE ordens_servico (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(20) NOT NULL UNIQUE,
    equipamento_id INT,
    tipo_manutencao_id INT,
    descricao TEXT,
    prioridade ENUM('baixa', 'media', 'alta', 'critica') DEFAULT 'media',
    status ENUM('aberta', 'em_andamento', 'concluida', 'cancelada') DEFAULT 'aberta',
    data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_conclusao TIMESTAMP NULL,
    tecnico_id INT,
    empresa_id INT,
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id) ON DELETE SET NULL,
    FOREIGN KEY (tipo_manutencao_id) REFERENCES tipos_manutencao(id) ON DELETE SET NULL,
    FOREIGN KEY (tecnico_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL,
    INDEX idx_numero (numero),
    INDEX idx_equipamento (equipamento_id),
    INDEX idx_status (status),
    INDEX idx_prioridade (prioridade),
    INDEX idx_data_abertura (data_abertura)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Ordens de serviço de manutenção';

INSERT INTO log_migracao (etapa, status, mensagem) 
VALUES ('CRIAR_ORDENS_SERVICO', 'concluido', 'Tabela ordens_servico criada');
```

### 1.3 Migração dos Dados

```sql
-- ============================================
-- MIGRAÇÃO DOS DADOS EXISTENTES
-- ============================================

-- 1. MIGRAR TIPOS DE MANUTENÇÃO
INSERT INTO tipos_manutencao (id, nome, ativo, criado_em, atualizado_em)
SELECT 
    id, 
    name as nome, 
    is_active as ativo, 
    created_at as criado_em, 
    updated_at as atualizado_em
FROM maintenance_types
WHERE EXISTS (SELECT 1 FROM maintenance_types);

-- Verificar migração
SET @count_antigo = (SELECT COUNT(*) FROM maintenance_types);
SET @count_novo = (SELECT COUNT(*) FROM tipos_manutencao);

INSERT INTO log_migracao (etapa, status, mensagem) 
VALUES ('MIGRAR_TIPOS_MANUTENCAO', 
        IF(@count_antigo = @count_novo, 'concluido', 'erro'),
        CONCAT('Migrados: ', @count_novo, ' de ', @count_antigo, ' registros'));

-- 2. MIGRAR CATEGORIAS DE TEMPLATES
INSERT INTO categorias_templates (id, nome, descricao, criado_em, atualizado_em)
SELECT 
    id, 
    name as nome, 
    description as descricao, 
    created_at as criado_em, 
    updated_at as atualizado_em
FROM template_categories
WHERE EXISTS (SELECT 1 FROM template_categories);

-- Verificar migração
SET @count_antigo = (SELECT COUNT(*) FROM template_categories);
SET @count_novo = (SELECT COUNT(*) FROM categorias_templates);

INSERT INTO log_migracao (etapa, status, mensagem) 
VALUES ('MIGRAR_CATEGORIAS_TEMPLATES', 
        IF(@count_antigo = @count_novo, 'concluido', 'erro'),
        CONCAT('Migrados: ', @count_novo, ' de ', @count_antigo, ' registros'));

-- 3. MIGRAR EMPRESAS
INSERT INTO empresas (id, nome, cnpj, telefone, email, endereco, especialidades, contratos, ativo, criado_em, atualizado_em)
SELECT 
    id, 
    name as nome, 
    cnpj, 
    phone as telefone, 
    email, 
    address as endereco, 
    specialties as especialidades, 
    contracts as contratos, 
    is_active as ativo, 
    created_at as criado_em, 
    updated_at as atualizado_em
FROM companies
WHERE EXISTS (SELECT 1 FROM companies);

-- Verificar migração
SET @count_antigo = (SELECT COUNT(*) FROM companies);
SET @count_novo = (SELECT COUNT(*) FROM empresas);

INSERT INTO log_migracao (etapa, status, mensagem) 
VALUES ('MIGRAR_EMPRESAS', 
        IF(@count_antigo = @count_novo, 'concluido', 'erro'),
        CONCAT('Migrados: ', @count_novo, ' de ', @count_antigo, ' registros'));

-- 4. MIGRAR SETORES
INSERT INTO setores (id, nome, descricao, gerente_id, ativo, criado_em, atualizado_em)
SELECT 
    id, 
    name as nome, 
    description as descricao, 
    manager_id as gerente_id, 
    active as ativo, 
    created_at as criado_em, 
    updated_at as atualizado_em
FROM sectors
WHERE EXISTS (SELECT 1 FROM sectors);

-- Verificar migração
SET @count_antigo = (SELECT COUNT(*) FROM sectors);
SET @count_novo = (SELECT COUNT(*) FROM setores);

INSERT INTO log_migracao (etapa, status, mensagem) 
VALUES ('MIGRAR_SETORES', 
        IF(@count_antigo = @count_novo, 'concluido', 'erro'),
        CONCAT('Migrados: ', @count_novo, ' de ', @count_antigo, ' registros'));

-- 5. MIGRAR USUÁRIOS (se existir tabela users)
INSERT INTO usuarios (id, nome_usuario, email, nome_completo, senha_hash, ativo, admin, ultimo_login, criado_em, atualizado_em)
SELECT 
    id, 
    username as nome_usuario, 
    email, 
    full_name as nome_completo, 
    password_hash as senha_hash, 
    is_active as ativo, 
    is_admin as admin, 
    last_login as ultimo_login, 
    created_at as criado_em, 
    updated_at as atualizado_em
FROM users
WHERE EXISTS (SELECT 1 FROM users);

-- Verificar migração
SET @count_antigo = (SELECT COUNT(*) FROM users WHERE EXISTS (SELECT 1 FROM users));
SET @count_novo = (SELECT COUNT(*) FROM usuarios);

INSERT INTO log_migracao (etapa, status, mensagem) 
VALUES ('MIGRAR_USUARIOS', 
        IF(@count_antigo = @count_novo, 'concluido', 'erro'),
        CONCAT('Migrados: ', @count_novo, ' de ', @count_antigo, ' registros'));

-- 6. MIGRAR EQUIPAMENTOS (se existir tabela equipment)
INSERT INTO equipamentos (id, nome, modelo, fabricante, numero_serie, setor_id, localizacao, status, criado_em, atualizado_em)
SELECT 
    id, 
    name as nome, 
    model as modelo, 
    manufacturer as fabricante, 
    serial_number as numero_serie, 
    sector_id as setor_id, 
    location as localizacao, 
    status, 
    created_at as criado_em, 
    updated_at as atualizado_em
FROM equipment
WHERE EXISTS (SELECT 1 FROM equipment);

-- Verificar migração
SET @count_antigo = (SELECT COUNT(*) FROM equipment WHERE EXISTS (SELECT 1 FROM equipment));
SET @count_novo = (SELECT COUNT(*) FROM equipamentos);

INSERT INTO log_migracao (etapa, status, mensagem) 
VALUES ('MIGRAR_EQUIPAMENTOS', 
        IF(@count_antigo = @count_novo, 'concluido', 'erro'),
        CONCAT('Migrados: ', @count_novo, ' de ', @count_antigo, ' registros'));

-- 7. MIGRAR TEMPLATES DE SERVIÇOS
INSERT INTO templates_descricao_servicos (id, nome, descricao, categoria_id, ativo, criado_por, criado_em, atualizado_em)
SELECT 
    id, 
    name as nome, 
    description as descricao, 
    category_id as categoria_id, 
    is_active as ativo, 
    created_by as criado_por, 
    created_at as criado_em, 
    updated_at as atualizado_em
FROM service_description_templates
WHERE EXISTS (SELECT 1 FROM service_description_templates);

-- Verificar migração
SET @count_antigo = (SELECT COUNT(*) FROM service_description_templates);
SET @count_novo = (SELECT COUNT(*) FROM templates_descricao_servicos);

INSERT INTO log_migracao (etapa, status, mensagem) 
VALUES ('MIGRAR_TEMPLATES_SERVICOS', 
        IF(@count_antigo = @count_novo, 'concluido', 'erro'),
        CONCAT('Migrados: ', @count_novo, ' de ', @count_antigo, ' registros'));

-- 8. MIGRAR ORDENS DE SERVIÇO (se existir tabela service_orders)
INSERT INTO ordens_servico (id, numero, equipamento_id, tipo_manutencao_id, descricao, prioridade, status, data_abertura, data_conclusao, tecnico_id, empresa_id, observacoes, criado_em, atualizado_em)
SELECT 
    id, 
    number as numero, 
    equipment_id as equipamento_id, 
    maintenance_type_id as tipo_manutencao_id, 
    description as descricao, 
    priority as prioridade, 
    status, 
    opening_date as data_abertura, 
    completion_date as data_conclusao, 
    technician_id as tecnico_id, 
    company_id as empresa_id, 
    observations as observacoes, 
    created_at as criado_em, 
    updated_at as atualizado_em
FROM service_orders
WHERE EXISTS (SELECT 1 FROM service_orders);

-- Verificar migração
SET @count_antigo = (SELECT COUNT(*) FROM service_orders WHERE EXISTS (SELECT 1 FROM service_orders));
SET @count_novo = (SELECT COUNT(*) FROM ordens_servico);

INSERT INTO log_migracao (etapa, status, mensagem) 
VALUES ('MIGRAR_ORDENS_SERVICO', 
        IF(@count_antigo = @count_novo, 'concluido', 'erro'),
        CONCAT('Migrados: ', @count_novo, ' de ', @count_antigo, ' registros'));
```

### 1.4 Verificação de Integridade

```sql
-- ============================================
-- VERIFICAÇÃO DE INTEGRIDADE DOS DADOS
-- ============================================

-- Relatório de migração
SELECT 
    'RESUMO DA MIGRAÇÃO' as titulo,
    '' as tabela_antiga,
    '' as tabela_nova,
    '' as registros_antigos,
    '' as registros_novos,
    '' as status
UNION ALL
SELECT 
    '',
    'maintenance_types',
    'tipos_manutencao',
    CAST((SELECT COUNT(*) FROM maintenance_types) as CHAR),
    CAST((SELECT COUNT(*) FROM tipos_manutencao) as CHAR),
    IF((SELECT COUNT(*) FROM maintenance_types) = (SELECT COUNT(*) FROM tipos_manutencao), '✅ OK', '❌ ERRO')
UNION ALL
SELECT 
    '',
    'template_categories',
    'categorias_templates',
    CAST((SELECT COUNT(*) FROM template_categories) as CHAR),
    CAST((SELECT COUNT(*) FROM categorias_templates) as CHAR),
    IF((SELECT COUNT(*) FROM template_categories) = (SELECT COUNT(*) FROM categorias_templates), '✅ OK', '❌ ERRO')
UNION ALL
SELECT 
    '',
    'companies',
    'empresas',
    CAST((SELECT COUNT(*) FROM companies) as CHAR),
    CAST((SELECT COUNT(*) FROM empresas) as CHAR),
    IF((SELECT COUNT(*) FROM companies) = (SELECT COUNT(*) FROM empresas), '✅ OK', '❌ ERRO')
UNION ALL
SELECT 
    '',
    'sectors',
    'setores',
    CAST((SELECT COUNT(*) FROM sectors) as CHAR),
    CAST((SELECT COUNT(*) FROM setores) as CHAR),
    IF((SELECT COUNT(*) FROM sectors) = (SELECT COUNT(*) FROM setores), '✅ OK', '❌ ERRO');

-- Verificar foreign keys
SELECT 
    'VERIFICAÇÃO DE FOREIGN KEYS' as titulo,
    TABLE_NAME as tabela, 
    COLUMN_NAME as coluna, 
    CONSTRAINT_NAME as constraint_name, 
    REFERENCED_TABLE_NAME as tabela_referenciada,
    REFERENCED_COLUMN_NAME as coluna_referenciada
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE REFERENCED_TABLE_SCHEMA = 'hospital_maintenance'
AND TABLE_NAME IN ('equipamentos', 'templates_descricao_servicos', 'ordens_servico')
ORDER BY TABLE_NAME, COLUMN_NAME;

-- Log final
INSERT INTO log_migracao (etapa, status, mensagem) 
VALUES ('VERIFICACAO_INTEGRIDADE', 'concluido', 'Verificação de integridade concluída');

-- Mostrar log completo
SELECT * FROM log_migracao ORDER BY timestamp;
```

## 2. Script de Rollback

```sql
-- ============================================
-- SCRIPT DE ROLLBACK - EMERGÊNCIA
-- ============================================

-- ATENÇÃO: Use apenas em caso de emergência!
-- Este script remove as novas tabelas e mantém as antigas

USE hospital_maintenance;

-- Log do rollback
INSERT INTO log_migracao (etapa, status, mensagem) 
VALUES ('ROLLBACK_INICIADO', 'iniciado', 'Iniciando rollback da migração');

-- Desabilitar verificação de foreign keys temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- Remover tabelas em português (ordem inversa devido às foreign keys)
DROP TABLE IF EXISTS ordens_servico;
DROP TABLE IF EXISTS templates_descricao_servicos;
DROP TABLE IF EXISTS equipamentos;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS setores;
DROP TABLE IF EXISTS empresas;
DROP TABLE IF EXISTS categorias_templates;
DROP TABLE IF EXISTS tipos_manutencao;

-- Reabilitar verificação de foreign keys
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO log_migracao (etapa, status, mensagem) 
VALUES ('ROLLBACK_CONCLUIDO', 'concluido', 'Rollback concluído - tabelas antigas mantidas');

SELECT 'ROLLBACK CONCLUÍDO - Tabelas antigas mantidas' as status;
```

## 3. Script de Limpeza Final

```sql
-- ============================================
-- SCRIPT DE LIMPEZA - APÓS VALIDAÇÃO
-- ============================================

-- Execute apenas após confirmar que tudo está funcionando!

USE hospital_maintenance;

-- Log da limpeza
INSERT INTO log_migracao (etapa, status, mensagem) 
VALUES ('LIMPEZA_INICIADA', 'iniciado', 'Iniciando limpeza das tabelas antigas');

-- Desabilitar verificação de foreign keys temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- Remover tabelas antigas (ordem inversa devido às foreign keys)
DROP TABLE IF EXISTS service_orders;
DROP TABLE IF EXISTS service_description_templates;
DROP TABLE IF EXISTS equipment;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS sectors;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS template_categories;
DROP TABLE IF EXISTS maintenance_types;

-- Reabilitar verificação de foreign keys
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO log_migracao (etapa, status, mensagem) 
VALUES ('LIMPEZA_CONCLUIDA', 'concluido', 'Tabelas antigas removidas com sucesso');

SELECT 'LIMPEZA CONCLUÍDA - Tabelas antigas removidas' as status;

-- Otimizar tabelas
OPTIMIZE TABLE tipos_manutencao;
OPTIMIZE TABLE categorias_templates;
OPTIMIZE TABLE empresas;
OPTIMIZE TABLE setores;
OPTIMIZE TABLE usuarios;
OPTIMIZE TABLE equipamentos;
OPTIMIZE TABLE templates_descricao_servicos;
OPTIMIZE TABLE ordens_servico;

SELECT 'OTIMIZAÇÃO CONCLUÍDA' as status;
```

## 4. Scripts de Validação

### 4.1 Validação de Dados
```sql
-- ============================================
-- VALIDAÇÃO COMPLETA DOS DADOS MIGRADOS
-- ============================================

-- 1. Verificar se todos os registros foram migrados
SELECT 
    'Validação de Contagem de Registros' as teste,
    'tipos_manutencao' as tabela,
    COUNT(*) as total_registros
FROM tipos_manutencao
UNION ALL
SELECT 
    '',
    'categorias_templates',
    COUNT(*)
FROM categorias_templates
UNION ALL
SELECT 
    '',
    'empresas',
    COUNT(*)
FROM empresas
UNION ALL
SELECT 
    '',
    'setores',
    COUNT(*)
FROM setores;

-- 2. Verificar integridade referencial
SELECT 
    'Validação de Foreign Keys' as teste,
    'equipamentos -> setores' as relacao,
    COUNT(*) as registros_com_fk_valida
FROM equipamentos e
LEFT JOIN setores s ON e.setor_id = s.id
WHERE e.setor_id IS NULL OR s.id IS NOT NULL;

SELECT 
    '',
    'templates -> categorias' as relacao,
    COUNT(*) as registros_com_fk_valida
FROM templates_descricao_servicos t
LEFT JOIN categorias_templates c ON t.categoria_id = c.id
WHERE t.categoria_id IS NULL OR c.id IS NOT NULL;

-- 3. Verificar encoding
SELECT 
    'Validação de Encoding' as teste,
    TABLE_NAME as tabela,
    TABLE_COLLATION as collation
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'hospital_maintenance'
AND TABLE_NAME IN ('tipos_manutencao', 'categorias_templates', 'empresas', 'setores', 'equipamentos', 'templates_descricao_servicos', 'ordens_servico');
```

### 4.2 Teste de Performance
```sql
-- ============================================
-- TESTE DE PERFORMANCE DAS NOVAS TABELAS
-- ============================================

-- Teste de consulta simples
SELECT 'Teste de Performance - SELECT simples' as teste;
SELECT COUNT(*) FROM tipos_manutencao WHERE ativo = 1;
SELECT COUNT(*) FROM empresas WHERE ativo = 1;
SELECT COUNT(*) FROM setores WHERE ativo = 1;

-- Teste de JOIN
SELECT 'Teste de Performance - JOIN' as teste;
SELECT COUNT(*) 
FROM equipamentos e
JOIN setores s ON e.setor_id = s.id
WHERE s.ativo = 1;

-- Teste de INSERT
SELECT 'Teste de Performance - INSERT' as teste;
INSERT INTO tipos_manutencao (nome, ativo) VALUES ('Teste Performance', 1);
DELETE FROM tipos_manutencao WHERE nome = 'Teste Performance';
```

---

**Instruções de Uso:**

1. **Backup:** Sempre faça backup antes de executar
2. **Teste:** Execute primeiro em ambiente de desenvolvimento
3. **Monitoramento:** Acompanhe os logs durante a execução
4. **Validação:** Execute os scripts de validação após cada etapa
5. **Rollback:** Tenha o script de rollback pronto em caso de problemas

**Tempo Estimado de Execução:** 30-60 minutos (dependendo do volume de dados)