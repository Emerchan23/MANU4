-- Sistema de Validação de Integridade Referencial
-- Criação das tabelas necessárias para o sistema de validação (MySQL/MariaDB)

-- Tabela de Regras de Validação
CREATE TABLE IF NOT EXISTS validation_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    rules JSON NOT NULL,
    custom_messages JSON DEFAULT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Criar índices para validation_rules
CREATE INDEX idx_validation_rules_entity_type ON validation_rules(entity_type);
CREATE INDEX idx_validation_rules_active ON validation_rules(is_active);

-- Tabela de Cache de Dependências
CREATE TABLE IF NOT EXISTS dependency_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    dependencies JSON NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Criar índices para dependency_cache
CREATE UNIQUE INDEX idx_dependency_cache_entity ON dependency_cache(entity_type, entity_id);
CREATE INDEX idx_dependency_cache_updated ON dependency_cache(last_updated);

-- Tabela de Logs de Validação
CREATE TABLE IF NOT EXISTS validation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    validation_type VARCHAR(50) NOT NULL DEFAULT 'delete_check',
    validation_result ENUM('SUCCESS', 'FAILED', 'WARNING') NOT NULL,
    dependency_count INT DEFAULT 0,
    error_message TEXT DEFAULT NULL,
    user_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para validation_logs
CREATE INDEX idx_validation_logs_entity ON validation_logs(entity_type, entity_id);
CREATE INDEX idx_validation_logs_created_at ON validation_logs(created_at DESC);
CREATE INDEX idx_validation_logs_user ON validation_logs(user_id);
CREATE INDEX idx_validation_logs_result ON validation_logs(validation_result);

-- Mapeamento de relacionamentos para validação automática
CREATE TABLE IF NOT EXISTS entity_relationships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_entity VARCHAR(50) NOT NULL,
    child_entity VARCHAR(50) NOT NULL,
    foreign_key_column VARCHAR(50) NOT NULL,
    relationship_type VARCHAR(20) DEFAULT 'one_to_many',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para entity_relationships
CREATE INDEX idx_entity_relationships_parent ON entity_relationships(parent_entity);
CREATE INDEX idx_entity_relationships_child ON entity_relationships(child_entity);
CREATE INDEX idx_entity_relationships_active ON entity_relationships(is_active);

-- Dados iniciais de relacionamentos
INSERT IGNORE INTO entity_relationships (parent_entity, child_entity, foreign_key_column) VALUES
('companies', 'sectors', 'company_id'),
('companies', 'equipment', 'company_id'),
('companies', 'users', 'company_id'),
('sectors', 'subsectors', 'sector_id'),
('sectors', 'equipment', 'sector_id'),
('sectors', 'users', 'sector_id'),
('subsectors', 'equipment', 'subsector_id'),
('subsectors', 'users', 'subsector_id'),
('equipment', 'service_orders', 'equipment_id'),
('equipment', 'maintenance_plans', 'equipment_id'),
('equipment', 'alerts', 'equipment_id'),
('users', 'service_orders', 'created_by'),
('users', 'alerts', 'created_by'),
('template_categories', 'service_templates', 'category_id'),
('service_templates', 'service_orders', 'template_id'),
('specialties', 'users', 'specialty_id');

-- Dados iniciais de regras de validação
INSERT IGNORE INTO validation_rules (entity_type, rules, custom_messages) VALUES
('companies', '{"check_sectors": true, "check_equipment": true, "check_users": true, "check_service_orders": true}', '{"sectors": "Esta empresa possui {count} setores vinculados", "equipment": "Esta empresa possui {count} equipamentos vinculados", "users": "Esta empresa possui {count} usuários vinculados", "service_orders": "Esta empresa possui {count} ordens de serviço vinculadas"}'),
('sectors', '{"check_subsectors": true, "check_equipment": true, "check_users": true}', '{"subsectors": "Este setor possui {count} subsetores vinculados", "equipment": "Este setor possui {count} equipamentos vinculados", "users": "Este setor possui {count} usuários vinculados"}'),
('subsectors', '{"check_equipment": true, "check_users": true}', '{"equipment": "Este subsetor possui {count} equipamentos vinculados", "users": "Este subsetor possui {count} usuários vinculados"}'),
('equipment', '{"check_service_orders": true, "check_maintenance_plans": true, "check_alerts": true}', '{"service_orders": "Este equipamento possui {count} ordens de serviço vinculadas", "maintenance_plans": "Este equipamento possui {count} planos de manutenção vinculados", "alerts": "Este equipamento possui {count} alertas vinculados"}'),
('users', '{"check_service_orders": true, "check_alerts": true}', '{"service_orders": "Este usuário possui {count} ordens de serviço vinculadas", "alerts": "Este usuário possui {count} alertas vinculados"}'),
('template_categories', '{"check_service_templates": true}', '{"service_templates": "Esta categoria possui {count} templates vinculados"}'),
('service_templates', '{"check_service_orders": true}', '{"service_orders": "Este template possui {count} ordens de serviço vinculadas"}'),
('specialties', '{"check_users": true}', '{"users": "Esta especialidade possui {count} usuários vinculados"}');