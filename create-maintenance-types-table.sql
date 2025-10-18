-- =====================================================
-- CRIAÇÃO DA TABELA MAINTENANCE_TYPES
-- Sistema de Manutenção - MariaDB
-- =====================================================

-- Criar tabela maintenance_types
CREATE TABLE IF NOT EXISTS maintenance_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    category ENUM('preventiva', 'corretiva', 'calibracao', 'instalacao', 'desinstalacao', 'consultoria') NOT NULL DEFAULT 'preventiva',
    isActive TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices
    INDEX idx_name (name),
    INDEX idx_category (category),
    INDEX idx_is_active (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir dados iniciais
INSERT INTO maintenance_types (name, description, category, isActive) VALUES
('Preventiva', 'Manutenção preventiva regular', 'preventiva', 1),
('Corretiva', 'Manutenção corretiva para reparos', 'corretiva', 1),
('Calibração', 'Calibração de equipamentos', 'calibracao', 1),
('Instalação', 'Instalação de novos equipamentos', 'instalacao', 1),
('Desinstalação', 'Remoção de equipamentos', 'desinstalacao', 1),
('Consultoria', 'Serviços de consultoria técnica', 'consultoria', 1);

-- Adicionar chave estrangeira na tabela service_orders
ALTER TABLE service_orders 
ADD CONSTRAINT fk_service_orders_maintenance_type 
FOREIGN KEY (maintenance_type_id) REFERENCES maintenance_types(id) 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Verificar se a estrutura foi criada corretamente
SELECT 'Tabela maintenance_types criada com sucesso!' as status;

-- Mostrar estrutura da tabela
DESCRIBE maintenance_types;

-- Mostrar dados inseridos
SELECT * FROM maintenance_types WHERE isActive = 1;