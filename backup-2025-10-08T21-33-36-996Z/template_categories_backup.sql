-- Backup da tabela template_categories
-- Data: 2025-10-08T21:33:37.004Z

CREATE TABLE `template_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `color` varchar(7) DEFAULT '#3B82F6',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Categorias para organizar templates de descrição de serviços';

INSERT INTO template_categories (id, name, description, color, created_at, updated_at) VALUES
(1, 'Manutenção Preventiva', 'Templates para manutenções preventivas', '#3B82F6', '2025-09-29 13:16:44', '2025-09-29 13:16:44'),
(2, 'Manutenção Corretiva', 'Templates para manutenções corretivas', '#3B82F6', '2025-09-29 13:16:44', '2025-09-29 13:16:44'),
(3, 'Instalação', 'Templates para instalação de equipamentos', '#3B82F6', '2025-09-29 13:16:44', '2025-09-29 13:16:44'),
(4, 'Calibração', 'Templates para calibração de equipamentos', '#3B82F6', '2025-09-29 13:16:44', '2025-10-08 20:36:32'),
(5, 'Limpeza', 'Templates para limpeza e higienização', '#3B82F6', '2025-09-29 13:16:44', '2025-09-29 13:16:44');

