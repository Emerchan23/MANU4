-- =====================================================
-- CRIAÇÃO DAS TABELAS DO MÓDULO DE ORDEM DE SERVIÇO
-- =====================================================

-- Desabilitar verificação de chaves estrangeiras temporariamente
SET FOREIGN_KEY_CHECKS = 0;

-- Tabela de categorias de templates
CREATE TABLE IF NOT EXISTS template_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de templates de serviço
CREATE TABLE IF NOT EXISTS service_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description_template TEXT NOT NULL,
    maintenance_type ENUM('PREVENTIVA', 'CORRETIVA', 'PREDITIVA', 'EMERGENCIAL') NOT NULL,
    estimated_cost DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES template_categories(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela principal de ordens de serviço
CREATE TABLE IF NOT EXISTS service_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    equipment_id INT NOT NULL,
    company_id INT NOT NULL,
    maintenance_type ENUM('PREVENTIVA', 'CORRETIVA', 'PREDITIVA', 'EMERGENCIAL') NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('BAIXA', 'MEDIA', 'ALTA', 'CRITICA') DEFAULT 'MEDIA',
    status ENUM('ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_PECA', 'CONCLUIDA', 'CANCELADA') DEFAULT 'ABERTA',
    estimated_cost DECIMAL(10,2) DEFAULT 0.00,
    actual_cost DECIMAL(10,2) DEFAULT 0.00,
    scheduled_date DATE NULL,
    completion_date DATE NULL,
    observations TEXT NULL,
    created_by INT NOT NULL,
    assigned_to INT NULL,
    template_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE RESTRICT,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (template_id) REFERENCES service_templates(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de histórico de manutenção
CREATE TABLE IF NOT EXISTS maintenance_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_order_id INT NOT NULL,
    equipment_id INT NOT NULL,
    action_type ENUM('CRIACAO', 'INICIO', 'PAUSA', 'CONCLUSAO', 'CANCELAMENTO', 'OBSERVACAO') NOT NULL,
    description TEXT NOT NULL,
    cost DECIMAL(10,2) DEFAULT 0.00,
    execution_date DATE NOT NULL,
    performed_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (service_order_id) REFERENCES service_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE RESTRICT,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de agendamento de manutenções
CREATE TABLE IF NOT EXISTS maintenance_schedule (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL,
    maintenance_type ENUM('PREVENTIVA', 'CORRETIVA', 'PREDITIVA') NOT NULL,
    description TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    recurrence_type ENUM('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY') DEFAULT 'NONE',
    recurrence_interval INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de notificações agendadas
CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    notification_type ENUM('LEMBRETE', 'VENCIMENTO', 'ATRASO') NOT NULL,
    notification_date DATE NOT NULL,
    is_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (schedule_id) REFERENCES maintenance_schedule(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CRIAÇÃO DE ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para service_orders
CREATE INDEX IF NOT EXISTS idx_service_orders_equipment ON service_orders(equipment_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_company ON service_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_priority ON service_orders(priority);
CREATE INDEX IF NOT EXISTS idx_service_orders_scheduled_date ON service_orders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_service_orders_created_at ON service_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_orders_maintenance_type ON service_orders(maintenance_type);

-- Índices para maintenance_history
CREATE INDEX IF NOT EXISTS idx_maintenance_history_service_order ON maintenance_history(service_order_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_history_equipment ON maintenance_history(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_history_execution_date ON maintenance_history(execution_date DESC);

-- Índices para maintenance_schedule
CREATE INDEX IF NOT EXISTS idx_maintenance_schedule_equipment ON maintenance_schedule(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedule_date ON maintenance_schedule(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedule_active ON maintenance_schedule(is_active);

-- Índices para service_templates
CREATE INDEX IF NOT EXISTS idx_service_templates_category ON service_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_service_templates_type ON service_templates(maintenance_type);
CREATE INDEX IF NOT EXISTS idx_service_templates_active ON service_templates(is_active);

-- Índices para scheduled_notifications
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_schedule ON scheduled_notifications(schedule_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_date ON scheduled_notifications(notification_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_sent ON scheduled_notifications(is_sent);

-- =====================================================
-- INSERÇÃO DE DADOS INICIAIS
-- =====================================================

-- Categorias de templates
INSERT IGNORE INTO template_categories (id, name, description) VALUES
(1, 'Manutenção Preventiva', 'Templates para manutenções preventivas regulares'),
(2, 'Manutenção Corretiva', 'Templates para correção de falhas e problemas'),
(3, 'Calibração', 'Templates para calibração de equipamentos'),
(4, 'Limpeza e Higienização', 'Templates para procedimentos de limpeza'),
(5, 'Inspeção Técnica', 'Templates para inspeções e verificações técnicas');

-- Templates de serviço
INSERT IGNORE INTO service_templates (id, category_id, name, description_template, maintenance_type, estimated_cost) VALUES
(1, 1, 'Manutenção Preventiva Básica', 'Verificação geral do equipamento:\n- Inspeção visual externa\n- Teste de funcionamento\n- Limpeza básica\n- Verificação de cabos e conexões\n- Documentação do estado atual', 'PREVENTIVA', 150.00),
(2, 2, 'Correção de Falha Elétrica', 'Diagnóstico e correção de problema elétrico:\n- Verificação de alimentação\n- Teste de componentes elétricos\n- Substituição de peças defeituosas\n- Teste final de funcionamento\n- Relatório de correção', 'CORRETIVA', 300.00),
(3, 3, 'Calibração de Precisão', 'Calibração completa do equipamento:\n- Verificação de padrões de referência\n- Ajuste de parâmetros\n- Emissão de certificado de calibração\n- Documentação técnica\n- Registro de conformidade', 'PREVENTIVA', 500.00),
(4, 4, 'Limpeza Hospitalar Especializada', 'Procedimento de limpeza e desinfecção:\n- Desligamento seguro do equipamento\n- Limpeza com produtos apropriados\n- Desinfecção conforme protocolo\n- Verificação de funcionamento pós-limpeza\n- Liberação para uso', 'PREVENTIVA', 80.00),
(5, 5, 'Inspeção de Segurança', 'Inspeção completa de segurança:\n- Verificação de sistemas de proteção\n- Teste de alarmes e indicadores\n- Análise de riscos operacionais\n- Documentação de conformidade\n- Recomendações de melhorias', 'PREDITIVA', 200.00),
(6, 2, 'Substituição de Componente', 'Substituição de peça ou componente:\n- Diagnóstico da falha\n- Identificação da peça necessária\n- Substituição do componente\n- Teste de funcionamento\n- Atualização de documentação', 'CORRETIVA', 400.00),
(7, 1, 'Manutenção Preventiva Avançada', 'Manutenção preventiva completa:\n- Desmontagem parcial\n- Limpeza interna detalhada\n- Lubrificação de componentes\n- Ajustes e calibrações\n- Testes de performance\n- Relatório técnico completo', 'PREVENTIVA', 350.00),
(8, 2, 'Reparo de Emergência', 'Atendimento emergencial:\n- Diagnóstico rápido\n- Solução temporária ou definitiva\n- Priorização máxima\n- Documentação de emergência\n- Plano de acompanhamento', 'EMERGENCIAL', 600.00);

-- Reabilitar verificação de chaves estrangeiras
SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- TRIGGERS PARA AUDITORIA E CONTROLE
-- =====================================================

-- Trigger para criar entrada no histórico quando uma OS é criada
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS tr_service_order_created
    AFTER INSERT ON service_orders
    FOR EACH ROW
BEGIN
    INSERT INTO maintenance_history (
        service_order_id, 
        equipment_id, 
        action_type, 
        description, 
        execution_date, 
        performed_by
    ) VALUES (
        NEW.id,
        NEW.equipment_id,
        'CRIACAO',
        CONCAT('Ordem de serviço ', NEW.order_number, ' criada - Tipo: ', NEW.maintenance_type, ' - Prioridade: ', NEW.priority),
        CURDATE(),
        NEW.created_by
    );
END$$

-- Trigger para registrar mudanças de status
DELIMITER $$
CREATE TRIGGER IF NOT EXISTS tr_service_order_status_updated
    AFTER UPDATE ON service_orders
    FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO maintenance_history (
            service_order_id, 
            equipment_id, 
            action_type, 
            description, 
            execution_date, 
            performed_by
        ) VALUES (
            NEW.id,
            NEW.equipment_id,
            CASE NEW.status
                WHEN 'EM_ANDAMENTO' THEN 'INICIO'
                WHEN 'CONCLUIDA' THEN 'CONCLUSAO'
                WHEN 'CANCELADA' THEN 'CANCELAMENTO'
                ELSE 'OBSERVACAO'
            END,
            CONCAT('Status alterado de ', OLD.status, ' para ', NEW.status),
            CURDATE(),
            NEW.created_by
        );
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

SELECT 'Tabelas criadas com sucesso!' as status;
SELECT COUNT(*) as total_categories FROM template_categories;
SELECT COUNT(*) as total_templates FROM service_templates;