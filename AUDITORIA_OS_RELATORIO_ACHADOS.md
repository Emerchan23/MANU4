# 🔍 AUDITORIA TÉCNICA - NOVA ORDEM DE SERVIÇO

## 📋 RELATÓRIO DE ACHADOS

### 🔴 **ACHADOS DE ALTA SEVERIDADE**

#### 1. **Inconsistência de Nomenclatura de Prioridades**
- **UI/TypeScript**: `"BAIXA" | "MEDIA" | "ALTA"`
- **Banco de Dados**: `enum('baixa','media','alta','urgente')`
- **Impacto**: Falha na validação e armazenamento de prioridades
- **Evidência**: UI permite "ALTA" mas DB tem "urgente" como valor máximo

#### 2. **Inconsistência de Status entre UI e DB**
- **UI/TypeScript**: `"ABERTA" | "EM_ANDAMENTO" | "AGUARDANDO_APROVACAO" | "APROVADA" | "REJEITADA" | "CONCLUIDA"`
- **Banco de Dados**: `enum('aberta','em_andamento','concluida','cancelada')`
- **Impacto**: Status como "AGUARDANDO_APROVACAO", "APROVADA", "REJEITADA" não podem ser salvos no DB

#### 3. **Campo `maintenance_type_id` Ausente na UI**
- **DB**: Coluna `maintenance_type_id` existe na tabela
- **UI**: Não há campo correspondente no formulário
- **API**: Campo é enviado mas não mapeado corretamente
- **Impacto**: Dados incompletos sendo salvos

#### 4. **Conversão de Datas Inadequada**
- **UI**: Usa `DateInput` com formato brasileiro (dd/mm/aaaa)
- **API**: Função `convertBRToISO()` pode falhar com datas inválidas
- **Impacto**: Possível corrupção de dados ou falhas na validação

### 🟡 **ACHADOS DE MÉDIA SEVERIDADE**

#### 5. **Mapeamento Incorreto de Campos**
- **UI**: `dueDate` (Data Limite)
- **API**: Salva como `scheduled_date` em vez de `requested_date`
- **DB**: Campos `requested_date` e `scheduled_date` existem mas são usados incorretamente

#### 6. **Validação de Custo Insuficiente**
- **UI**: Permite valores monetários mas sem validação de formato
- **DB**: `DECIMAL(10,2)` pode não ser suficiente para valores grandes
- **API**: Não valida se o valor é positivo

#### 7. **Ausência de Validação de Referências**
- **API**: Não verifica se `equipment_id` e `company_id` existem antes de inserir
- **Impacto**: Possível criação de registros órfãos

### 🟢 **ACHADOS DE BAIXA SEVERIDADE**

#### 8. **Inconsistência de Nomenclatura de Colunas**
- **DB**: Mistura de inglês (`order_number`, `equipment_id`) e português (`descricao`)
- **Recomendação**: Padronizar para inglês ou português

#### 9. **Ausência de Índices de Performance**
- **DB**: Faltam índices em `status`, `priority`, `requested_date`
- **Impacto**: Consultas lentas em tabelas grandes

## 📊 MAPEAMENTO DETALHADO UI ↔ API ↔ DB

| Campo UI | Tipo UI | Campo API | Coluna DB | Tipo DB | Status |
|----------|---------|-----------|-----------|---------|---------|
| Equipamento* | select | equipment_id | equipment_id | int(11) | ✅ OK |
| Tipo de Manutenção* | select | type | type | varchar(50) | ⚠️ PARCIAL |
| - | - | maintenance_type_id | maintenance_type_id | int(11) | ❌ AUSENTE |
| Prioridade* | select | priority | priority | enum | ❌ INCOMPATÍVEL |
| Data Limite* | date | scheduled_date | scheduled_date | date | ⚠️ MAPEAMENTO INCORRETO |
| Custo Estimado | currency | cost | cost | decimal(10,2) | ⚠️ SEM VALIDAÇÃO |
| Empresa Terceirizada | select | company_id | company_id | int(11) | ✅ OK |
| Descrição do Serviço* | textarea | description | description | text | ✅ OK |
| Observações | textarea | observations | observations | text | ✅ OK |

## 🔍 ESTRUTURA ATUAL DO BANCO DE DADOS

### Tabela `service_orders`
```sql
CREATE TABLE service_orders (
  id int(11) NOT NULL AUTO_INCREMENT,
  order_number varchar(20) NOT NULL UNIQUE,
  equipment_id int(11) NOT NULL,
  company_id int(11) NOT NULL,
  description text NOT NULL,
  priority enum('baixa','media','alta','urgente') DEFAULT 'media',
  status enum('aberta','em_andamento','concluida','cancelada') DEFAULT 'aberta',
  requested_date date NOT NULL,
  scheduled_date date NULL,
  completion_date date NULL,
  warranty_days int(11) DEFAULT 0,
  warranty_expiry date NULL,
  cost decimal(10,2) NULL,
  observations text NULL,
  created_by int(11) NULL,
  assigned_to int(11) NULL,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  type varchar(50) NULL,
  maintenance_type_id int(11) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY order_number (order_number),
  KEY equipment_id (equipment_id),
  KEY company_id (company_id),
  KEY status (status)
);
```

## 🎯 RESUMO EXECUTIVO

- **Total de Achados**: 9
- **Alta Severidade**: 4 (44%)
- **Média Severidade**: 3 (33%)
- **Baixa Severidade**: 2 (22%)

**Principais Riscos**:
1. Falhas na validação de dados críticos (prioridade, status)
2. Perda de dados por mapeamento incorreto
3. Inconsistências que podem causar erros em produção

**Recomendação**: Correção imediata dos achados de alta severidade antes do deploy em produção.

#### 9. **Ausência de Índices de Performance**
- **DB**: Faltam índices em `status`, `priority`, `requested_date`
- **Impacto**: Consultas lentas em tabelas grandes

## 📊 MAPEAMENTO DETALHADO UI ↔ API ↔ DB

| Campo UI | Tipo UI | Campo API | Coluna DB | Tipo DB | Status |
|----------|---------|-----------|-----------|---------|---------|
| Equipamento* | select | equipment_id | equipment_id | int(11) | ✅ OK |
| Tipo de Manutenção* | select | type | type | varchar(50) | ⚠️ PARCIAL |
| - | - | maintenance_type_id | maintenance_type_id | int(11) | ❌ AUSENTE |
| Prioridade* | select | priority | priority | enum | ❌ INCOMPATÍVEL |
| Data Limite* | date | scheduled_date | scheduled_date | date | ⚠️ MAPEAMENTO INCORRETO |
| Custo Estimado | currency | cost | cost | decimal(10,2) | ⚠️ SEM VALIDAÇÃO |
| Empresa Terceirizada | select | company_id | company_id | int(11) | ✅ OK |
| Descrição do Serviço* | textarea | description | description | text | ✅ OK |
| Observações | textarea | observations | observations | text | ✅ OK |

## 🔍 ESTRUTURA ATUAL DO BANCO DE DADOS

### Tabela `service_orders`
```sql
CREATE TABLE service_orders (
  id int(11) NOT NULL AUTO_INCREMENT,
  order_number varchar(20) NOT NULL UNIQUE,
  equipment_id int(11) NOT NULL,
  company_id int(11) NOT NULL,
  description text NOT NULL,
  priority enum('baixa','media','alta','urgente') DEFAULT 'media',
  status enum('aberta','em_andamento','concluida','cancelada') DEFAULT 'aberta',
  requested_date date NOT NULL,
  scheduled_date date NULL,
  completion_date date NULL,
  warranty_days int(11) DEFAULT 0,
  warranty_expiry date NULL,
  cost decimal(10,2) NULL,
  observations text NULL,
  created_by int(11) NULL,
  assigned_to int(11) NULL,
  created_at datetime DEFAULT CURRENT_TIMESTAMP,
  updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  type varchar(50) NULL,
  maintenance_type_id int(11) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY order_number (order_number),
  KEY equipment_id (equipment_id),
  KEY company_id (company_id),
  KEY status (status)
);
```

## 🎯 RESUMO EXECUTIVO

- **Total de Achados**: 9
- **Alta Severidade**: 4 (44%)
- **Média Severidade**: 3 (33%)
- **Baixa Severidade**: 2 (22%)

**Principais Riscos**:
1. Falhas na validação de dados críticos (prioridade, status)
2. Perda de dados por mapeamento incorreto
3. Inconsistências que podem causar erros em produção

**Recomendação**: Correção imediata dos achados de alta severidade antes do deploy em produção.