-- Criar tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    is_electrical BOOLEAN DEFAULT FALSE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Criar tabela de subsetores
CREATE TABLE IF NOT EXISTS subsectors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sector_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sector_id) REFERENCES sectors(id) ON DELETE CASCADE
);

-- Inserir categorias baseadas nos dados mockados
INSERT INTO categories (id, name, is_electrical, description) VALUES
(1, 'Equipamentos Respiratórios', TRUE, 'Equipamentos para suporte respiratório'),
(2, 'Equipamentos de Monitoramento', TRUE, 'Equipamentos para monitoramento de pacientes'),
(3, 'Equipamentos de Diagnóstico', TRUE, 'Equipamentos para diagnóstico médico'),
(4, 'Equipamentos Cirúrgicos', FALSE, 'Equipamentos para procedimentos cirúrgicos'),
(5, 'Equipamentos de Laboratório', TRUE, 'Equipamentos para análises laboratoriais'),
(6, 'Equipamentos de Monitoramento (Elétrico)', TRUE, 'Equipamentos elétricos de monitoramento');

-- Inserir subsetores baseados nos dados mockados
INSERT INTO subsectors (id, name, description, sector_id) VALUES
(1, 'UTI Adulto', 'UTI para pacientes adultos', 1),
(2, 'UTI Pediátrica', 'UTI para pacientes pediátricos', 1),
(3, 'Sala de Trauma', 'Atendimento de trauma', 2),
(4, 'Observação', 'Sala de observação', 2);

-- Atualizar equipamentos existentes para usar os IDs das categorias e subsetores
-- (Isso será feito posteriormente quando tivermos a lógica de mapeamento)