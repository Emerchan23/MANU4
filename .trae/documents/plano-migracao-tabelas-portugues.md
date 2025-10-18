# Plano de Migração - Tabelas para Português Brasileiro

## 1. Visão Geral do Projeto

### Objetivo
Converter os nomes das tabelas do banco de dados do inglês para português brasileiro, mantendo a funcionalidade completa do sistema e facilitando a manutenção para a equipe brasileira.

### Benefícios Esperados
- **Maior clareza** na comunicação da equipe
- **Facilidade de manutenção** do código
- **Redução de erros** por confusão de nomenclatura
- **Padronização** em português brasileiro

## 2. Mapeamento de Tabelas

### 2.1 Tabelas Principais
| Nome Atual (Inglês) | Nome Novo (Português) | Descrição |
|---------------------|----------------------|-----------|
| `maintenance_types` | `tipos_manutencao` | Tipos de manutenção do sistema |
| `template_categories` | `categorias_templates` | Categorias dos templates de serviço |
| `service_description_templates` | `templates_descricao_servicos` | Templates de descrição de serviços |
| `companies` | `empresas` | Empresas terceirizadas |
| `sectors` | `setores` | Setores do hospital |
| `equipment` | `equipamentos` | Equipamentos hospitalares |
| `service_orders` | `ordens_servico` | Ordens de serviço |
| `users` | `usuarios` | Usuários do sistema |

### 2.2 Mapeamento de Campos Comuns
| Campo Atual | Campo Novo | Tipo |
|-------------|------------|------|
| `created_at` | `criado_em` | TIMESTAMP |
| `updated_at` | `atualizado_em` | TIMESTAMP |
| `is_active` | `ativo` | BOOLEAN |
| `description` | `descricao` | TEXT |
| `category_id` | `categoria_id` | INT |

## 3. Cronograma de Implementação

### Fase 1: Preparação (1 dia)
- ✅ Backup completo do banco de dados
- ✅ Criação de ambiente de teste
- ✅ Validação dos scripts de migração

### Fase 2: Migração das Tabelas Base (2 dias)
- 🔄 Migração de `maintenance_types` → `tipos_manutencao`
- 🔄 Migração de `template_categories` → `categorias_templates`
- 🔄 Migração de `companies` → `empresas`
- 🔄 Migração de `sectors` → `setores`

### Fase 3: Migração das Tabelas Dependentes (2 dias)
- 🔄 Migração de `equipment` → `equipamentos`
- 🔄 Migração de `service_description_templates` → `templates_descricao_servicos`
- 🔄 Migração de `service_orders` → `ordens_servico`
- 🔄 Migração de `users` → `usuarios`

### Fase 4: Atualização das APIs (2 dias)
- 🔄 Atualização de todas as rotas da API
- 🔄 Testes de integração
- 🔄 Validação do frontend

### Fase 5: Finalização (1 dia)
- 🔄 Remoção das tabelas antigas
- 🔄 Limpeza do código
- 🔄 Documentação final

## 4. Scripts de Migração

### 4.1 Script de Backup
```sql
-- Backup completo antes da migração
-- Executar antes de qualquer alteração
BACKUP DATABASE hospital_maintenance TO DISK = 'C:\backup\hospital_maintenance_backup_pre_migration.bak';

-- Ou para MySQL/MariaDB
mysqldump -u root -p hospital_maintenance > backup_pre_migration.sql
```

### 4.2 Criação das Novas Tabelas

#### Tipos de Manutenção
```sql
-- Criar nova tabela tipos_manutencao
CREATE TABLE tipos_manutencao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nome (nome),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Categorias de Templates
```sql
-- Criar nova tabela categorias_templates
CREATE TABLE categorias_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Empresas
```sql
-- Criar nova tabela empresas
CREATE TABLE empresas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(100),
    endereco TEXT,
    especialidades TEXT,
    contratos JSON,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nome (nome),
    INDEX idx_cnpj (cnpj),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Setores
```sql
-- Criar nova tabela setores
CREATE TABLE setores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    gerente_id INT,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nome (nome),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Equipamentos
```sql
-- Criar nova tabela equipamentos
CREATE TABLE equipamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    modelo VARCHAR(100),
    fabricante VARCHAR(100),
    numero_serie VARCHAR(100),
    setor_id INT,
    localizacao VARCHAR(200),
    status ENUM('ativo', 'inativo', 'manutencao') DEFAULT 'ativo',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (setor_id) REFERENCES setores(id) ON DELETE SET NULL,
    INDEX idx_nome (nome),
    INDEX idx_setor (setor_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Templates de Descrição de Serviços
```sql
-- Criar nova tabela templates_descricao_servicos
CREATE TABLE templates_descricao_servicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT NOT NULL,
    categoria_id INT,
    ativo BOOLEAN DEFAULT TRUE,
    criado_por INT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (categoria_id) REFERENCES categorias_templates(id) ON DELETE SET NULL,
    INDEX idx_categoria (categoria_id),
    INDEX idx_ativo (ativo),
    INDEX idx_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Usuários
```sql
-- Criar nova tabela usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_usuario VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    nome_completo VARCHAR(200),
    senha_hash VARCHAR(255) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    admin BOOLEAN DEFAULT FALSE,
    ultimo_login TIMESTAMP NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nome_usuario (nome_usuario),
    INDEX idx_email (email),
    INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Ordens de Serviço
```sql
-- Criar nova tabela ordens_servico
CREATE TABLE ordens_servico (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(20) NOT NULL UNIQUE,
    equipamento_id INT,
    tipo_manutencao_id INT,
    descricao TEXT,
    prioridade ENUM('baixa', 'media', 'alta', 'critica') DEFAULT 'media',
    status ENUM('aberta', 'em_andamento', 'concluida', 'cancelada') DEFAULT 'aberta',
    data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_conclusao TIMESTAMP NULL,
    tecnico_id INT,
    empresa_id INT,
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id) ON DELETE SET NULL,
    FOREIGN KEY (tipo_manutencao_id) REFERENCES tipos_manutencao(id) ON DELETE SET NULL,
    FOREIGN KEY (tecnico_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE SET NULL,
    INDEX idx_numero (numero),
    INDEX idx_equipamento (equipamento_id),
    INDEX idx_status (status),
    INDEX idx_prioridade (prioridade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4.3 Scripts de Migração de Dados

#### Migrar Tipos de Manutenção
```sql
-- Migrar dados de maintenance_types para tipos_manutencao
INSERT INTO tipos_manutencao (id, nome, ativo, criado_em, atualizado_em)
SELECT id, name, is_active, created_at, updated_at
FROM maintenance_types;

-- Verificar migração
SELECT COUNT(*) as total_antigo FROM maintenance_types;
SELECT COUNT(*) as total_novo FROM tipos_manutencao;
```

#### Migrar Categorias de Templates
```sql
-- Migrar dados de template_categories para categorias_templates
INSERT INTO categorias_templates (id, nome, descricao, criado_em, atualizado_em)
SELECT id, name, description, created_at, updated_at
FROM template_categories;

-- Verificar migração
SELECT COUNT(*) as total_antigo FROM template_categories;
SELECT COUNT(*) as total_novo FROM categorias_templates;
```

#### Migrar Empresas
```sql
-- Migrar dados de companies para empresas
INSERT INTO empresas (id, nome, cnpj, telefone, email, endereco, especialidades, contratos, ativo, criado_em, atualizado_em)
SELECT id, name, cnpj, phone, email, address, specialties, contracts, is_active, created_at, updated_at
FROM companies;

-- Verificar migração
SELECT COUNT(*) as total_antigo FROM companies;
SELECT COUNT(*) as total_novo FROM empresas;
```

#### Migrar Setores
```sql
-- Migrar dados de sectors para setores
INSERT INTO setores (id, nome, descricao, gerente_id, ativo, criado_em, atualizado_em)
SELECT id, name, description, manager_id, active, created_at, updated_at
FROM sectors;

-- Verificar migração
SELECT COUNT(*) as total_antigo FROM sectors;
SELECT COUNT(*) as total_novo FROM setores;
```

## 5. Atualização das APIs

### 5.1 Arquivos a Serem Atualizados

#### API de Tipos de Manutenção
**Arquivo:** `app/api/maintenance-types/route.ts` → `app/api/tipos-manutencao/route.ts`

```typescript
// Atualizar queries SQL
const sql = `
  SELECT id, nome, ativo, criado_em, atualizado_em
  FROM tipos_manutencao
  WHERE ativo = 1
  ORDER BY nome
`;

// Atualizar INSERT
const insertSql = `
  INSERT INTO tipos_manutencao (nome, ativo)
  VALUES (?, ?)
`;

// Atualizar UPDATE
const updateSql = `
  UPDATE tipos_manutencao 
  SET nome = ?, ativo = ?, atualizado_em = CURRENT_TIMESTAMP
  WHERE id = ?
`;
```

#### API de Empresas
**Arquivo:** `app/api/companies/route.ts` → `app/api/empresas/route.ts`

```typescript
// Atualizar queries SQL
const sql = `
  SELECT id, nome, cnpj, telefone, email, endereco, especialidades, contratos, ativo
  FROM empresas
  WHERE ativo = 1
  ORDER BY nome
`;
```

### 5.2 Rotas do Frontend a Serem Atualizadas

```typescript
// Atualizar chamadas da API
const response = await fetch('/api/tipos-manutencao');
const response = await fetch('/api/empresas');
const response = await fetch('/api/setores');
const response = await fetch('/api/equipamentos');
```

## 6. Plano de Rollback

### 6.1 Em Caso de Problemas
```sql
-- Script de rollback - restaurar tabelas originais
-- 1. Parar a aplicação
-- 2. Restaurar backup
RESTORE DATABASE hospital_maintenance FROM DISK = 'C:\backup\hospital_maintenance_backup_pre_migration.bak';

-- Ou para MySQL/MariaDB
mysql -u root -p hospital_maintenance < backup_pre_migration.sql
```

### 6.2 Verificações de Integridade
```sql
-- Verificar integridade dos dados após migração
SELECT 
  (SELECT COUNT(*) FROM maintenance_types) as tipos_antigo,
  (SELECT COUNT(*) FROM tipos_manutencao) as tipos_novo;

SELECT 
  (SELECT COUNT(*) FROM companies) as empresas_antigo,
  (SELECT COUNT(*) FROM empresas) as empresas_novo;

-- Verificar foreign keys
SELECT 
  TABLE_NAME, 
  COLUMN_NAME, 
  CONSTRAINT_NAME, 
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE REFERENCED_TABLE_SCHEMA = 'hospital_maintenance'
AND REFERENCED_TABLE_NAME IN ('tipos_manutencao', 'empresas', 'setores', 'equipamentos');
```

## 7. Checklist de Validação

### Antes da Migração
- [ ] Backup completo realizado
- [ ] Ambiente de teste configurado
- [ ] Scripts de migração testados
- [ ] Equipe notificada sobre a manutenção

### Durante a Migração
- [ ] Aplicação em modo de manutenção
- [ ] Logs de migração sendo gerados
- [ ] Verificação de integridade a cada etapa
- [ ] Monitoramento de espaço em disco

### Após a Migração
- [ ] Todas as tabelas migradas com sucesso
- [ ] APIs funcionando corretamente
- [ ] Frontend carregando dados
- [ ] Testes de integração passando
- [ ] Performance mantida ou melhorada

## 8. Considerações Técnicas

### 8.1 Encoding e Collation
```sql
-- Verificar encoding atual
SHOW VARIABLES LIKE 'character_set%';
SHOW VARIABLES LIKE 'collation%';

-- Configurar para UTF-8
ALTER DATABASE hospital_maintenance 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

### 8.2 Índices e Performance
- Manter todos os índices existentes
- Adicionar novos índices conforme necessário
- Monitorar performance após migração

### 8.3 Permissões de Usuário
```sql
-- Atualizar permissões para novas tabelas
GRANT SELECT, INSERT, UPDATE, DELETE ON hospital_maintenance.tipos_manutencao TO 'app_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON hospital_maintenance.empresas TO 'app_user'@'%';
-- Repetir para todas as tabelas...
```

## 9. Cronograma Detalhado

| Data | Horário | Atividade | Responsável | Duração |
|------|---------|-----------|-------------|---------|
| Dia 1 | 08:00-12:00 | Backup e preparação | DBA | 4h |
| Dia 1 | 13:00-17:00 | Migração tabelas base | DBA + Dev | 4h |
| Dia 2 | 08:00-12:00 | Migração tabelas dependentes | DBA + Dev | 4h |
| Dia 2 | 13:00-17:00 | Atualização APIs | Dev | 4h |
| Dia 3 | 08:00-12:00 | Testes e validação | QA + Dev | 4h |
| Dia 3 | 13:00-17:00 | Limpeza e documentação | Dev | 4h |

## 10. Contatos de Emergência

- **DBA:** [Nome] - [Telefone] - [Email]
- **Desenvolvedor Lead:** [Nome] - [Telefone] - [Email]
- **Gerente de Projeto:** [Nome] - [Telefone] - [Email]

---

**Status do Documento:** 📋 Pronto para Implementação  
**Última Atualização:** $(date)  
**Versão:** 1.0