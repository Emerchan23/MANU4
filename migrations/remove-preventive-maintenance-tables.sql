-- Remoção completa das tabelas de Manutenção Preventiva
-- Execute este script em MariaDB

SET FOREIGN_KEY_CHECKS = 0;

-- Apagar tabelas dependentes primeiro
DROP TABLE IF EXISTS `maintenance_tasks`;
DROP TABLE IF EXISTS `preventive_maintenances`;
DROP TABLE IF EXISTS `preventive_maintenance_plans`;

SET FOREIGN_KEY_CHECKS = 1;

-- Observação:
-- Este script remove apenas as tabelas específicas da funcionalidade de
-- Manutenção Preventiva. Nenhuma coluna adicional em outras tabelas foi removida.
-- Caso exista lógica de aplicação que ainda consulte essas tabelas,
-- ela deve ser atualizada para evitar erros de referência.