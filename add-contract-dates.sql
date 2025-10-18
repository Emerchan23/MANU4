-- Script para adicionar campos de vigência e vencimento do contrato na tabela companies
-- Arquivo: add-contract-dates.sql

USE hospital_maintenance;

-- Adicionar colunas para vigência e vencimento do contrato
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS contract_start_date DATE COMMENT 'Data de início da vigência do contrato',
ADD COLUMN IF NOT EXISTS contract_end_date DATE COMMENT 'Data de vencimento do contrato';

-- Verificar se as colunas foram adicionadas
DESCRIBE companies;

-- Comentário sobre as novas colunas:
-- contract_start_date: Data de início da vigência do contrato (DATE)
-- contract_end_date: Data de vencimento do contrato (DATE)

SELECT 'Colunas de vigência e vencimento adicionadas com sucesso na tabela companies!' as message;