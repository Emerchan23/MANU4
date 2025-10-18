-- Configurar timezone para Brasil (America/Sao_Paulo)
SET time_zone = '-03:00';

-- Create wheel_states table
CREATE TABLE IF NOT EXISTS wheel_states (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  direction ENUM('clockwise', 'counterclockwise', 'stopped') DEFAULT 'stopped',
  speed ENUM('slow', 'medium', 'fast', 'custom') DEFAULT 'medium',
  custom_speed INT DEFAULT 60,
  angle DECIMAL(10, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT FALSE,
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_name (name),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create rotation_logs table
CREATE TABLE IF NOT EXISTS rotation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  wheel_id INT NOT NULL,
  action ENUM('start', 'stop', 'speed_change', 'direction_change', 'create', 'update') NOT NULL,
  user_id INT,
  details TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (wheel_id) REFERENCES wheel_states(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_wheel_id (wheel_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default wheel state
INSERT INTO wheel_states (name, direction, speed, custom_speed, angle, is_active)
VALUES ('Sistema de Rotação Principal', 'stopped', 'medium', 60, 0, FALSE)
ON DUPLICATE KEY UPDATE name = name;

-- Create view for wheel statistics
CREATE OR REPLACE VIEW v_wheel_statistics AS
SELECT 
  ws.id,
  ws.name,
  ws.direction,
  ws.speed,
  ws.custom_speed,
  ws.is_active,
  COUNT(rl.id) as total_operations,
  MAX(rl.timestamp) as last_operation,
  SUM(CASE WHEN rl.action = 'start' THEN 1 ELSE 0 END) as start_count,
  SUM(CASE WHEN rl.action = 'stop' THEN 1 ELSE 0 END) as stop_count,
  SUM(CASE WHEN rl.action = 'speed_change' THEN 1 ELSE 0 END) as speed_changes,
  SUM(CASE WHEN rl.action = 'direction_change' THEN 1 ELSE 0 END) as direction_changes
FROM wheel_states ws
LEFT JOIN rotation_logs rl ON ws.id = rl.wheel_id
GROUP BY ws.id, ws.name, ws.direction, ws.speed, ws.custom_speed, ws.is_active;

-- Create stored procedure to clean old logs
DELIMITER //

CREATE PROCEDURE IF NOT EXISTS clean_old_rotation_logs(IN days_to_keep INT)
BEGIN
  DELETE FROM rotation_logs 
  WHERE timestamp < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
  
  SELECT ROW_COUNT() as deleted_rows;
END //

DELIMITER ;

-- Create function to format date in Brazilian format
DELIMITER //

CREATE FUNCTION IF NOT EXISTS format_date_br(input_date DATETIME)
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
  RETURN DATE_FORMAT(input_date, '%d/%m/%Y %H:%i:%s');
END //

CREATE FUNCTION IF NOT EXISTS format_date_only_br(input_date DATE)
RETURNS VARCHAR(10)
DETERMINISTIC
BEGIN
  RETURN DATE_FORMAT(input_date, '%d/%m/%Y');
END //

DELIMITER ;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON wheel_states TO 'hospital_maintenance'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON rotation_logs TO 'hospital_maintenance'@'localhost';
GRANT SELECT ON v_wheel_statistics TO 'hospital_maintenance'@'localhost';
GRANT EXECUTE ON PROCEDURE clean_old_rotation_logs TO 'hospital_maintenance'@'localhost';
GRANT EXECUTE ON FUNCTION format_date_br TO 'hospital_maintenance'@'localhost';
GRANT EXECUTE ON FUNCTION format_date_only_br TO 'hospital_maintenance'@'localhost';

-- Comentários sobre formato de data
-- As datas são armazenadas no formato TIMESTAMP do MySQL (UTC)
-- A aplicação converte para o formato brasileiro (dd/mm/aaaa HH:mm:ss) na camada de apresentação
-- Timezone configurado: America/Sao_Paulo (UTC-3)
