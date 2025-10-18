USE hospital_maintenance;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS patrimonio_number VARCHAR(100);
SELECT 'Coluna patrimonio_number adicionada com sucesso' as resultado;
