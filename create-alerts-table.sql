-- Criação da tabela de alertas para o Sistema de Manutenção Hospitalar
-- Usar apenas MariaDB, sem localStorage

-- Tabela principal de alertas
CREATE TABLE IF NOT EXISTS alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL,
    tipo ENUM('MANUTENCAO', 'CALIBRACAO', 'GARANTIA', 'INSPECAO', 'LIMPEZA') NOT NULL,
    prioridade ENUM('ALTA', 'MEDIA', 'BAIXA') NOT NULL DEFAULT 'MEDIA',
    status ENUM('ATIVO', 'RESOLVIDO', 'IGNORADO', 'ESCALADO') NOT NULL DEFAULT 'ATIVO',
    descricao TEXT NOT NULL,
    data_vencimento DATE NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    dias_atraso INT GENERATED ALWAYS AS (DATEDIFF(CURDATE(), data_vencimento)) STORED,
    notificados JSON DEFAULT NULL COMMENT 'Array de emails notificados',
    escalonamento_nivel INT DEFAULT 1,
    observacoes TEXT DEFAULT NULL,
    resolvido_por INT DEFAULT NULL,
    data_resolucao TIMESTAMP NULL DEFAULT NULL,
    proximo_escalonamento DATE DEFAULT NULL,
    
    -- Chaves estrangeiras
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (resolvido_por) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Índices para performance
    INDEX idx_equipment_id (equipment_id),
    INDEX idx_status (status),
    INDEX idx_prioridade (prioridade),
    INDEX idx_tipo (tipo),
    INDEX idx_data_vencimento (data_vencimento),
    INDEX idx_dias_atraso (dias_atraso),
    INDEX idx_data_criacao (data_criacao),
    INDEX idx_composite_active (status, prioridade, data_vencimento) -- Índice composto para consultas frequentes
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de histórico de ações nos alertas
CREATE TABLE IF NOT EXISTS alert_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alert_id INT NOT NULL,
    acao ENUM('CRIADO', 'RESOLVIDO', 'IGNORADO', 'ESCALADO', 'REABERTO', 'ATUALIZADO') NOT NULL,
    usuario_id INT DEFAULT NULL,
    observacoes TEXT DEFAULT NULL,
    data_acao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dados_anteriores JSON DEFAULT NULL COMMENT 'Estado anterior do alerta',
    
    -- Chaves estrangeiras
    FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Índices
    INDEX idx_alert_id (alert_id),
    INDEX idx_data_acao (data_acao),
    INDEX idx_usuario_id (usuario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de configurações de alertas por equipamento
CREATE TABLE IF NOT EXISTS alert_configurations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL,
    tipo ENUM('MANUTENCAO', 'CALIBRACAO', 'GARANTIA', 'INSPECAO', 'LIMPEZA') NOT NULL,
    dias_antecedencia INT NOT NULL DEFAULT 30 COMMENT 'Dias antes do vencimento para criar alerta',
    prioridade_padrao ENUM('ALTA', 'MEDIA', 'BAIXA') NOT NULL DEFAULT 'MEDIA',
    escalonamento_dias INT DEFAULT 7 COMMENT 'Dias para escalonamento automático',
    notificar_emails JSON DEFAULT NULL COMMENT 'Emails para notificação automática',
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Chaves estrangeiras
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    
    -- Índices
    INDEX idx_equipment_id (equipment_id),
    INDEX idx_tipo (tipo),
    INDEX idx_ativo (ativo),
    
    -- Constraint única para evitar duplicatas
    UNIQUE KEY unique_equipment_tipo (equipment_id, tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir algumas configurações padrão de alertas
INSERT IGNORE INTO alert_configurations (equipment_id, tipo, dias_antecedencia, prioridade_padrao, escalonamento_dias, notificar_emails) 
SELECT 
    e.id,
    'MANUTENCAO',
    30,
    'MEDIA',
    7,
    JSON_ARRAY('manutencao@hospital.com')
FROM equipment e
WHERE e.id IS NOT NULL;

INSERT IGNORE INTO alert_configurations (equipment_id, tipo, dias_antecedencia, prioridade_padrao, escalonamento_dias, notificar_emails) 
SELECT 
    e.id,
    'CALIBRACAO',
    15,
    'ALTA',
    3,
    JSON_ARRAY('calibracao@hospital.com', 'qualidade@hospital.com')
FROM equipment e
WHERE e.id IS NOT NULL;

-- Inserir alguns alertas de exemplo baseados nos equipamentos existentes
INSERT IGNORE INTO alerts (equipment_id, tipo, prioridade, status, descricao, data_vencimento, notificados, escalonamento_nivel) 
SELECT 
    e.id,
    'MANUTENCAO',
    'ALTA',
    'ATIVO',
    CONCAT('Manutenção preventiva obrigatória do equipamento ', e.name),
    DATE_ADD(CURDATE(), INTERVAL 15 DAY),
    JSON_ARRAY('manutencao@hospital.com', 'gestor@hospital.com'),
    1
FROM equipment e
WHERE e.id IS NOT NULL
LIMIT 5;

INSERT IGNORE INTO alerts (equipment_id, tipo, prioridade, status, descricao, data_vencimento, notificados, escalonamento_nivel) 
SELECT 
    e.id,
    'CALIBRACAO',
    'MEDIA',
    'ATIVO',
    CONCAT('Calibração anual obrigatória - ', e.name),
    DATE_ADD(CURDATE(), INTERVAL -5 DAY), -- Alguns atrasados para teste
    JSON_ARRAY('calibracao@hospital.com'),
    2
FROM equipment e
WHERE e.id IS NOT NULL
LIMIT 3;

-- Criar trigger para atualizar automaticamente o histórico
DELIMITER $$

CREATE TRIGGER alert_history_insert 
AFTER INSERT ON alerts
FOR EACH ROW
BEGIN
    INSERT INTO alert_history (alert_id, acao, observacoes, dados_anteriores)
    VALUES (NEW.id, 'CRIADO', 'Alerta criado automaticamente', JSON_OBJECT(
        'tipo', NEW.tipo,
        'prioridade', NEW.prioridade,
        'status', NEW.status,
        'data_vencimento', NEW.data_vencimento
    ));
END$$

CREATE TRIGGER alert_history_update 
AFTER UPDATE ON alerts
FOR EACH ROW
BEGIN
    DECLARE acao_tipo VARCHAR(20);
    
    -- Determinar o tipo de ação baseado na mudança de status
    IF OLD.status != NEW.status THEN
        CASE NEW.status
            WHEN 'RESOLVIDO' THEN SET acao_tipo = 'RESOLVIDO';
            WHEN 'IGNORADO' THEN SET acao_tipo = 'IGNORADO';
            WHEN 'ESCALADO' THEN SET acao_tipo = 'ESCALADO';
            WHEN 'ATIVO' THEN SET acao_tipo = 'REABERTO';
            ELSE SET acao_tipo = 'ATUALIZADO';
        END CASE;
    ELSE
        SET acao_tipo = 'ATUALIZADO';
    END IF;
    
    INSERT INTO alert_history (alert_id, acao, usuario_id, observacoes, dados_anteriores)
    VALUES (NEW.id, acao_tipo, NEW.resolvido_por, NEW.observacoes, JSON_OBJECT(
        'status_anterior', OLD.status,
        'prioridade_anterior', OLD.prioridade,
        'escalonamento_anterior', OLD.escalonamento_nivel
    ));
END$$

DELIMITER ;

-- Criar view para facilitar consultas de alertas com informações do equipamento
CREATE OR REPLACE VIEW view_alerts_complete AS
SELECT 
    a.*,
    e.name as equipment_name,
    e.model as equipment_model,
    e.serial_number as equipment_serial,
    e.numeroPatrimonio as equipment_patrimonio,
    s.name as sector_name,
    c.name as category_name,
    sub.name as subsector_name,
    u.name as resolved_by_name,
    -- Calcular próximo escalonamento baseado na data de criação
    DATE_ADD(a.data_criacao, INTERVAL (a.escalonamento_nivel * 7) DAY) as proximo_escalonamento_calculado,
    -- Status de urgência baseado nos dias de atraso
    CASE 
        WHEN a.dias_atraso > 30 THEN 'CRITICO'
        WHEN a.dias_atraso > 7 THEN 'URGENTE'
        WHEN a.dias_atraso > 0 THEN 'ATRASADO'
        WHEN a.dias_atraso = 0 THEN 'VENCE_HOJE'
        ELSE 'NO_PRAZO'
    END as urgencia_status
FROM alerts a
LEFT JOIN equipment e ON a.equipment_id = e.id
LEFT JOIN sectors s ON e.sector_id = s.id
LEFT JOIN categories c ON e.category_id = c.id
LEFT JOIN subsectors sub ON e.subsector_id = sub.id
LEFT JOIN users u ON a.resolvido_por = u.id;

-- Comentários para documentação
ALTER TABLE alerts COMMENT = 'Tabela principal de alertas do sistema de manutenção hospitalar';
ALTER TABLE alert_history COMMENT = 'Histórico de todas as ações realizadas nos alertas';
ALTER TABLE alert_configurations COMMENT = 'Configurações de alertas automáticos por equipamento e tipo';