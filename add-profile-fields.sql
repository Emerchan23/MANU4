-- Adicionar campos phone e department à tabela users
USE hospital_maintenance;

-- Adicionar coluna phone (telefone)
ALTER TABLE users 
ADD COLUMN phone VARCHAR(20) NULL COMMENT 'Telefone do usuário';

-- Adicionar coluna department (departamento)
ALTER TABLE users 
ADD COLUMN department VARCHAR(100) NULL COMMENT 'Departamento do usuário';

-- Verificar estrutura atualizada
DESCRIBE users;

SELECT 'Campos phone e department adicionados com sucesso!' as status;