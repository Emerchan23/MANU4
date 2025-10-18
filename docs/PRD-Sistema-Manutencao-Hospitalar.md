# PRD - Sistema de Manutenção Hospitalar
## Product Requirements Document

### Versão: 1.0
### Data: Janeiro 2025

---

## 1. VISÃO GERAL DO PRODUTO

### 1.1 Objetivo
Sistema web completo para gerenciamento de manutenção de equipamentos hospitalares, permitindo controle total do ciclo de vida dos equipamentos, desde o cadastro até o descarte, incluindo manutenções preventivas, corretivas e controle de estoque.

### 1.2 Escopo
- **Frontend**: Interface web responsiva desenvolvida em Next.js 14 com TypeScript
- **Backend**: API REST em Node.js/Express com autenticação JWT
- **Banco de Dados**: MariaDB com schema completo e triggers de auditoria
- **Arquitetura**: Aplicação full-stack rodando em porta única (3000)

---

## 2. FUNCIONALIDADES PRINCIPAIS

### 2.1 Sistema de Autenticação
**Campos de Login:**
- `nick` (VARCHAR 50) - Nome de usuário único
- `password` (VARCHAR 255) - Senha criptografada com bcrypt

**Níveis de Acesso:**
- **Admin**: Acesso total ao sistema
- **Manager**: Gerenciamento de setor específico
- **Technician**: Execução de ordens de serviço
- **Viewer**: Apenas visualização

### 2.2 Gestão de Usuários
**Campos da Tabela `users`:**
\`\`\`sql
- id (INT AUTO_INCREMENT PRIMARY KEY)
- nick (VARCHAR 50 UNIQUE NOT NULL)
- password (VARCHAR 255 NOT NULL)
- name (VARCHAR 100 NOT NULL)
- email (VARCHAR 100)
- role (ENUM: admin, manager, technician, viewer)
- sector_id (INT FOREIGN KEY)
- permissions (JSON)
- is_active (BOOLEAN DEFAULT TRUE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
\`\`\`

**Funcionalidades:**
- CRUD completo de usuários
- Controle de permissões por aba/funcionalidade
- Vinculação com setores
- Histórico de ações (audit_log)

### 2.3 Gestão de Setores
**Campos da Tabela `sectors`:**
\`\`\`sql
- id (INT AUTO_INCREMENT PRIMARY KEY)
- name (VARCHAR 100 NOT NULL)
- description (TEXT)
- manager_id (INT FOREIGN KEY)
- is_active (BOOLEAN DEFAULT TRUE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
\`\`\`

**Funcionalidades:**
- Cadastro de setores hospitalares
- Definição de gerente responsável
- Vinculação com equipamentos e usuários

### 2.4 Gestão de Empresas
**Campos da Tabela `companies`:**
\`\`\`sql
- id (INT AUTO_INCREMENT PRIMARY KEY)
- name (VARCHAR 100 NOT NULL)
- cnpj (VARCHAR 18 UNIQUE)
- contact_person (VARCHAR 100)
- phone (VARCHAR 20)
- email (VARCHAR 100)
- address (TEXT)
- city (VARCHAR 50)
- state (VARCHAR 2)
- zip_code (VARCHAR 10)
- is_active (BOOLEAN DEFAULT TRUE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
\`\`\`

**Funcionalidades:**
- Cadastro de empresas terceirizadas
- Controle de fornecedores
- Vinculação com ordens de serviço

### 2.5 Gestão de Equipamentos
**Campos da Tabela `equipment`:**
\`\`\`sql
- id (INT AUTO_INCREMENT PRIMARY KEY)
- code (VARCHAR 50 UNIQUE NOT NULL)
- name (VARCHAR 100 NOT NULL)
- brand (VARCHAR 50)
- model (VARCHAR 50)
- serial_number (VARCHAR 100)
- acquisition_date (DATE)
- warranty_expiry (DATE)
- sector_id (INT FOREIGN KEY NOT NULL)
- company_id (INT FOREIGN KEY)
- status (ENUM: active, maintenance, inactive, disposed)
- criticality (ENUM: low, medium, high, critical)
- location (VARCHAR 100)
- specifications (JSON)
- maintenance_interval_days (INT DEFAULT 365)
- last_maintenance_date (DATE)
- next_maintenance_date (DATE)
- is_active (BOOLEAN DEFAULT TRUE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
\`\`\`

**Funcionalidades:**
- Cadastro completo de equipamentos
- Controle de garantia
- Agendamento automático de manutenção preventiva
- Histórico completo de manutenções
- Alertas automáticos

### 2.6 Ordens de Serviço
**Campos da Tabela `service_orders`:**
\`\`\`sql
- id (INT AUTO_INCREMENT PRIMARY KEY)
- number (VARCHAR 20 UNIQUE NOT NULL) -- Formato: OS-001/2025
- equipment_id (INT FOREIGN KEY NOT NULL)
- requester_id (INT FOREIGN KEY NOT NULL)
- assigned_technician_id (INT FOREIGN KEY)
- company_id (INT FOREIGN KEY)
- type (ENUM: corrective, preventive, predictive, emergency)
- priority (ENUM: low, medium, high, urgent)
- status (ENUM: open, in_progress, waiting_parts, completed, cancelled)
- title (VARCHAR 200 NOT NULL)
- description (TEXT NOT NULL)
- problem_reported (TEXT)
- solution_applied (TEXT)
- parts_used (JSON)
- labor_hours (DECIMAL 5,2)
- cost (DECIMAL 10,2)
- scheduled_date (DATETIME)
- started_at (DATETIME)
- completed_at (DATETIME)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
\`\`\`

**Numeração Automática:**
- Formato: `OS-001/2025`, `OS-002/2025`, etc.
- Reinicia a cada ano
- Gerada automaticamente no backend

### 2.7 Solicitações
**Campos da Tabela `requests`:**
\`\`\`sql
- id (INT AUTO_INCREMENT PRIMARY KEY)
- number (VARCHAR 20 UNIQUE NOT NULL) -- Formato: REQ-001/2025
- requester_id (INT FOREIGN KEY NOT NULL)
- equipment_id (INT FOREIGN KEY)
- sector_id (INT FOREIGN KEY NOT NULL)
- type (ENUM: maintenance, repair, inspection, calibration, other)
- priority (ENUM: low, medium, high, urgent)
- status (ENUM: pending, approved, rejected, in_progress, completed)
- title (VARCHAR 200 NOT NULL)
- description (TEXT NOT NULL)
- justification (TEXT)
- approved_by (INT FOREIGN KEY)
- approved_at (DATETIME)
- service_order_id (INT FOREIGN KEY)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
\`\`\`

### 2.8 Sistema de Notificações
**Campos da Tabela `notifications`:**
\`\`\`sql
- id (INT AUTO_INCREMENT PRIMARY KEY)
- user_id (INT FOREIGN KEY NOT NULL)
- type (ENUM: maintenance_due, service_order, request, alert, system)
- title (VARCHAR 200 NOT NULL)
- message (TEXT NOT NULL)
- reference_id (INT)
- reference_type (VARCHAR 50)
- is_read (BOOLEAN DEFAULT FALSE)
- priority (ENUM: low, medium, high)
- created_at (TIMESTAMP)
- read_at (TIMESTAMP)
\`\`\`

**Funcionalidades:**
- Sino de notificações no header
- Notificações em tempo real
- Marcação de lidas/não lidas
- Diferentes tipos de notificação

### 2.9 Sistema de Alertas
**Campos da Tabela `alerts`:**
\`\`\`sql
- id (INT AUTO_INCREMENT PRIMARY KEY)
- equipment_id (INT FOREIGN KEY NOT NULL)
- type (ENUM: maintenance_overdue, warranty_expiring, calibration_due, inspection_due, custom)
- severity (ENUM: info, warning, error, critical)
- title (VARCHAR 200 NOT NULL)
- message (TEXT NOT NULL)
- status (ENUM: active, acknowledged, resolved, dismissed)
- due_date (DATE)
- acknowledged_by (INT FOREIGN KEY)
- acknowledged_at (DATETIME)
- resolved_by (INT FOREIGN KEY)
- resolved_at (DATETIME)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
\`\`\`

### 2.10 Manutenção Preventiva
**Campos da Tabela `preventive_maintenance`:**
\`\`\`sql
- id (INT AUTO_INCREMENT PRIMARY KEY)
- equipment_id (INT FOREIGN KEY NOT NULL)
- name (VARCHAR 100 NOT NULL)
- description (TEXT)
- frequency_days (INT NOT NULL)
- last_execution_date (DATE)
- next_execution_date (DATE NOT NULL)
- assigned_technician_id (INT FOREIGN KEY)
- company_id (INT FOREIGN KEY)
- checklist (JSON)
- estimated_duration_hours (DECIMAL 4,2)
- is_active (BOOLEAN DEFAULT TRUE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
\`\`\`

### 2.11 Controle de Estoque
**Campos da Tabela `parts`:**
\`\`\`sql
- id (INT AUTO_INCREMENT PRIMARY KEY)
- code (VARCHAR 50 UNIQUE NOT NULL)
- name (VARCHAR 100 NOT NULL)
- description (TEXT)
- brand (VARCHAR 50)
- model (VARCHAR 50)
- unit_price (DECIMAL 10,2)
- stock_quantity (INT DEFAULT 0)
- minimum_stock (INT DEFAULT 0)
- supplier_company_id (INT FOREIGN KEY)
- is_active (BOOLEAN DEFAULT TRUE)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
\`\`\`

**Campos da Tabela `stock_movements`:**
\`\`\`sql
- id (INT AUTO_INCREMENT PRIMARY KEY)
- part_id (INT FOREIGN KEY NOT NULL)
- service_order_id (INT FOREIGN KEY)
- movement_type (ENUM: in, out, adjustment)
- quantity (INT NOT NULL)
- unit_price (DECIMAL 10,2)
- total_value (DECIMAL 10,2)
- reason (VARCHAR 200)
- performed_by (INT FOREIGN KEY NOT NULL)
- performed_at (DATETIME NOT NULL)
- created_at (TIMESTAMP)
\`\`\`

---

## 3. ARQUITETURA TÉCNICA

### 3.1 Frontend (Next.js 14)
**Estrutura de Pastas:**
\`\`\`
app/
├── layout.tsx
├── page.tsx
├── equipamentos/
├── ordens-servico/
├── solicitacoes/
├── empresas/
├── setores/
├── usuarios/
├── alertas/
├── manutencao-preventiva/
├── estoque/
└── relatorios/

components/
├── ui/ (shadcn/ui components)
├── layout/
├── auth/
├── equipment/
├── service-orders/
├── requests/
├── companies/
├── sectors/
├── users/
├── alerts/
├── preventive-maintenance/
├── stock/
└── reports/

lib/
├── auth.ts
├── database.ts
├── notifications.ts
└── utils.ts
\`\`\`

**Tecnologias Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui components
- React Hook Form + Zod
- SWR para data fetching
- Lucide React (ícones)

### 3.2 Backend (Node.js/Express)
**Estrutura de API:**
\`\`\`
api/
├── auth.js
├── users.js
├── sectors.js
├── companies.js
├── equipment.js
├── service-orders.js
├── requests.js
├── notifications.js
├── alerts.js
├── preventive-maintenance.js
├── parts.js
└── reports.js

lib/
├── database.js
├── auth.js
└── notification-service.js

server.js (servidor principal)
\`\`\`

**Tecnologias Backend:**
- Node.js
- Express.js
- MySQL2 (driver MariaDB)
- bcryptjs (hash de senhas)
- jsonwebtoken (JWT)
- CORS

### 3.3 Banco de Dados (MariaDB)
**Características:**
- 14 tabelas principais
- Triggers para auditoria
- Views para consultas otimizadas
- Índices para performance
- Foreign keys com integridade referencial
- Campos JSON para dados flexíveis

---

## 4. REGRAS DE NEGÓCIO

### 4.1 Numeração Automática
- **Ordens de Serviço**: OS-001/2025, OS-002/2025...
- **Solicitações**: REQ-001/2025, REQ-002/2025...
- **Equipamentos**: EQ-001/2025, EQ-002/2025...
- Numeração reinicia a cada ano

### 4.2 Controle de Permissões
- Usuários só podem ver/editar dados do seu setor (exceto Admin)
- Managers podem gerenciar seu setor
- Technicians podem executar ordens de serviço
- Viewers apenas visualizam

### 4.3 Regras de Exclusão
- Não permitir exclusão de registros com vínculos
- Soft delete (is_active = false) quando possível
- Validação de integridade antes da exclusão

### 4.4 Alertas Automáticos
- Manutenção preventiva vencida
- Garantia próxima do vencimento
- Estoque baixo de peças
- Equipamentos críticos parados

### 4.5 Workflow de Solicitações
1. Usuário cria solicitação
2. Manager aprova/rejeita
3. Se aprovada, gera ordem de serviço automaticamente
4. Técnico executa a ordem
5. Finalização com relatório

---

## 5. INTERFACE DO USUÁRIO

### 5.1 Layout Principal
- **Header**: Logo, notificações (sino), menu usuário
- **Sidebar**: Menu de navegação por abas
- **Main**: Conteúdo principal
- **Footer**: Informações do sistema

### 5.2 Componentes Principais
- **DataTables**: Listagem com filtros, ordenação, paginação
- **Forms**: Formulários com validação em tempo real
- **Modals**: Para ações rápidas (criar, editar, visualizar)
- **Cards**: Dashboard com métricas e resumos
- **Charts**: Gráficos para relatórios (Recharts)

### 5.3 Responsividade
- Mobile-first design
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Menu colapsível em dispositivos móveis

---

## 6. SEGURANÇA

### 6.1 Autenticação
- JWT tokens com expiração
- Refresh tokens para sessões longas
- Hash de senhas com bcrypt (salt rounds: 10)

### 6.2 Autorização
- Middleware de verificação de permissões
- Controle granular por funcionalidade
- Validação no frontend e backend

### 6.3 Auditoria
- Log de todas as operações (audit_log)
- Rastreamento de IP e User-Agent
- Histórico de alterações em JSON

---

## 7. PERFORMANCE

### 7.1 Banco de Dados
- Índices otimizados para consultas frequentes
- Views para consultas complexas
- Paginação em todas as listagens

### 7.2 Frontend
- Lazy loading de componentes
- SWR para cache de dados
- Otimização de imagens
- Code splitting automático (Next.js)

### 7.3 Backend
- Pool de conexões do banco
- Middleware de compressão
- Rate limiting para APIs

---

## 8. DEPLOYMENT

### 8.1 Configuração
- Porta única: 3000 (frontend + backend)
- Variáveis de ambiente:
  - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
  - `JWT_SECRET`
  - `NODE_ENV`
  - `PORT`

### 8.2 Scripts de Inicialização
- `01-create-database.sql`: Criação do schema
- `02-seed-initial-data.sql`: Dados iniciais
- `server.js`: Servidor principal

### 8.3 Comandos
\`\`\`bash
npm install
npm run build
npm start
\`\`\`

---

## 9. CRONOGRAMA DE DESENVOLVIMENTO

### Fase 1: Backend Core (Concluída)
- ✅ Schema do banco de dados
- ✅ APIs REST completas
- ✅ Sistema de autenticação
- ✅ Middleware de segurança

### Fase 2: Frontend Core (Concluída)
- ✅ Layout principal
- ✅ Sistema de autenticação
- ✅ CRUD de todas as entidades
- ✅ Sistema de notificações

### Fase 3: Funcionalidades Avançadas (Concluída)
- ✅ Alertas automáticos
- ✅ Manutenção preventiva
- ✅ Controle de estoque
- ✅ Relatórios e dashboards

### Fase 4: Testes e Deploy (Atual)
- ✅ Testes de integração
- ✅ Otimização de performance
- ✅ Documentação completa
- ✅ Deploy em produção

---

## 10. MANUTENÇÃO E SUPORTE

### 10.1 Logs do Sistema
- Logs de aplicação em `logs/app.log`
- Logs de erro em `logs/error.log`
- Logs de auditoria no banco de dados

### 10.2 Backup
- Backup diário do banco de dados
- Retenção de 30 dias
- Backup de arquivos de configuração

### 10.3 Monitoramento
- Health check endpoint: `/api/health`
- Métricas de performance
- Alertas de sistema crítico

---

**Documento elaborado por:** Sistema v0  
**Aprovado por:** [Nome do Responsável]  
**Data de Aprovação:** [Data]  
**Próxima Revisão:** [Data + 6 meses]
