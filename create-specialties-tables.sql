-- Criar tabela de especialidades
CREATE TABLE IF NOT EXISTS specialties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Criar tabela de relacionamento entre empresas e especialidades
CREATE TABLE IF NOT EXISTS company_specialties (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  specialty_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (specialty_id) REFERENCES specialties(id) ON DELETE CASCADE,
  UNIQUE KEY unique_company_specialty (company_id, specialty_id)
);

-- Inserir algumas especialidades padrão
INSERT INTO specialties (name, description) VALUES 
('Biomédica', 'Manutenção de equipamentos biomédicos e hospitalares'),
('Elétrica', 'Manutenção de sistemas elétricos e eletrônicos'),
('Mecânica', 'Manutenção de equipamentos mecânicos e estruturais'),
('Refrigeração', 'Manutenção de sistemas de refrigeração e climatização'),
('Informática', 'Manutenção de equipamentos de informática e redes'),
('Pneumática', 'Manutenção de sistemas pneumáticos e hidráulicos')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Inserir relacionamentos de exemplo (baseado nas empresas existentes)
INSERT INTO company_specialties (company_id, specialty_id) VALUES 
(1, 1), -- TechService Ltda - Biomédica
(1, 2), -- TechService Ltda - Elétrica
(2, 1), -- ManutenPro Serviços - Biomédica
(2, 4), -- ManutenPro Serviços - Refrigeração
(3, 1), -- Equipamentos Hospitalares S/A - Biomédica
(3, 3)  -- Equipamentos Hospitalares S/A - Mecânica
ON DUPLICATE KEY UPDATE company_id = VALUES(company_id);