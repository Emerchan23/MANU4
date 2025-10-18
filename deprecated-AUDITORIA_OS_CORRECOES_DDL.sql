-- =====================================================
-- AUDITORIA TÉCNICA - NOVA ORDEM DE SERVIÇO
-- SCRIPT DE CORREÇÕES DDL
-- =====================================================

-- 1. CORREÇÃO DE PRIORIDADES (Alta Severidade)
-- Ajustar ENUM de prioridades para alinhar com UI
ALTER TABLE service_orders 
MODIFY COLUMN priority ENUM('BAIXA','MEDIA','ALTA','CRITICA') NOT NULL DEFAULT 'MEDIA';

-- 2. CORREÇÃO DE STATUS (Alta Severidade)  
-- Ajustar ENUM de status para alinhar com UI
ALTER TABLE service_orders 
MODIFY COLUMN status ENUM('ABERTA','EM_ANDAMENTO','AGUARDANDO_APROVACAO','APROVADA','REJEITADA','CONCLUIDA','CANCELADA') NOT NULL DEFAULT 'ABERTA';

-- 3. AJUSTE DE TIPO DE DADOS PARA CUSTO (Média Severidade)
-- Aumentar precisão para valores maiores
ALTER TABLE service_orders 
MODIFY COLUMN cost DECIMAL(12,2) UNSIGNED NULL DEFAULT NULL;

-- 4. ADICIONAR CONSTRAINT PARA VALIDAÇÃO DE CUSTO
-- Garantir que custo seja sempre positivo ou zero
ALTER TABLE service_orders 
ADD CONSTRAINT chk_cost_positive CHECK (cost >= 0);

-- 5. ADICIONAR ÍNDICES DE PERFORMANCE (Baixa Severidade)
-- Melhorar performance de consultas frequentes
CREATE INDEX idx_service_orders_priority ON service_orders(priority);
CREATE INDEX idx_service_orders_requested_date ON service_orders(requested_date);
CREATE INDEX idx_service_orders_status_priority ON service_orders(status, priority);
CREATE INDEX idx_service_orders_equipment_status ON service_orders(equipment_id, status);

-- 6. ADICIONAR FOREIGN KEYS (Média Severidade)
-- Garantir integridade referencial
ALTER TABLE service_orders 
ADD CONSTRAINT fk_service_orders_equipment 
FOREIGN KEY (equipment_id) REFERENCES equipment(id) 
ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE service_orders 
ADD CONSTRAINT fk_service_orders_company 
FOREIGN KEY (company_id) REFERENCES empresas(id) 
ON UPDATE CASCADE ON DELETE SET NULL;

-- Verificar se tabela maintenance_types existe antes de criar FK
-- Se não existir, criar a tabela primeiro
CREATE TABLE IF NOT EXISTS maintenance_types (
    id INT(11) NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_maintenance_types_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir tipos básicos de manutenção se não existirem
INSERT IGNORE INTO maintenance_types (name, description) VALUES 
('PREVENTIVA', 'Manutenção preventiva programada'),
('CORRETIVA', 'Manutenção corretiva para reparo'),
('PREDITIVA', 'Manutenção baseada em condição');

-- Adicionar FK para maintenance_type_id
ALTER TABLE service_orders 
ADD CONSTRAINT fk_service_orders_maintenance_type 
FOREIGN KEY (maintenance_type_id) REFERENCES maintenance_types(id) 
ON UPDATE CASCADE ON DELETE SET NULL;

-- 7. TRIGGER PARA VALIDAÇÃO DE DATAS
-- Garantir que scheduled_date não seja anterior a requested_date
DELIMITER $$
CREATE TRIGGER tr_service_orders_validate_dates 
BEFORE INSERT ON service_orders
FOR EACH ROW
BEGIN
    IF NEW.scheduled_date IS NOT NULL AND NEW.scheduled_date < NEW.requested_date THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Data agendada não pode ser anterior à data solicitada';
    END IF;
END$$

CREATE TRIGGER tr_service_orders_validate_dates_update 
BEFORE UPDATE ON service_orders
FOR EACH ROW
BEGIN
    IF NEW.scheduled_date IS NOT NULL AND NEW.scheduled_date < NEW.requested_date THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Data agendada não pode ser anterior à data solicitada';
    END IF;
END$$
DELIMITER ;

-- 8. TRIGGER PARA ATUALIZAÇÃO AUTOMÁTICA DE WARRANTY_EXPIRY
-- Calcular automaticamente data de vencimento da garantia
DELIMITER $$
CREATE TRIGGER tr_service_orders_warranty_expiry 
BEFORE INSERT ON service_orders
FOR EACH ROW
BEGIN
    IF NEW.warranty_days > 0 AND NEW.completion_date IS NOT NULL THEN
        SET NEW.warranty_expiry = DATE_ADD(NEW.completion_date, INTERVAL NEW.warranty_days DAY);
    END IF;
END$$

CREATE TRIGGER tr_service_orders_warranty_expiry_update 
BEFORE UPDATE ON service_orders
FOR EACH ROW
BEGIN
    IF NEW.warranty_days > 0 AND NEW.completion_date IS NOT NULL THEN
        SET NEW.warranty_expiry = DATE_ADD(NEW.completion_date, INTERVAL NEW.warranty_days DAY);
    ELSEIF NEW.warranty_days = 0 OR NEW.completion_date IS NULL THEN
        SET NEW.warranty_expiry = NULL;
    END IF;
END$$
DELIMITER ;

-- 9. ADICIONAR COMENTÁRIOS NAS COLUNAS PARA DOCUMENTAÇÃO
ALTER TABLE service_orders 
MODIFY COLUMN id INT(11) NOT NULL AUTO_INCREMENT COMMENT 'ID único da ordem de serviço',
MODIFY COLUMN order_number VARCHAR(20) NOT NULL COMMENT 'Número sequencial da OS (ex: OS-001/2024)',
MODIFY COLUMN equipment_id INT(11) NOT NULL COMMENT 'ID do equipamento (FK para equipment)',
MODIFY COLUMN company_id INT(11) NULL COMMENT 'ID da empresa terceirizada (FK para empresas)',
MODIFY COLUMN description TEXT NOT NULL COMMENT 'Descrição detalhada do serviço',
MODIFY COLUMN priority ENUM('BAIXA','MEDIA','ALTA','CRITICA') NOT NULL DEFAULT 'MEDIA' COMMENT 'Prioridade da OS',
MODIFY COLUMN status ENUM('ABERTA','EM_ANDAMENTO','AGUARDANDO_APROVACAO','APROVADA','REJEITADA','CONCLUIDA','CANCELADA') NOT NULL DEFAULT 'ABERTA' COMMENT 'Status atual da OS',
MODIFY COLUMN requested_date DATE NOT NULL COMMENT 'Data de solicitação da OS',
MODIFY COLUMN scheduled_date DATE NULL COMMENT 'Data agendada para execução',
MODIFY COLUMN completion_date DATE NULL COMMENT 'Data de conclusão do serviço',
MODIFY COLUMN warranty_days INT(11) DEFAULT 0 COMMENT 'Dias de garantia do serviço',
MODIFY COLUMN warranty_expiry DATE NULL COMMENT 'Data de vencimento da garantia (calculada automaticamente)',
MODIFY COLUMN cost DECIMAL(12,2) UNSIGNED NULL DEFAULT NULL COMMENT 'Custo estimado/real do serviço',
MODIFY COLUMN observations TEXT NULL COMMENT 'Observações adicionais',
MODIFY COLUMN created_by INT(11) NULL COMMENT 'ID do usuário que criou a OS',
MODIFY COLUMN assigned_to INT(11) NULL COMMENT 'ID do técnico responsável',
MODIFY COLUMN type VARCHAR(50) NULL COMMENT 'Tipo de manutenção (PREVENTIVA/CORRETIVA/PREDITIVA)',
MODIFY COLUMN maintenance_type_id INT(11) NULL COMMENT 'ID do tipo de manutenção (FK para maintenance_types)';

-- 10. VERIFICAÇÃO FINAL DA ESTRUTURA
-- Script para validar se todas as alterações foram aplicadas corretamente
SELECT 
    'ESTRUTURA ATUALIZADA' as status,
    COUNT(*) as total_colunas
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'hospital_maintenance' 
AND TABLE_NAME = 'service_orders';

-- Verificar índices criados
SELECT 
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'hospital_maintenance' 
AND TABLE_NAME = 'service_orders'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- Verificar constraints
SELECT 
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = 'hospital_maintenance' 
AND TABLE_NAME = 'service_orders';

-- 1. CORREÇÃO DE PRIORIDADES (Alta Severidade)
-- Ajustar ENUM de prioridades para alinhar com UI
ALTER TABLE service_orders 
MODIFY COLUMN priority ENUM('BAIXA','MEDIA','ALTA','CRITICA') NOT NULL DEFAULT 'MEDIA';

-- 2. CORREÇÃO DE STATUS (Alta Severidade)  
-- Ajustar ENUM de status para alinhar com UI
ALTER TABLE service_orders 
MODIFY COLUMN status ENUM('ABERTA','EM_ANDAMENTO','AGUARDANDO_APROVACAO','APROVADA','REJEITADA','CONCLUIDA','CANCELADA') NOT NULL DEFAULT 'ABERTA';

-- 3. AJUSTE DE TIPO DE DADOS PARA CUSTO (Média Severidade)
-- Aumentar precisão para valores maiores
ALTER TABLE service_orders 
MODIFY COLUMN cost DECIMAL(12,2) UNSIGNED NULL DEFAULT NULL;

-- 4. ADICIONAR CONSTRAINT PARA VALIDAÇÃO DE CUSTO
-- Garantir que custo seja sempre positivo ou zero
ALTER TABLE service_orders 
ADD CONSTRAINT chk_cost_positive CHECK (cost >= 0);

-- 5. ADICIONAR ÍNDICES DE PERFORMANCE (Baixa Severidade)
-- Melhorar performance de consultas frequentes
CREATE INDEX idx_service_orders_priority ON service_orders(priority);
CREATE INDEX idx_service_orders_requested_date ON service_orders(requested_date);
CREATE INDEX idx_service_orders_status_priority ON service_orders(status, priority);
CREATE INDEX idx_service_orders_equipment_status ON service_orders(equipment_id, status);

-- 6. ADICIONAR FOREIGN KEYS (Média Severidade)
-- Garantir integridade referencial
ALTER TABLE service_orders 
ADD CONSTRAINT fk_service_orders_equipment 
FOREIGN KEY (equipment_id) REFERENCES equipment(id) 
ON UPDATE CASCADE ON DELETE RESTRICT;

ALTER TABLE service_orders 
ADD CONSTRAINT fk_service_orders_company 
FOREIGN KEY (company_id) REFERENCES empresas(id) 
ON UPDATE CASCADE ON DELETE SET NULL;

-- Verificar se tabela maintenance_types existe antes de criar FK
-- Se não existir, criar a tabela primeiro
CREATE TABLE IF NOT EXISTS maintenance_types (
    id INT(11) NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_maintenance_types_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir tipos básicos de manutenção se não existirem
INSERT IGNORE INTO maintenance_types (name, description) VALUES 
('PREVENTIVA', 'Manutenção preventiva programada'),
('CORRETIVA', 'Manutenção corretiva para reparo'),
('PREDITIVA', 'Manutenção baseada em condição');

-- Adicionar FK para maintenance_type_id
ALTER TABLE service_orders 
ADD CONSTRAINT fk_service_orders_maintenance_type 
FOREIGN KEY (maintenance_type_id) REFERENCES maintenance_types(id) 
ON UPDATE CASCADE ON DELETE SET NULL;

-- 7. TRIGGER PARA VALIDAÇÃO DE DATAS
-- Garantir que scheduled_date não seja anterior a requested_date
DELIMITER $$
CREATE TRIGGER tr_service_orders_validate_dates 
BEFORE INSERT ON service_orders
FOR EACH ROW
BEGIN
    IF NEW.scheduled_date IS NOT NULL AND NEW.scheduled_date < NEW.requested_date THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Data agendada não pode ser anterior à data solicitada';
    END IF;
END$$

CREATE TRIGGER tr_service_orders_validate_dates_update 
BEFORE UPDATE ON service_orders
FOR EACH ROW
BEGIN
    IF NEW.scheduled_date IS NOT NULL AND NEW.scheduled_date < NEW.requested_date THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Data agendada não pode ser anterior à data solicitada';
    END IF;
END$$
DELIMITER ;

-- 8. TRIGGER PARA ATUALIZAÇÃO AUTOMÁTICA DE WARRANTY_EXPIRY
-- Calcular automaticamente data de vencimento da garantia
DELIMITER $$
CREATE TRIGGER tr_service_orders_warranty_expiry 
BEFORE INSERT ON service_orders
FOR EACH ROW
BEGIN
    IF NEW.warranty_days > 0 AND NEW.completion_date IS NOT NULL THEN
        SET NEW.warranty_expiry = DATE_ADD(NEW.completion_date, INTERVAL NEW.warranty_days DAY);
    END IF;
END$$

CREATE TRIGGER tr_service_orders_warranty_expiry_update 
BEFORE UPDATE ON service_orders
FOR EACH ROW
BEGIN
    IF NEW.warranty_days > 0 AND NEW.completion_date IS NOT NULL THEN
        SET NEW.warranty_expiry = DATE_ADD(NEW.completion_date, INTERVAL NEW.warranty_days DAY);
    ELSEIF NEW.warranty_days = 0 OR NEW.completion_date IS NULL THEN
        SET NEW.warranty_expiry = NULL;
    END IF;
END$$
DELIMITER ;

-- 9. ADICIONAR COMENTÁRIOS NAS COLUNAS PARA DOCUMENTAÇÃO
ALTER TABLE service_orders 
MODIFY COLUMN id INT(11) NOT NULL AUTO_INCREMENT COMMENT 'ID único da ordem de serviço',
MODIFY COLUMN order_number VARCHAR(20) NOT NULL COMMENT 'Número sequencial da OS (ex: OS-001/2024)',
MODIFY COLUMN equipment_id INT(11) NOT NULL COMMENT 'ID do equipamento (FK para equipment)',
MODIFY COLUMN company_id INT(11) NULL COMMENT 'ID da empresa terceirizada (FK para empresas)',
MODIFY COLUMN description TEXT NOT NULL COMMENT 'Descrição detalhada do serviço',
MODIFY COLUMN priority ENUM('BAIXA','MEDIA','ALTA','CRITICA') NOT NULL DEFAULT 'MEDIA' COMMENT 'Prioridade da OS',
MODIFY COLUMN status ENUM('ABERTA','EM_ANDAMENTO','AGUARDANDO_APROVACAO','APROVADA','REJEITADA','CONCLUIDA','CANCELADA') NOT NULL DEFAULT 'ABERTA' COMMENT 'Status atual da OS',
MODIFY COLUMN requested_date DATE NOT NULL COMMENT 'Data de solicitação da OS',
MODIFY COLUMN scheduled_date DATE NULL COMMENT 'Data agendada para execução',
MODIFY COLUMN completion_date DATE NULL COMMENT 'Data de conclusão do serviço',
MODIFY COLUMN warranty_days INT(11) DEFAULT 0 COMMENT 'Dias de garantia do serviço',
MODIFY COLUMN warranty_expiry DATE NULL COMMENT 'Data de vencimento da garantia (calculada automaticamente)',
MODIFY COLUMN cost DECIMAL(12,2) UNSIGNED NULL DEFAULT NULL COMMENT 'Custo estimado/real do serviço',
MODIFY COLUMN observations TEXT NULL COMMENT 'Observações adicionais',
MODIFY COLUMN created_by INT(11) NULL COMMENT 'ID do usuário que criou a OS',
MODIFY COLUMN assigned_to INT(11) NULL COMMENT 'ID do técnico responsável',
MODIFY COLUMN type VARCHAR(50) NULL COMMENT 'Tipo de manutenção (PREVENTIVA/CORRETIVA/PREDITIVA)',
MODIFY COLUMN maintenance_type_id INT(11) NULL COMMENT 'ID do tipo de manutenção (FK para maintenance_types)';

-- 10. VERIFICAÇÃO FINAL DA ESTRUTURA
-- Script para validar se todas as alterações foram aplicadas corretamente
SELECT 
    'ESTRUTURA ATUALIZADA' as status,
    COUNT(*) as total_colunas
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'hospital_maintenance' 
AND TABLE_NAME = 'service_orders';

-- Verificar índices criados
SELECT 
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'hospital_maintenance' 
AND TABLE_NAME = 'service_orders'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

-- Verificar constraints
SELECT 
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
WHERE TABLE_SCHEMA = 'hospital_maintenance' 
AND TABLE_NAME = 'service_orders';