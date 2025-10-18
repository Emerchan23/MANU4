-- Criação das tabelas para o sistema de Manutenção Preventiva
-- Usar apenas MariaDB, sem localStorage

-- Tabela de planos de manutenção preventiva
CREATE TABLE IF NOT EXISTS preventive_maintenance_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    frequency ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL') NOT NULL,
    equipment_id INT,
    sector_id INT,
    maintenance_type ENUM('LUBRICATION', 'CLEANING', 'INSPECTION', 'CALIBRATION', 'REPLACEMENT', 'ADJUSTMENT') NOT NULL,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
    estimated_duration INT DEFAULT 0, -- em minutos
    estimated_cost DECIMAL(10,2) DEFAULT 0.00,
    tasks JSON, -- Lista de tarefas do plano
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE SET NULL,
    INDEX idx_equipment_id (equipment_id),
    INDEX idx_sector_id (sector_id),
    INDEX idx_frequency (frequency),
    INDEX idx_is_active (is_active)
);

-- Tabela de manutenções preventivas (instâncias agendadas/executadas)
CREATE TABLE IF NOT EXISTS preventive_maintenances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT,
    equipment_id INT NOT NULL,
    equipment_name VARCHAR(255),
    equipment_code VARCHAR(100),
    sector_id INT,
    sector_name VARCHAR(255),
    plan_name VARCHAR(255),
    description TEXT,
    frequency ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL'),
    maintenance_type ENUM('LUBRICATION', 'CLEANING', 'INSPECTION', 'CALIBRATION', 'REPLACEMENT', 'ADJUSTMENT'),
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
    status ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'CANCELLED') DEFAULT 'SCHEDULED',
    scheduled_date DATETIME NOT NULL,
    next_due_date DATETIME,
    last_completed_date DATETIME,
    completed_at DATETIME,
    completed_by VARCHAR(100),
    assigned_technician_id INT,
    assigned_technician_name VARCHAR(255),
    assigned_company_id INT,
    assigned_company_name VARCHAR(255),
    estimated_duration INT DEFAULT 0, -- em minutos
    actual_duration INT DEFAULT 0, -- em minutos
    estimated_cost DECIMAL(10,2) DEFAULT 0.00,
    actual_cost DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT,
    completion_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(100),
    FOREIGN KEY (plan_id) REFERENCES preventive_maintenance_plans(id) ON DELETE SET NULL,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_company_id) REFERENCES companies(id) ON DELETE SET NULL,
    INDEX idx_plan_id (plan_id),
    INDEX idx_equipment_id (equipment_id),
    INDEX idx_sector_id (sector_id),
    INDEX idx_status (status),
    INDEX idx_scheduled_date (scheduled_date),
    INDEX idx_next_due_date (next_due_date),
    INDEX idx_priority (priority)
);

-- Tabela de tarefas específicas de cada manutenção
CREATE TABLE IF NOT EXISTS maintenance_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    maintenance_id INT NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at DATETIME,
    completed_by VARCHAR(100),
    notes TEXT,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (maintenance_id) REFERENCES preventive_maintenances(id) ON DELETE CASCADE,
    INDEX idx_maintenance_id (maintenance_id),
    INDEX idx_is_completed (is_completed),
    INDEX idx_order_index (order_index)
);

-- Inserir alguns dados de exemplo
INSERT INTO preventive_maintenance_plans (name, description, frequency, maintenance_type, priority, estimated_duration, estimated_cost, tasks, created_by, updated_by) VALUES
('Manutenção Mensal Autoclave', 'Verificação de vedações, calibração de temperatura e pressão', 'MONTHLY', 'INSPECTION', 'HIGH', 120, 350.00, '["Verificar vedações", "Calibrar temperatura", "Calibrar pressão", "Testar ciclos"]', 'admin', 'admin'),
('Calibração Trimestral Monitor', 'Calibração de sensores e verificação de alarmes', 'QUARTERLY', 'CALIBRATION', 'CRITICAL', 180, 800.00, '["Calibrar sensores", "Verificar alarmes", "Testar parâmetros", "Documentar resultados"]', 'admin', 'admin'),
('Manutenção Semanal Ventilador', 'Limpeza de filtros e verificação de circuitos', 'WEEKLY', 'CLEANING', 'HIGH', 60, 150.00, '["Limpar filtros", "Verificar circuitos", "Testar funcionamento", "Registrar parâmetros"]', 'admin', 'admin');

-- Inserir algumas manutenções de exemplo (assumindo que existem equipamentos com IDs 1, 2, 3)
INSERT INTO preventive_maintenances (
    plan_id, equipment_id, equipment_name, equipment_code, sector_id, sector_name, 
    plan_name, description, frequency, maintenance_type, priority, status, 
    scheduled_date, next_due_date, estimated_duration, estimated_cost, 
    assigned_technician_name, created_by, updated_by
) VALUES
(1, 1, 'Autoclave Vertical AV-100', 'AV-100-001', 1, 'Centro Cirúrgico', 
 'Manutenção Mensal Autoclave', 'Verificação de vedações, calibração de temperatura e pressão', 
 'MONTHLY', 'INSPECTION', 'HIGH', 'SCHEDULED', 
 '2024-12-15 09:00:00', '2025-01-15 09:00:00', 120, 350.00, 
 'João Silva', 'admin', 'admin'),

(2, 2, 'Monitor Multiparamétrico MP-500', 'MP-500-002', 2, 'UTI', 
 'Calibração Trimestral', 'Calibração de sensores e verificação de alarmes', 
 'QUARTERLY', 'CALIBRATION', 'CRITICAL', 'OVERDUE', 
 '2024-10-30 14:00:00', '2025-01-30 14:00:00', 180, 800.00, 
 'TechMed Ltda', 'admin', 'admin'),

(3, 3, 'Ventilador Pulmonar VP-300', 'VP-300-003', 2, 'UTI', 
 'Manutenção Semanal Ventilador', 'Limpeza de filtros e verificação de circuitos', 
 'WEEKLY', 'CLEANING', 'HIGH', 'COMPLETED', 
 '2024-11-13 08:00:00', '2024-12-20 08:00:00', 60, 150.00, 
 'Maria Santos', 'admin', 'maria.santos');

-- Inserir tarefas para as manutenções
INSERT INTO maintenance_tasks (maintenance_id, task_name, description, is_completed, order_index) VALUES
(1, 'Verificar vedações', 'Inspeção visual e teste de vedações da autoclave', FALSE, 1),
(1, 'Calibrar temperatura', 'Calibração do sensor de temperatura', FALSE, 2),
(1, 'Calibrar pressão', 'Calibração do sensor de pressão', FALSE, 3),
(1, 'Testar ciclos', 'Executar ciclos de teste completos', FALSE, 4),

(2, 'Calibrar sensores', 'Calibração de todos os sensores do monitor', FALSE, 1),
(2, 'Verificar alarmes', 'Teste de todos os alarmes e alertas', FALSE, 2),
(2, 'Testar parâmetros', 'Verificação de todos os parâmetros vitais', FALSE, 3),
(2, 'Documentar resultados', 'Documentação completa dos resultados', FALSE, 4),

(3, 'Limpar filtros', 'Limpeza e substituição de filtros', TRUE, 1),
(3, 'Verificar circuitos', 'Inspeção dos circuitos pneumáticos', TRUE, 2),
(3, 'Testar funcionamento', 'Teste completo de funcionamento', TRUE, 3),
(3, 'Registrar parâmetros', 'Registro de todos os parâmetros', TRUE, 4);

-- Atualizar a manutenção 3 como concluída
UPDATE preventive_maintenances 
SET status = 'COMPLETED', 
    completed_at = '2024-11-13 09:45:00', 
    completed_by = 'maria.santos',
    actual_duration = 45,
    actual_cost = 120.00,
    completion_notes = 'Manutenção realizada com sucesso. Todos os parâmetros dentro da normalidade.'
WHERE id = 3;