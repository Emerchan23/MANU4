-- Backup da tabela maintenance_types
-- Data: 2025-10-08T21:33:37.001Z

CREATE TABLE `maintenance_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `category` enum('preventiva','corretiva','calibracao','instalacao','desinstalacao','consultoria') NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_category` (`category`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tipos e categorias de manuten????o do sistema';

INSERT INTO maintenance_types (id, name, description, category, is_active, created_at, updated_at) VALUES
(1, 'Manuten????o Preventiva Mensal', 'Manuten????o preventiva realizada mensalmente', 'preventiva', 1, '2025-09-28 17:31:25', '2025-09-28 17:31:25'),
(2, 'Reparo de Emerg??ncia', 'Corre????o de falhas cr??ticas', 'corretiva', 1, '2025-09-28 17:31:25', '2025-09-28 17:31:25'),
(3, 'Calibra????o de Instrumentos', 'Calibra????o de equipamentos de medi????o', 'calibracao', 1, '2025-09-28 17:31:25', '2025-09-28 17:31:25');

