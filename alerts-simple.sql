-- Criação das tabelas de alertas para o Sistema de Manutenção
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
    dias_atraso INT AS (DATEDIFF(CURDATE(), data_vencimento)) STORED,
    notificados JSON DEFAULT NULL,
    escalonamento_nivel INT DEFAULT 1,
    observacoes TEXT DEFAULT NULL,
    resolvido_por INT DEFAULT NULL,
    data_resolucao TIMESTAMP NULL DEFAULT NULL,
    proximo_escalonamento DATE DEFAULT NULL,
    
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    
    INDEX idx_equipment_id (equipment_id),
    INDEX idx_status (status),
    INDEX idx_prioridade (prioridade),
    INDEX idx_tipo (tipo),
    INDEX idx_data_vencimento (data_vencimento)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de histórico de ações nos alertas
CREATE TABLE IF NOT EXISTS alert_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alert_id INT NOT NULL,
    acao ENUM('CRIADO', 'RESOLVIDO', 'IGNORADO', 'ESCALADO', 'REABERTO', 'ATUALIZADO') NOT NULL,
    usuario_id INT DEFAULT NULL,
    observacoes TEXT DEFAULT NULL,
    data_acao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dados_anteriores JSON DEFAULT NULL,
    
    FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE,
    
    INDEX idx_alert_id (alert_id),
    INDEX idx_data_acao (data_acao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de configurações de alertas
CREATE TABLE IF NOT EXISTS alert_configurations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('MANUTENCAO', 'CALIBRACAO', 'GARANTIA', 'INSPECAO', 'LIMPEZA') NOT NULL,
    dias_antecedencia INT NOT NULL DEFAULT 7,
    escalonamento_dias INT NOT NULL DEFAULT 3,
    emails_notificacao JSON DEFAULT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir configurações padrão
INSERT IGNORE INTO alert_configurations (tipo, dias_antecedencia, escalonamento_dias, emails_notificacao) VALUES
('MANUTENCAO', 7, 3, '["manutencao@hospital.com"]'),
('CALIBRACAO', 15, 5, '["calibracao@hospital.com"]'),
('GARANTIA', 30, 7, '["garantia@hospital.com"]'),
('INSPECAO', 5, 2, '["inspecao@hospital.com"]'),
('LIMPEZA', 3, 1, '["limpeza@hospital.com"]');

-- Inserir alguns alertas de exemplo
INSERT IGNORE INTO alerts (equipment_id, tipo, prioridade, status, descricao, data_vencimento, observacoes) VALUES
(1, 'MANUTENCAO', 'ALTA', 'ATIVO', 'Manutenção preventiva do equipamento de raio-X', DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'Verificar calibração e limpeza'),
(2, 'CALIBRACAO', 'MEDIA', 'ATIVO', 'Calibração anual do monitor cardíaco', DATE_ADD(CURDATE(), INTERVAL 10 DAY), 'Agendar com técnico especializado'),
(3, 'GARANTIA', 'BAIXA', 'ATIVO', 'Garantia do ventilador expira em breve', DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'Verificar renovação de contrato'),
(1, 'INSPECAO', 'ALTA', 'ATIVO', 'Inspeção de segurança obrigatória', DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Inspeção em atraso - prioridade máxima'),
(4, 'LIMPEZA', 'MEDIA', 'RESOLVIDO', 'Limpeza técnica do equipamento de ultrassom', DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'Limpeza realizada conforme protocolo');