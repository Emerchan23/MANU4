-- Remoção completa da funcionalidade de Ordens de Serviço (service_orders)
-- Execute este script em MariaDB/MySQL

SET FOREIGN_KEY_CHECKS = 0;

-- Remover triggers relacionados (se existirem)
DROP TRIGGER IF EXISTS `tr_service_orders_validate_dates`;
DROP TRIGGER IF EXISTS `tr_service_orders_validate_dates_update`;
DROP TRIGGER IF EXISTS `tr_service_orders_warranty_expiry`;
DROP TRIGGER IF EXISTS `tr_service_orders_warranty_expiry_update`;

-- Remover tabela principal
DROP TABLE IF EXISTS `service_orders`;

SET FOREIGN_KEY_CHECKS = 1;

-- Observação:
-- Este script remove apenas a tabela e triggers da funcionalidade de Ordens de Serviço.
-- Caso exista lógica de aplicação que ainda consulte 'service_orders', ela deve ser atualizada.