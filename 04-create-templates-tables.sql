-- Criação das tabelas para sistema de templates de descrição de serviços
-- Arquivo: 04-create-templates-tables.sql
-- Data: $(date)

USE hospital_maintenance;

-- Tabela de categorias de templates
CREATE TABLE IF NOT EXISTS template_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de templates de descrição de serviços
CREATE TABLE IF NOT EXISTS service_description_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES template_categories(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_category (category_id),
    INDEX idx_active (is_active),
    INDEX idx_name (name)
);

-- Dados iniciais de categorias
INSERT INTO template_categories (name, description) VALUES
('Manutenção Preventiva', 'Templates para manutenções preventivas'),
('Manutenção Corretiva', 'Templates para manutenções corretivas'),
('Instalação', 'Templates para instalação de equipamentos'),
('Calibração', 'Templates para calibração de equipamentos'),
('Limpeza', 'Templates para limpeza e higienização');

-- Dados iniciais de templates
INSERT INTO service_description_templates (name, description, category_id) VALUES
('Manutenção Preventiva Básica', 'Realizar inspeção visual, limpeza externa, verificação de conexões e teste de funcionamento.', 1),
('Troca de Filtros', 'Substituir filtros conforme especificação do fabricante. Verificar vedações e realizar teste de funcionamento.', 1),
('Reparo de Vazamento', 'Identificar origem do vazamento, substituir componentes danificados e testar estanqueidade.', 2),
('Instalação de Equipamento', 'Desembalar, posicionar, conectar utilidades, configurar parâmetros e realizar testes iniciais.', 3),
('Calibração de Instrumentos', 'Verificar precisão, ajustar conforme padrões, emitir certificado de calibração.', 4),
('Limpeza Geral', 'Realizar limpeza completa do equipamento, desinfecção e verificação de funcionamento.', 5),
('Substituição de Peças', 'Identificar peças defeituosas, substituir por peças originais e testar funcionamento.', 2),
('Verificação de Segurança', 'Verificar sistemas de segurança, alarmes e dispositivos de proteção.', 1),
('Atualização de Software', 'Realizar backup, instalar atualizações de software e verificar compatibilidade.', 2),
('Teste de Performance', 'Executar testes de performance, verificar parâmetros e documentar resultados.', 4);

-- Comentários sobre as tabelas
ALTER TABLE template_categories COMMENT = 'Categorias para organizar templates de descrição de serviços';
ALTER TABLE service_description_templates COMMENT = 'Templates pré-definidos para descrições de serviços de manutenção';

SELECT 'Tabelas de templates criadas com sucesso!' as status;