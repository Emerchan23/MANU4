-- Script para remover todas as tabelas relacionadas a empresas
-- Execute este script no seu banco MariaDB

USE sistema_manutencao;

-- Remover tabelas relacionadas a empresas
DROP TABLE IF EXISTS empresa_especialidade;
DROP TABLE IF EXISTS company_specialties;
DROP TABLE IF EXISTS third_party_companies;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS empresas;

-- Verificar se as tabelas foram removidas
SHOW TABLES LIKE '%empresa%';
SHOW TABLES LIKE '%compan%';