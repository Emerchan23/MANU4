-- =====================================================
-- CORREÇÕES DDL PARA TABELA EQUIPAMENTOS
-- =====================================================

USE hospital_maintenance;

-- 1. CRIAR TABELA CATEGORIAS (se não existir)
CREATE TABLE IF NOT EXISTS categorias (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(120) NOT NULL UNIQUE,
    ativo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. MIGRAR DADOS DE CATEGORIES PARA CATEGORIAS (se necessário)
INSERT IGNORE INTO categorias (id, nome, ativo, created_at, updated_at)
SELECT id, name, 1, created_at, updated_at 
FROM categories 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories');

-- 3. AJUSTAR ESTRUTURA DA TABELA EQUIPMENT
-- 3.1. Adicionar coluna patrimonio se não existir
ALTER TABLE equipment 
ADD COLUMN IF NOT EXISTS patrimonio VARCHAR(32) NULL;

-- 3.2. Modificar coluna patrimonio_number para ser NOT NULL e UNIQUE
ALTER TABLE equipment 
MODIFY COLUMN patrimonio_number VARCHAR(32) NOT NULL;

-- 3.3. Adicionar índice único para patrimonio_number
ALTER TABLE equipment 
ADD UNIQUE INDEX IF NOT EXISTS idx_patrimonio_unique (patrimonio_number);

-- 3.4. Modificar coluna name para ser NOT NULL
ALTER TABLE equipment 
MODIFY COLUMN name VARCHAR(120) NOT NULL;

-- 3.5. Modificar coluna manufacturer (marca)
ALTER TABLE equipment 
MODIFY COLUMN manufacturer VARCHAR(80) NULL;

-- 3.6. Modificar coluna model
ALTER TABLE equipment 
MODIFY COLUMN model VARCHAR(120) NULL;

-- 3.7. Modificar coluna serial_number
ALTER TABLE equipment 
MODIFY COLUMN serial_number VARCHAR(64) NULL;

-- 3.8. Adicionar índice único para serial_number (ignorando NULLs)
-- Remover índice existente se houver
DROP INDEX IF EXISTS idx_serial_unique ON equipment;
-- Criar novo índice que permite múltiplos NULLs
CREATE UNIQUE INDEX idx_serial_unique ON equipment (serial_number) 
WHERE serial_number IS NOT NULL;

-- 3.9. Modificar coluna maintenance_frequency_days
ALTER TABLE equipment 
MODIFY COLUMN maintenance_frequency_days INT UNSIGNED NULL;

-- 3.10. Adicionar coluna status como ENUM se não existir
ALTER TABLE equipment 
ADD COLUMN IF NOT EXISTS status_enum ENUM('Ativo','Inativo','Em_Manutencao') NOT NULL DEFAULT 'Ativo';

-- 3.11. Migrar dados de status para status_enum
UPDATE equipment 
SET status_enum = CASE 
    WHEN status = 'ativo' THEN 'Ativo'
    WHEN status = 'inativo' THEN 'Inativo'
    WHEN status = 'em_manutencao' THEN 'Em_Manutencao'
    ELSE 'Ativo'
END;

-- 3.12. Remover coluna status antiga e renomear status_enum
ALTER TABLE equipment DROP COLUMN IF EXISTS status;
ALTER TABLE equipment CHANGE status_enum status ENUM('Ativo','Inativo','Em_Manutencao') NOT NULL DEFAULT 'Ativo';

-- 3.13. Modificar coluna observations
ALTER TABLE equipment 
MODIFY COLUMN observations TEXT NULL;

-- 4. ADICIONAR CHAVES ESTRANGEIRAS
-- 4.1. FK para categorias
ALTER TABLE equipment 
ADD CONSTRAINT IF NOT EXISTS fk_equipment_categoria 
FOREIGN KEY (category_id) REFERENCES categorias(id) 
ON UPDATE CASCADE ON DELETE SET NULL;

-- 4.2. FK para setores
ALTER TABLE equipment 
ADD CONSTRAINT IF NOT EXISTS fk_equipment_setor 
FOREIGN KEY (sector_id) REFERENCES setores(id) 
ON UPDATE CASCADE ON DELETE SET NULL;

-- 4.3. FK para subsetores
ALTER TABLE equipment 
ADD CONSTRAINT IF NOT EXISTS fk_equipment_subsetor 
FOREIGN KEY (subsector_id) REFERENCES subsetores(id) 
ON UPDATE CASCADE ON DELETE SET NULL;

-- 5. ADICIONAR CONSTRAINT PARA VALIDAR SUBSETOR PERTENCE AO SETOR
-- Primeiro, criar uma função para validar
DELIMITER //
CREATE TRIGGER IF NOT EXISTS trg_validate_subsetor_setor
BEFORE INSERT ON equipment
FOR EACH ROW
BEGIN
    DECLARE setor_do_subsetor INT;
    
    IF NEW.subsector_id IS NOT NULL AND NEW.sector_id IS NOT NULL THEN
        SELECT setor_id INTO setor_do_subsetor 
        FROM subsetores 
        WHERE id = NEW.subsector_id;
        
        IF setor_do_subsetor != NEW.sector_id THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Subsetor não pertence ao setor selecionado';
        END IF;
    END IF;
END//

CREATE TRIGGER IF NOT EXISTS trg_validate_subsetor_setor_update
BEFORE UPDATE ON equipment
FOR EACH ROW
BEGIN
    DECLARE setor_do_subsetor INT;
    
    IF NEW.subsector_id IS NOT NULL AND NEW.sector_id IS NOT NULL THEN
        SELECT setor_id INTO setor_do_subsetor 
        FROM subsetores 
        WHERE id = NEW.subsector_id;
        
        IF setor_do_subsetor != NEW.sector_id THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Subsetor não pertence ao setor selecionado';
        END IF;
    END IF;
END//
DELIMITER ;

-- 6. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_equipment_sector ON equipment(sector_id);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category_id);
CREATE INDEX IF NOT EXISTS idx_equipment_subsector ON equipment(subsector_id);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_installation_date ON equipment(installation_date);

-- 7. VERIFICAR INTEGRIDADE DOS DADOS
-- Listar equipamentos com referências órfãs
SELECT 'Equipamentos com categoria inexistente' as problema, COUNT(*) as quantidade
FROM equipment e 
LEFT JOIN categorias c ON e.category_id = c.id 
WHERE e.category_id IS NOT NULL AND c.id IS NULL;

SELECT 'Equipamentos com setor inexistente' as problema, COUNT(*) as quantidade
FROM equipment e 
LEFT JOIN setores s ON e.sector_id = s.id 
WHERE e.sector_id IS NOT NULL AND s.id IS NULL;

SELECT 'Equipamentos com subsetor inexistente' as problema, COUNT(*) as quantidade
FROM equipment e 
LEFT JOIN subsetores sub ON e.subsector_id = sub.id 
WHERE e.subsector_id IS NOT NULL AND sub.id IS NULL;

-- 8. COMENTÁRIOS FINAIS
SELECT 'Estrutura da tabela equipment corrigida com sucesso!' as resultado;