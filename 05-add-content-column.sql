-- Adicionar coluna 'content' à tabela service_description_templates
-- Arquivo: 05-add-content-column.sql

USE hospital_maintenance;

-- Adicionar coluna content
ALTER TABLE service_description_templates 
ADD COLUMN content TEXT AFTER description;

-- Migrar dados da description para content
UPDATE service_description_templates 
SET content = description;

-- Atualizar descriptions para serem mais curtas (resumos)
UPDATE service_description_templates 
SET description = CASE 
    WHEN id = 1 THEN 'Inspeção visual e teste básico de funcionamento'
    WHEN id = 2 THEN 'Substituição de filtros e verificação de vedações'
    WHEN id = 3 THEN 'Identificação e reparo de vazamentos'
    WHEN id = 4 THEN 'Instalação completa com testes iniciais'
    WHEN id = 5 THEN 'Calibração e certificação de instrumentos'
    WHEN id = 6 THEN 'Limpeza completa e desinfecção'
    WHEN id = 7 THEN 'Substituição de peças defeituosas'
    WHEN id = 8 THEN 'Verificação de sistemas de segurança'
    WHEN id = 9 THEN 'Atualização e backup de software'
    WHEN id = 10 THEN 'Testes de performance e documentação'
    ELSE description
END;

SELECT 'Coluna content adicionada com sucesso!' as status;