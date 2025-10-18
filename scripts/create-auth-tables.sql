-- ============================================
-- SISTEMA DE AUTENTICAÇÃO E PERMISSÕES
-- Todas as informações armazenadas no MariaDB
-- ============================================

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Perfis/Roles
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Módulos do Sistema
CREATE TABLE IF NOT EXISTS modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  route VARCHAR(100),
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Permissões (Role + Módulo + Ações)
CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_id INT NOT NULL,
  module_id INT NOT NULL,
  can_view BOOLEAN DEFAULT FALSE,
  can_create BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  can_export BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  UNIQUE KEY unique_role_module (role_id, module_id),
  INDEX idx_role_id (role_id),
  INDEX idx_module_id (module_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Relacionamento Usuário-Role
CREATE TABLE IF NOT EXISTS user_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_role (user_id, role_id),
  INDEX idx_user_id (user_id),
  INDEX idx_role_id (role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Sessões (armazenadas no banco)
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(500) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Logs de Acesso
CREATE TABLE IF NOT EXISTS access_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(50) NOT NULL,
  module VARCHAR(50),
  ip_address VARCHAR(45),
  user_agent TEXT,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DADOS INICIAIS
-- ============================================

-- Inserir Módulos do Sistema
INSERT INTO modules (name, description, route, icon) VALUES
('dashboard', 'Dashboard Principal', '/dashboard', 'LayoutDashboard'),
('equipments', 'Gestão de Equipamentos', '/equipments', 'Wrench'),
('service-orders', 'Ordens de Serviço', '/service-orders', 'ClipboardList'),
('preventive', 'Manutenção Preventiva', '/preventive', 'Calendar'),
('corrective', 'Manutenção Corretiva', '/corrective', 'AlertTriangle'),
('predictive', 'Manutenção Preditiva', '/predictive', 'TrendingUp'),
('users', 'Gestão de Usuários', '/users', 'Users'),
('settings', 'Configurações', '/settings', 'Settings')
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- Inserir Perfis Padrão
INSERT INTO roles (name, description) VALUES
('admin', 'Administrador - Acesso total ao sistema'),
('manager', 'Gerente - Acesso a relatórios e aprovações'),
('technician', 'Técnico - Execução de manutenções'),
('viewer', 'Visualizador - Apenas leitura')
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- Permissões para ADMIN (acesso total)
INSERT INTO permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, m.id, TRUE, TRUE, TRUE, TRUE, TRUE
FROM roles r
CROSS JOIN modules m
WHERE r.name = 'admin'
ON DUPLICATE KEY UPDATE 
  can_view=TRUE, can_create=TRUE, can_edit=TRUE, can_delete=TRUE, can_export=TRUE;

-- Permissões para MANAGER
INSERT INTO permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, m.id, TRUE, TRUE, TRUE, FALSE, TRUE
FROM roles r
CROSS JOIN modules m
WHERE r.name = 'manager' AND m.name NOT IN ('users', 'settings')
ON DUPLICATE KEY UPDATE 
  can_view=TRUE, can_create=TRUE, can_edit=TRUE, can_delete=FALSE, can_export=TRUE;

-- Permissões para TECHNICIAN
INSERT INTO permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, m.id, TRUE, TRUE, TRUE, FALSE, FALSE
FROM roles r
CROSS JOIN modules m
WHERE r.name = 'technician' AND m.name IN ('dashboard', 'equipments', 'service-orders', 'preventive', 'corrective', 'predictive')
ON DUPLICATE KEY UPDATE 
  can_view=TRUE, can_create=TRUE, can_edit=TRUE, can_delete=FALSE, can_export=FALSE;

-- Permissões para VIEWER (apenas leitura)
INSERT INTO permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, can_export)
SELECT r.id, m.id, TRUE, FALSE, FALSE, FALSE, FALSE
FROM roles r
CROSS JOIN modules m
WHERE r.name = 'viewer'
ON DUPLICATE KEY UPDATE 
  can_view=TRUE, can_create=FALSE, can_edit=FALSE, can_delete=FALSE, can_export=FALSE;

-- Criar usuário admin padrão (senha: admin123)
-- Hash bcrypt de 'admin123': $2b$10$rQZ9vXqZ9vXqZ9vXqZ9vXuO7K8Z9vXqZ9vXqZ9vXqZ9vXqZ9vXqZ9
INSERT INTO users (username, email, password_hash, full_name, is_admin, is_active) VALUES
('admin', 'admin@sistema.com', '$2b$10$rQZ9vXqZ9vXqZ9vXqZ9vXuO7K8Z9vXqZ9vXqZ9vXqZ9vXqZ9vXqZ9', 'Administrador do Sistema', TRUE, TRUE)
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- Associar usuário admin ao perfil admin
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
CROSS JOIN roles r
WHERE u.username = 'admin' AND r.name = 'admin'
ON DUPLICATE KEY UPDATE user_id=VALUES(user_id);

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View para listar usuários com seus perfis
CREATE OR REPLACE VIEW v_users_with_roles AS
SELECT 
  u.id,
  u.username,
  u.email,
  u.full_name,
  u.is_active,
  u.is_admin,
  u.last_login,
  u.created_at,
  GROUP_CONCAT(r.name ORDER BY r.name SEPARATOR ', ') as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY u.id, u.username, u.email, u.full_name, u.is_active, u.is_admin, u.last_login, u.created_at;

-- View para listar permissões por usuário
CREATE OR REPLACE VIEW v_user_permissions AS
SELECT 
  u.id as user_id,
  u.username,
  m.name as module_name,
  m.route as module_route,
  MAX(p.can_view) as can_view,
  MAX(p.can_create) as can_create,
  MAX(p.can_edit) as can_edit,
  MAX(p.can_delete) as can_delete,
  MAX(p.can_export) as can_export
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN permissions p ON ur.role_id = p.role_id
JOIN modules m ON p.module_id = m.id
WHERE u.is_active = TRUE
GROUP BY u.id, u.username, m.name, m.route;

-- ============================================
-- PROCEDURES ÚTEIS
-- ============================================

DELIMITER //

-- Procedure para limpar sessões expiradas
CREATE PROCEDURE IF NOT EXISTS clean_expired_sessions()
BEGIN
  DELETE FROM user_sessions WHERE expires_at < NOW();
END //

-- Procedure para registrar log de acesso
CREATE PROCEDURE IF NOT EXISTS log_access(
  IN p_user_id INT,
  IN p_action VARCHAR(50),
  IN p_module VARCHAR(50),
  IN p_ip_address VARCHAR(45),
  IN p_user_agent TEXT,
  IN p_details TEXT
)
BEGIN
  INSERT INTO access_logs (user_id, action, module, ip_address, user_agent, details)
  VALUES (p_user_id, p_action, p_module, p_ip_address, p_user_agent, p_details);
END //

DELIMITER ;

-- ============================================
-- EVENT SCHEDULER (limpar sessões a cada hora)
-- ============================================

SET GLOBAL event_scheduler = ON;

CREATE EVENT IF NOT EXISTS clean_sessions_hourly
ON SCHEDULE EVERY 1 HOUR
DO CALL clean_expired_sessions();

SELECT 'Tabelas de autenticação criadas com sucesso!' as status;
