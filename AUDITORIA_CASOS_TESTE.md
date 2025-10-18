# 🧪 CASOS DE TESTE - NOVO EQUIPAMENTO

## 1. CASOS DE TESTE POSITIVOS

### 1.1. Criação de Equipamento Válido
```json
POST /api/equipment
Content-Type: application/json

{
  "patrimonio_number": "PAT001",
  "name": "Impressora Laser HP",
  "manufacturer": "HP",
  "model": "LaserJet Pro M404n",
  "serial_number": "SN123456789",
  "category_id": 1,
  "sector_id": 2,
  "subsector_id": 5,
  "installation_date": "15/01/2024",
  "maintenance_frequency_days": 90,
  "status": "Ativo",
  "observations": "Equipamento novo, instalado no setor administrativo",
  "voltage": "110V"
}
```

**Resposta Esperada:**
```json
{
  "success": true,
  "data": {
    "id": 16
  },
  "message": "Equipamento criado com sucesso"
}
```

### 1.2. Atualização de Equipamento
```json
PUT /api/equipment/16
Content-Type: application/json

{
  "patrimonio_number": "PAT001",
  "name": "Impressora Laser HP - Atualizada",
  "manufacturer": "HP",
  "model": "LaserJet Pro M404n",
  "serial_number": "SN123456789",
  "category_id": 1,
  "sector_id": 2,
  "subsector_id": 5,
  "installation_date": "15/01/2024",
  "maintenance_frequency_days": 60,
  "status": "Ativo",
  "observations": "Frequência de manutenção reduzida para 60 dias",
  "voltage": "110V"
}
```

### 1.3. Equipamento com Campos Opcionais Vazios
```json
POST /api/equipment
Content-Type: application/json

{
  "patrimonio_number": "PAT002",
  "name": "Monitor Dell",
  "manufacturer": "",
  "model": "",
  "serial_number": "",
  "category_id": 2,
  "sector_id": 1,
  "subsector_id": null,
  "installation_date": "",
  "maintenance_frequency_days": null,
  "status": "Ativo",
  "observations": "",
  "voltage": ""
}
```

## 2. CASOS DE TESTE NEGATIVOS

### 2.1. Patrimônio Duplicado (409 Conflict)
```json
POST /api/equipment
Content-Type: application/json

{
  "patrimonio_number": "PAT001",  // ❌ Já existe
  "name": "Outro Equipamento",
  "category_id": 1,
  "sector_id": 1
}
```

**Resposta Esperada:**
```json
{
  "success": false,
  "message": "Número do patrimônio já existe"
}
```

### 2.2. Número de Série Duplicado (409 Conflict)
```json
POST /api/equipment
Content-Type: application/json

{
  "patrimonio_number": "PAT003",
  "name": "Equipamento Teste",
  "serial_number": "SN123456789",  // ❌ Já existe
  "category_id": 1,
  "sector_id": 1
}
```

### 2.3. Campos Obrigatórios Vazios (422 Unprocessable Entity)
```json
POST /api/equipment
Content-Type: application/json

{
  "patrimonio_number": "",  // ❌ Obrigatório
  "name": "",               // ❌ Obrigatório
  "category_id": 1,
  "sector_id": 1
}
```

**Resposta Esperada:**
```json
{
  "success": false,
  "message": "Dados inválidos",
  "errors": [
    "Número do patrimônio é obrigatório",
    "Nome do equipamento é obrigatório"
  ]
}
```

### 2.4. Data Inválida (422 Unprocessable Entity)
```json
POST /api/equipment
Content-Type: application/json

{
  "patrimonio_number": "PAT004",
  "name": "Equipamento Teste",
  "installation_date": "31/02/2024",  // ❌ Data inválida
  "category_id": 1,
  "sector_id": 1
}
```

**Resposta Esperada:**
```json
{
  "success": false,
  "message": "Dados inválidos",
  "errors": [
    "Data inválida"
  ]
}
```

### 2.5. Formato de Data Incorreto (422 Unprocessable Entity)
```json
POST /api/equipment
Content-Type: application/json

{
  "patrimonio_number": "PAT005",
  "name": "Equipamento Teste",
  "installation_date": "2024-01-15",  // ❌ Formato incorreto (deve ser dd/mm/aaaa)
  "category_id": 1,
  "sector_id": 1
}
```

### 2.6. Frequência de Manutenção Inválida (422 Unprocessable Entity)
```json
POST /api/equipment
Content-Type: application/json

{
  "patrimonio_number": "PAT006",
  "name": "Equipamento Teste",
  "maintenance_frequency_days": -10,  // ❌ Deve ser > 0
  "category_id": 1,
  "sector_id": 1
}
```

### 2.7. Status Inválido (422 Unprocessable Entity)
```json
POST /api/equipment
Content-Type: application/json

{
  "patrimonio_number": "PAT007",
  "name": "Equipamento Teste",
  "status": "StatusInvalido",  // ❌ Deve ser: Ativo, Inativo ou Em_Manutencao
  "category_id": 1,
  "sector_id": 1
}
```

### 2.8. Subsetor Incompatível com Setor (422 Unprocessable Entity)
```json
POST /api/equipment
Content-Type: application/json

{
  "patrimonio_number": "PAT008",
  "name": "Equipamento Teste",
  "sector_id": 1,
  "subsector_id": 10,  // ❌ Subsetor não pertence ao setor 1
  "category_id": 1
}
```

### 2.9. Referência Inexistente (422 Unprocessable Entity)
```json
POST /api/equipment
Content-Type: application/json

{
  "patrimonio_number": "PAT009",
  "name": "Equipamento Teste",
  "category_id": 999,  // ❌ Categoria inexistente
  "sector_id": 1
}
```

## 3. CASOS DE TESTE DE INTEGRAÇÃO

### 3.1. Teste de Listagem com Filtros
```bash
# Listar todos os equipamentos
GET /api/equipment

# Listar por setor
GET /api/equipment?sector_id=1

# Listar por categoria
GET /api/equipment?category_id=2

# Listar por status
GET /api/equipment?status=Ativo
```

### 3.2. Teste de Busca por ID
```bash
# Buscar equipamento existente
GET /api/equipment/1

# Buscar equipamento inexistente (404)
GET /api/equipment/999
```

## 4. TESTES DE PERFORMANCE

### 4.1. Teste de Carga
```javascript
// Criar 100 equipamentos em sequência
for (let i = 1; i <= 100; i++) {
  const equipment = {
    patrimonio_number: `PAT${i.toString().padStart(3, '0')}`,
    name: `Equipamento Teste ${i}`,
    category_id: 1,
    sector_id: 1
  };
  
  // POST /api/equipment
}
```

### 4.2. Teste de Consulta com Grande Volume
```sql
-- Inserir dados de teste
INSERT INTO equipment (patrimonio_number, name, category_id, sector_id, status)
SELECT 
  CONCAT('BULK', LPAD(seq, 6, '0')),
  CONCAT('Equipamento Bulk ', seq),
  1,
  1,
  'Ativo'
FROM (
  SELECT @row := @row + 1 as seq
  FROM information_schema.columns c1, information_schema.columns c2, (SELECT @row := 0) r
  LIMIT 10000
) t;

-- Testar performance da consulta
SELECT COUNT(*) FROM equipment;
```

## 5. TESTES DE SEGURANÇA

### 5.1. SQL Injection
```json
POST /api/equipment
Content-Type: application/json

{
  "patrimonio_number": "PAT'; DROP TABLE equipment; --",
  "name": "Teste SQL Injection",
  "category_id": 1,
  "sector_id": 1
}
```

### 5.2. XSS em Campos de Texto
```json
POST /api/equipment
Content-Type: application/json

{
  "patrimonio_number": "PAT010",
  "name": "<script>alert('XSS')</script>",
  "observations": "<img src=x onerror=alert('XSS')>",
  "category_id": 1,
  "sector_id": 1
}
```

### 5.3. Tamanho Excessivo de Dados
```json
POST /api/equipment
Content-Type: application/json

{
  "patrimonio_number": "PAT011",
  "name": "A".repeat(1000),  // ❌ Muito longo
  "observations": "B".repeat(10000),  // ❌ Muito longo
  "category_id": 1,
  "sector_id": 1
}
```