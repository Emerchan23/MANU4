-- Backup da tabela sectors
-- Data: 2025-10-08T21:33:37.009Z

CREATE TABLE `sectors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `manager_id` varchar(255) DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO sectors (id, name, description, manager_id, active, created_at, updated_at) VALUES
(1, 'TI', 'Tecnologia da Informa????o', NULL, 1, '2025-09-28 15:31:31', '2025-09-28 15:31:31'),
(2, 'Manuten????o', 'Setor de Manuten????o Geral', NULL, 1, '2025-09-28 15:31:31', '2025-09-28 15:31:31'),
(3, 'Administra????o', 'Setor Administrativo', NULL, 1, '2025-09-28 15:31:31', '2025-09-28 18:36:08'),
(4, 'Enfermagem', 'Setor de Enfermagem', NULL, 1, '2025-09-28 15:31:31', '2025-09-28 15:31:31'),
(5, 'Laborat??rio', 'Laborat??rio de An??lises Cl??nicas', NULL, 1, '2025-09-28 15:31:31', '2025-09-28 15:31:31'),
(6, 'Setor Teste PUT', 'Teste de atualiza��o', NULL, 1, '2025-09-28 18:26:04', '2025-09-28 18:33:02'),
(8, '3333', '33333', '444444', 1, '2025-09-28 18:36:18', '2025-09-28 18:58:01'),
(9, 'Setor Teste API', 'Setor criado para teste da API', NULL, 1, '2025-09-28 18:42:13', '2025-09-28 18:42:13'),
(10, 'Teste Responsável', 'Setor de teste', 'João Silva', 1, '2025-09-28 18:52:32', '2025-09-28 18:52:32'),
(11, 'Teste API', 'Teste via API', NULL, 1, '2025-09-28 18:52:51', '2025-09-28 18:52:51'),
(12, 'Teste Debug', 'Teste com debug', NULL, 1, '2025-09-28 18:53:22', '2025-09-28 18:53:22'),
(13, 'Teste Express Debug', 'Teste com logs', NULL, 1, '2025-09-28 18:54:00', '2025-09-28 18:54:00'),
(14, 'Teste Body Debug', 'Teste body', NULL, 1, '2025-09-28 18:54:21', '2025-09-28 18:54:21'),
(15, 'Teste Logs Detalhados', 'Teste logs', NULL, 1, '2025-09-28 18:55:39', '2025-09-28 18:55:39'),
(16, 'Teste Final Debug', 'Teste final', 'Maria Santos', 1, '2025-09-28 18:56:06', '2025-09-28 18:56:06');

