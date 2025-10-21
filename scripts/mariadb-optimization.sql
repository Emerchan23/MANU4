-- Script de Otimização para MariaDB
-- Configurações para prevenir "Too many connections" e melhorar performance

-- ============================================
-- CONFIGURAÇÕES DE CONEXÃO
-- ============================================

-- Aumentar limite máximo de conexões
SET GLOBAL max_connections = 50;

-- Configurar timeout para conexões inativas
SET GLOBAL wait_timeout = 300;  -- 5 minutos
SET GLOBAL interactive_timeout = 300;  -- 5 minutos

-- Timeout para conexões que não conseguem se conectar
SET GLOBAL connect_timeout = 10;

-- ============================================
-- CONFIGURAÇÕES DE PERFORMANCE
-- ============================================

-- Buffer pool para InnoDB (ajustar baseado na RAM disponível)
-- Recomendado: 70-80% da RAM para servidores dedicados
SET GLOBAL innodb_buffer_pool_size = 128M;  -- Ajustar conforme necessário

-- Configurações de log do InnoDB
SET GLOBAL innodb_log_file_size = 64M;
SET GLOBAL innodb_log_buffer_size = 16M;

-- Configurações de thread
SET GLOBAL thread_cache_size = 16;
SET GLOBAL table_open_cache = 400;

-- ============================================
-- CONFIGURAÇÕES DE QUERY CACHE
-- ============================================

-- Habilitar query cache (se disponível na versão)
SET GLOBAL query_cache_type = ON;
SET GLOBAL query_cache_size = 32M;
SET GLOBAL query_cache_limit = 2M;

-- ============================================
-- CONFIGURAÇÕES DE SEGURANÇA E MONITORAMENTO
-- ============================================

-- Habilitar log de queries lentas
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 2;  -- Queries > 2 segundos
SET GLOBAL log_queries_not_using_indexes = ON;

-- Configurar max_user_connections para prevenir abuso
SET GLOBAL max_user_connections = 30;

-- ============================================
-- ÍNDICES RECOMENDADOS PARA PERFORMANCE
-- ============================================

-- Índices para tabela de equipamentos
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON equipment(type);
CREATE INDEX IF NOT EXISTS idx_equipment_created_at ON equipment(created_at);

-- Índices para tabela de manutenções
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_schedules(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_equipment_id ON maintenance_schedules(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_scheduled_date ON maintenance_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_priority ON maintenance_schedules(priority);

-- Índices para tabela de ordens de serviço
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_service_orders_equipment_id ON service_orders(equipment_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_created_at ON service_orders(created_at);

-- Índices para tabela de alertas
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_priority ON alerts(prioridade);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

-- ============================================
-- VIEWS OTIMIZADAS PARA DASHBOARDS
-- ============================================

-- View para métricas de dashboard (reduz queries complexas)
CREATE OR REPLACE VIEW dashboard_metrics AS
SELECT 
  (SELECT COUNT(*) FROM equipment WHERE status = 'ativo') as active_equipment,
  (SELECT COUNT(*) FROM maintenance_schedules WHERE status IN ('AGENDADO', 'PENDENTE')) as pending_maintenances,
  (SELECT COUNT(*) FROM service_orders WHERE status IN ('ABERTA', 'EM_ANDAMENTO')) as open_service_orders,
  (SELECT COUNT(*) FROM alerts WHERE status = 'ATIVO' AND prioridade = 'ALTA') as critical_alerts;

-- View para estatísticas de equipamentos por tipo
CREATE OR REPLACE VIEW equipment_by_type AS
SELECT 
  type,
  COUNT(*) as count,
  SUM(CASE WHEN status = 'ativo' THEN 1 ELSE 0 END) as active_count
FROM equipment 
GROUP BY type;

-- View para manutenções por prioridade
CREATE OR REPLACE VIEW maintenance_by_priority AS
SELECT 
  priority,
  COUNT(*) as count,
  SUM(CASE WHEN status = 'PENDENTE' THEN 1 ELSE 0 END) as pending_count
FROM maintenance_schedules 
GROUP BY priority;

-- ============================================
-- STORED PROCEDURES PARA OPERAÇÕES COMUNS
-- ============================================

DELIMITER //

-- Procedure para obter métricas do dashboard
CREATE OR REPLACE PROCEDURE GetDashboardMetrics()
BEGIN
  SELECT * FROM dashboard_metrics;
  SELECT * FROM equipment_by_type;
  SELECT * FROM maintenance_by_priority;
END //

-- Procedure para limpeza de dados antigos
CREATE OR REPLACE PROCEDURE CleanupOldData()
BEGIN
  -- Limpar logs antigos (mais de 30 dias)
  DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
  
  -- Limpar alertas resolvidos antigos (mais de 60 dias)
  DELETE FROM alerts 
  WHERE status = 'RESOLVIDO' 
    AND updated_at < DATE_SUB(NOW(), INTERVAL 60 DAY);
  
  -- Otimizar tabelas após limpeza
  OPTIMIZE TABLE audit_logs, alerts;
END //

DELIMITER ;

-- ============================================
-- EVENTOS AUTOMÁTICOS
-- ============================================

-- Habilitar scheduler de eventos
SET GLOBAL event_scheduler = ON;

-- Evento para limpeza automática semanal
CREATE EVENT IF NOT EXISTS weekly_cleanup
ON SCHEDULE EVERY 1 WEEK
STARTS CURRENT_TIMESTAMP
DO
  CALL CleanupOldData();

-- ============================================
-- CONFIGURAÇÕES FINAIS
-- ============================================

-- Forçar uso de InnoDB para novas tabelas
SET GLOBAL default_storage_engine = InnoDB;

-- Configurar charset padrão
SET GLOBAL character_set_server = utf8mb4;
SET GLOBAL collation_server = utf8mb4_unicode_ci;

-- ============================================
-- COMANDOS DE VERIFICAÇÃO
-- ============================================

-- Verificar configurações aplicadas
SELECT 
  'max_connections' as setting, 
  @@max_connections as value
UNION ALL
SELECT 
  'wait_timeout', 
  @@wait_timeout
UNION ALL
SELECT 
  'interactive_timeout', 
  @@interactive_timeout
UNION ALL
SELECT 
  'innodb_buffer_pool_size', 
  @@innodb_buffer_pool_size
UNION ALL
SELECT 
  'thread_cache_size', 
  @@thread_cache_size;

-- Verificar conexões ativas
SELECT 
  COUNT(*) as active_connections,
  @@max_connections as max_connections,
  ROUND((COUNT(*) / @@max_connections) * 100, 2) as usage_percentage
FROM information_schema.processlist;

-- ============================================
-- COMANDOS PARA MONITORAMENTO
-- ============================================

-- Query para monitorar conexões por usuário
-- SELECT user, host, COUNT(*) as connections 
-- FROM information_schema.processlist 
-- GROUP BY user, host 
-- ORDER BY connections DESC;

-- Query para monitorar queries lentas em tempo real
-- SELECT id, user, host, db, command, time, state, info 
-- FROM information_schema.processlist 
-- WHERE time > 5 
-- ORDER BY time DESC;

-- Query para verificar uso de índices
-- SELECT 
--   table_schema,
--   table_name,
--   index_name,
--   cardinality
-- FROM information_schema.statistics 
-- WHERE table_schema = 'hospital_maintenance'
-- ORDER BY table_name, cardinality DESC;