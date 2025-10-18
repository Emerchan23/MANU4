# AUDITORIA TÉCNICA - CASOS DE TESTE
## Nova Ordem de Serviço

### 1. CASOS DE TESTE POSITIVOS

#### 1.1 Criação de OS com Dados Válidos
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "Manutenção preventiva do equipamento de raio-X",
  "priority": "ALTA",
  "dueDate": "31/12/2024",
  "estimatedCost": 150.50,
  "companyId": null,
  "observations": "Verificar calibração e limpeza dos componentes",
  "maintenanceType": "PREVENTIVA",
  "createdBy": 1
}

// Resposta Esperada (201):
{
  "success": true,
  "data": {
    "id": 123,
    "order_number": "OS-001/2024",
    "equipment_id": 1,
    "equipment_name": "Raio-X Portátil",
    "description": "Manutenção preventiva do equipamento de raio-X",
    "priority": "ALTA",
    "status": "ABERTA",
    "scheduled_date": "2024-12-31",
    "cost": 150.50,
    "observations": "Verificar calibração e limpeza dos componentes",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "message": "Ordem de serviço criada com sucesso"
}
```

#### 1.2 Atualização de OS Existente
```json
// PUT /api/service-orders
{
  "id": 123,
  "priority": "CRITICA",
  "status": "EM_ANDAMENTO",
  "observations": "Urgente - equipamento apresentou falha crítica"
}

// Resposta Esperada (200):
{
  "success": true,
  "data": {
    "id": 123,
    "priority": "CRITICA",
    "status": "EM_ANDAMENTO",
    "observations": "Urgente - equipamento apresentou falha crítica",
    "updated_at": "2024-01-15T14:45:00Z"
  },
  "message": "Ordem de serviço atualizada com sucesso"
}
```

#### 1.3 Busca de OS por ID
```json
// GET /api/service-orders/123
// Resposta Esperada (200):
{
  "success": true,
  "data": {
    "id": 123,
    "order_number": "OS-001/2024",
    "equipment_id": 1,
    "equipment_name": "Raio-X Portátil",
    "equipment_model": "XR-2000",
    "company_id": null,
    "company_name": null,
    "description": "Manutenção preventiva do equipamento de raio-X",
    "priority": "CRITICA",
    "status": "EM_ANDAMENTO",
    "requested_date": "2024-01-15",
    "scheduled_date": "2024-12-31",
    "cost": 150.50,
    "observations": "Urgente - equipamento apresentou falha crítica",
    "created_by": 1,
    "created_by_name": "João Silva",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T14:45:00Z"
  }
}
```

### 2. CASOS DE TESTE NEGATIVOS

#### 2.1 Validação de Campos Obrigatórios
```json
// POST /api/service-orders
{
  "description": "Teste sem equipamento"
}

// Resposta Esperada (400):
{
  "error": "Equipamento é obrigatório"
}
```

#### 2.2 Validação de Prioridade Inválida
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "Teste com prioridade inválida",
  "priority": "SUPER_ALTA",
  "dueDate": "31/12/2024"
}

// Resposta Esperada (400):
{
  "error": "Prioridade inválida. Valores aceitos: BAIXA, MEDIA, ALTA, CRITICA"
}
```

#### 2.3 Validação de Data Inválida
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "Teste com data inválida",
  "dueDate": "31/02/2024"
}

// Resposta Esperada (400):
{
  "error": "Data inválida"
}
```

#### 2.4 Validação de Formato de Data
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "Teste com formato de data incorreto",
  "dueDate": "2024-12-31"
}

// Resposta Esperada (400):
{
  "error": "Data deve estar no formato dd/mm/aaaa"
}
```

#### 2.5 Validação de Custo Negativo
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "Teste com custo negativo",
  "dueDate": "31/12/2024",
  "estimatedCost": -100.00
}

// Resposta Esperada (400):
{
  "error": "Custo deve ser um valor numérico positivo ou zero"
}
```

#### 2.6 Validação de Equipamento Inexistente
```json
// POST /api/service-orders
{
  "equipmentId": 99999,
  "description": "Teste com equipamento inexistente",
  "dueDate": "31/12/2024"
}

// Resposta Esperada (400):
{
  "error": "Equipamento não encontrado"
}
```

#### 2.7 Validação de Empresa Inexistente
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "Teste com empresa inexistente",
  "dueDate": "31/12/2024",
  "companyId": 99999
}

// Resposta Esperada (400):
{
  "error": "Empresa não encontrada"
}
```

#### 2.8 Validação de Descrição Muito Curta
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "Teste",
  "dueDate": "31/12/2024"
}

// Resposta Esperada (400):
{
  "error": "Descrição deve ter pelo menos 10 caracteres"
}
```

#### 2.9 Atualização de OS Inexistente
```json
// PUT /api/service-orders
{
  "id": 99999,
  "priority": "ALTA"
}

// Resposta Esperada (404):
{
  "error": "Ordem de serviço não encontrada"
}
```

### 3. CASOS DE TESTE DE EDGE CASES

#### 3.1 Data Limite no Passado
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "Teste com data no passado",
  "dueDate": "01/01/2020"
}

// Resposta Esperada (400):
{
  "error": "Data limite não pode ser anterior à data atual"
}
```

#### 3.2 Custo com Muitas Casas Decimais
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "Teste com custo com muitas casas decimais",
  "dueDate": "31/12/2024",
  "estimatedCost": 123.456789
}

// Resposta Esperada (201):
// Custo deve ser arredondado para 2 casas decimais: 123.46
```

#### 3.3 Descrição com Caracteres Especiais
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "Manutenção com acentos: ção, ã, é, ü e símbolos: @#$%",
  "dueDate": "31/12/2024"
}

// Resposta Esperada (201):
// Deve aceitar caracteres especiais e acentos
```

#### 3.4 Campos com Espaços em Branco
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "   Descrição com espaços   ",
  "observations": "   Observações com espaços   ",
  "dueDate": "31/12/2024"
}

// Resposta Esperada (201):
// Campos devem ser trimados automaticamente
```

### 4. CASOS DE TESTE DE PERFORMANCE

#### 4.1 Criação em Lote (Stress Test)
```javascript
// Teste de criação de 100 OS simultâneas
const promises = [];
for (let i = 0; i < 100; i++) {
  promises.push(
    fetch('/api/service-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        equipmentId: 1,
        description: `Teste de performance ${i}`,
        dueDate: '31/12/2024'
      })
    })
  );
}

const results = await Promise.all(promises);
// Todas as requisições devem ser processadas em menos de 5 segundos
```

#### 4.2 Busca com Filtros Complexos
```json
// GET /api/service-orders?status=ABERTA&priority=ALTA&equipment_id=1&date_from=01/01/2024&date_to=31/12/2024
// Deve retornar resultados em menos de 2 segundos
```

### 5. CASOS DE TESTE DE SEGURANÇA

#### 5.1 SQL Injection
```json
// POST /api/service-orders
{
  "equipmentId": "1; DROP TABLE service_orders; --",
  "description": "Teste de SQL Injection",
  "dueDate": "31/12/2024"
}

// Resposta Esperada (400):
{
  "error": "Equipamento deve ser um número válido"
}
```

#### 5.2 XSS em Descrição
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "<script>alert('XSS')</script>Teste de XSS",
  "dueDate": "31/12/2024"
}

// Resposta Esperada (201):
// Script deve ser sanitizado/escapado
```

#### 5.3 Payload Muito Grande
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "A".repeat(10000), // String com 10.000 caracteres
  "dueDate": "31/12/2024"
}

// Resposta Esperada (400):
{
  "error": "Descrição muito longa (máximo 5000 caracteres)"
}
```

### 6. EXEMPLOS DE REQUISIÇÕES cURL

#### 6.1 Criar OS
```bash
curl -X POST http://localhost:3000/api/service-orders \
  -H "Content-Type: application/json" \
  -d '{
    "equipmentId": 1,
    "description": "Manutenção preventiva do equipamento",
    "priority": "ALTA",
    "dueDate": "31/12/2024",
    "estimatedCost": 150.50
  }'
```

#### 6.2 Atualizar OS
```bash
curl -X PUT http://localhost:3000/api/service-orders \
  -H "Content-Type: application/json" \
  -d '{
    "id": 123,
    "status": "CONCLUIDA",
    "observations": "Manutenção concluída com sucesso"
  }'
```

#### 6.3 Buscar OS por ID
```bash
curl -X GET http://localhost:3000/api/service-orders/123 \
  -H "Content-Type: application/json"
```

#### 6.4 Listar OS com Filtros
```bash
curl -X GET "http://localhost:3000/api/service-orders?status=ABERTA&priority=ALTA" \
  -H "Content-Type: application/json"
```

### 7. TESTES DE INTEGRAÇÃO COM BANCO

#### 7.1 Verificar Triggers de Data
```sql
-- Inserir OS com data de conclusão e verificar se warranty_expiry é calculada
INSERT INTO service_orders (
  order_number, equipment_id, description, priority, 
  requested_date, completion_date, warranty_days
) VALUES (
  'OS-TEST-001', 1, 'Teste de trigger', 'MEDIA', 
  CURDATE(), CURDATE(), 90
);

-- Verificar se warranty_expiry foi calculada corretamente
SELECT warranty_expiry FROM service_orders WHERE order_number = 'OS-TEST-001';
-- Deve retornar: data atual + 90 dias
```

#### 7.2 Verificar Constraints
```sql
-- Tentar inserir custo negativo (deve falhar)
INSERT INTO service_orders (
  order_number, equipment_id, description, priority, 
  requested_date, cost
) VALUES (
  'OS-TEST-002', 1, 'Teste de constraint', 'MEDIA', 
  CURDATE(), -100.00
);
-- Deve retornar erro: Check constraint 'chk_cost_positive' is violated
```

### 8. TESTES DE REGRESSÃO

#### 8.1 Compatibilidade com Dados Existentes
```sql
-- Verificar se OS antigas ainda funcionam após alterações
SELECT COUNT(*) FROM service_orders WHERE created_at < '2024-01-01';
-- Todas as OS antigas devem ser acessíveis
```

#### 8.2 Migração de Prioridades
```sql
-- Verificar se prioridades antigas foram migradas corretamente
SELECT DISTINCT priority FROM service_orders;
-- Deve retornar apenas: BAIXA, MEDIA, ALTA, CRITICA
```

### 9. MÉTRICAS DE QUALIDADE

#### 9.1 Tempo de Resposta
- Criação de OS: < 500ms
- Atualização de OS: < 300ms
- Busca por ID: < 200ms
- Listagem com filtros: < 1s

#### 9.2 Taxa de Sucesso
- Requisições válidas: 100% de sucesso
- Validações de entrada: 100% de rejeição para dados inválidos
- Tratamento de erros: 0% de crashes/500 errors não tratados

#### 9.3 Cobertura de Testes
- Casos positivos: 100%
- Casos negativos: 100%
- Edge cases: 90%
- Testes de segurança: 100%

### 1. CASOS DE TESTE POSITIVOS

#### 1.1 Criação de OS com Dados Válidos
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "Manutenção preventiva do equipamento de raio-X",
  "priority": "ALTA",
  "dueDate": "31/12/2024",
  "estimatedCost": 150.50,
  "companyId": null,
  "observations": "Verificar calibração e limpeza dos componentes",
  "maintenanceType": "PREVENTIVA",
  "createdBy": 1
}

// Resposta Esperada (201):
{
  "success": true,
  "data": {
    "id": 123,
    "order_number": "OS-001/2024",
    "equipment_id": 1,
    "equipment_name": "Raio-X Portátil",
    "description": "Manutenção preventiva do equipamento de raio-X",
    "priority": "ALTA",
    "status": "ABERTA",
    "scheduled_date": "2024-12-31",
    "cost": 150.50,
    "observations": "Verificar calibração e limpeza dos componentes",
    "created_at": "2024-01-15T10:30:00Z"
  },
  "message": "Ordem de serviço criada com sucesso"
}
```

#### 1.2 Atualização de OS Existente
```json
// PUT /api/service-orders
{
  "id": 123,
  "priority": "CRITICA",
  "status": "EM_ANDAMENTO",
  "observations": "Urgente - equipamento apresentou falha crítica"
}

// Resposta Esperada (200):
{
  "success": true,
  "data": {
    "id": 123,
    "priority": "CRITICA",
    "status": "EM_ANDAMENTO",
    "observations": "Urgente - equipamento apresentou falha crítica",
    "updated_at": "2024-01-15T14:45:00Z"
  },
  "message": "Ordem de serviço atualizada com sucesso"
}
```

#### 1.3 Busca de OS por ID
```json
// GET /api/service-orders/123
// Resposta Esperada (200):
{
  "success": true,
  "data": {
    "id": 123,
    "order_number": "OS-001/2024",
    "equipment_id": 1,
    "equipment_name": "Raio-X Portátil",
    "equipment_model": "XR-2000",
    "company_id": null,
    "company_name": null,
    "description": "Manutenção preventiva do equipamento de raio-X",
    "priority": "CRITICA",
    "status": "EM_ANDAMENTO",
    "requested_date": "2024-01-15",
    "scheduled_date": "2024-12-31",
    "cost": 150.50,
    "observations": "Urgente - equipamento apresentou falha crítica",
    "created_by": 1,
    "created_by_name": "João Silva",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T14:45:00Z"
  }
}
```

### 2. CASOS DE TESTE NEGATIVOS

#### 2.1 Validação de Campos Obrigatórios
```json
// POST /api/service-orders
{
  "description": "Teste sem equipamento"
}

// Resposta Esperada (400):
{
  "error": "Equipamento é obrigatório"
}
```

#### 2.2 Validação de Prioridade Inválida
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "Teste com prioridade inválida",
  "priority": "SUPER_ALTA",
  "dueDate": "31/12/2024"
}

// Resposta Esperada (400):
{
  "error": "Prioridade inválida. Valores aceitos: BAIXA, MEDIA, ALTA, CRITICA"
}
```

#### 2.3 Validação de Data Inválida
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "Teste com data inválida",
  "dueDate": "31/02/2024"
}

// Resposta Esperada (400):
{
  "error": "Data inválida"
}
```

#### 2.4 Validação de Formato de Data
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "Teste com formato de data incorreto",
  "dueDate": "2024-12-31"
}

// Resposta Esperada (400):
{
  "error": "Data deve estar no formato dd/mm/aaaa"
}
```

#### 2.5 Validação de Custo Negativo
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "Teste com custo negativo",
  "dueDate": "31/12/2024",
  "estimatedCost": -100.00
}

// Resposta Esperada (400):
{
  "error": "Custo deve ser um valor numérico positivo ou zero"
}
```

#### 2.6 Validação de Equipamento Inexistente
```json
// POST /api/service-orders
{
  "equipmentId": 99999,
  "description": "Teste com equipamento inexistente",
  "dueDate": "31/12/2024"
}

// Resposta Esperada (400):
{
  "error": "Equipamento não encontrado"
}
```

#### 2.7 Validação de Empresa Inexistente
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "Teste com empresa inexistente",
  "dueDate": "31/12/2024",
  "companyId": 99999
}

// Resposta Esperada (400):
{
  "error": "Empresa não encontrada"
}
```

#### 2.8 Validação de Descrição Muito Curta
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "Teste",
  "dueDate": "31/12/2024"
}

// Resposta Esperada (400):
{
  "error": "Descrição deve ter pelo menos 10 caracteres"
}
```

#### 2.9 Atualização de OS Inexistente
```json
// PUT /api/service-orders
{
  "id": 99999,
  "priority": "ALTA"
}

// Resposta Esperada (404):
{
  "error": "Ordem de serviço não encontrada"
}
```

### 3. CASOS DE TESTE DE EDGE CASES

#### 3.1 Data Limite no Passado
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "Teste com data no passado",
  "dueDate": "01/01/2020"
}

// Resposta Esperada (400):
{
  "error": "Data limite não pode ser anterior à data atual"
}
```

#### 3.2 Custo com Muitas Casas Decimais
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "Teste com custo com muitas casas decimais",
  "dueDate": "31/12/2024",
  "estimatedCost": 123.456789
}

// Resposta Esperada (201):
// Custo deve ser arredondado para 2 casas decimais: 123.46
```

#### 3.3 Descrição com Caracteres Especiais
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "Manutenção com acentos: ção, ã, é, ü e símbolos: @#$%",
  "dueDate": "31/12/2024"
}

// Resposta Esperada (201):
// Deve aceitar caracteres especiais e acentos
```

#### 3.4 Campos com Espaços em Branco
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "   Descrição com espaços   ",
  "observations": "   Observações com espaços   ",
  "dueDate": "31/12/2024"
}

// Resposta Esperada (201):
// Campos devem ser trimados automaticamente
```

### 4. CASOS DE TESTE DE PERFORMANCE

#### 4.1 Criação em Lote (Stress Test)
```javascript
// Teste de criação de 100 OS simultâneas
const promises = [];
for (let i = 0; i < 100; i++) {
  promises.push(
    fetch('/api/service-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        equipmentId: 1,
        description: `Teste de performance ${i}`,
        dueDate: '31/12/2024'
      })
    })
  );
}

const results = await Promise.all(promises);
// Todas as requisições devem ser processadas em menos de 5 segundos
```

#### 4.2 Busca com Filtros Complexos
```json
// GET /api/service-orders?status=ABERTA&priority=ALTA&equipment_id=1&date_from=01/01/2024&date_to=31/12/2024
// Deve retornar resultados em menos de 2 segundos
```

### 5. CASOS DE TESTE DE SEGURANÇA

#### 5.1 SQL Injection
```json
// POST /api/service-orders
{
  "equipmentId": "1; DROP TABLE service_orders; --",
  "description": "Teste de SQL Injection",
  "dueDate": "31/12/2024"
}

// Resposta Esperada (400):
{
  "error": "Equipamento deve ser um número válido"
}
```

#### 5.2 XSS em Descrição
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "<script>alert('XSS')</script>Teste de XSS",
  "dueDate": "31/12/2024"
}

// Resposta Esperada (201):
// Script deve ser sanitizado/escapado
```

#### 5.3 Payload Muito Grande
```json
// POST /api/service-orders
{
  "equipmentId": 1,
  "description": "A".repeat(10000), // String com 10.000 caracteres
  "dueDate": "31/12/2024"
}

// Resposta Esperada (400):
{
  "error": "Descrição muito longa (máximo 5000 caracteres)"
}
```

### 6. EXEMPLOS DE REQUISIÇÕES cURL

#### 6.1 Criar OS
```bash
curl -X POST http://localhost:3000/api/service-orders \
  -H "Content-Type: application/json" \
  -d '{
    "equipmentId": 1,
    "description": "Manutenção preventiva do equipamento",
    "priority": "ALTA",
    "dueDate": "31/12/2024",
    "estimatedCost": 150.50
  }'
```

#### 6.2 Atualizar OS
```bash
curl -X PUT http://localhost:3000/api/service-orders \
  -H "Content-Type: application/json" \
  -d '{
    "id": 123,
    "status": "CONCLUIDA",
    "observations": "Manutenção concluída com sucesso"
  }'
```

#### 6.3 Buscar OS por ID
```bash
curl -X GET http://localhost:3000/api/service-orders/123 \
  -H "Content-Type: application/json"
```

#### 6.4 Listar OS com Filtros
```bash
curl -X GET "http://localhost:3000/api/service-orders?status=ABERTA&priority=ALTA" \
  -H "Content-Type: application/json"
```

### 7. TESTES DE INTEGRAÇÃO COM BANCO

#### 7.1 Verificar Triggers de Data
```sql
-- Inserir OS com data de conclusão e verificar se warranty_expiry é calculada
INSERT INTO service_orders (
  order_number, equipment_id, description, priority, 
  requested_date, completion_date, warranty_days
) VALUES (
  'OS-TEST-001', 1, 'Teste de trigger', 'MEDIA', 
  CURDATE(), CURDATE(), 90
);

-- Verificar se warranty_expiry foi calculada corretamente
SELECT warranty_expiry FROM service_orders WHERE order_number = 'OS-TEST-001';
-- Deve retornar: data atual + 90 dias
```

#### 7.2 Verificar Constraints
```sql
-- Tentar inserir custo negativo (deve falhar)
INSERT INTO service_orders (
  order_number, equipment_id, description, priority, 
  requested_date, cost
) VALUES (
  'OS-TEST-002', 1, 'Teste de constraint', 'MEDIA', 
  CURDATE(), -100.00
);
-- Deve retornar erro: Check constraint 'chk_cost_positive' is violated
```

### 8. TESTES DE REGRESSÃO

#### 8.1 Compatibilidade com Dados Existentes
```sql
-- Verificar se OS antigas ainda funcionam após alterações
SELECT COUNT(*) FROM service_orders WHERE created_at < '2024-01-01';
-- Todas as OS antigas devem ser acessíveis
```

#### 8.2 Migração de Prioridades
```sql
-- Verificar se prioridades antigas foram migradas corretamente
SELECT DISTINCT priority FROM service_orders;
-- Deve retornar apenas: BAIXA, MEDIA, ALTA, CRITICA
```

### 9. MÉTRICAS DE QUALIDADE

#### 9.1 Tempo de Resposta
- Criação de OS: < 500ms
- Atualização de OS: < 300ms
- Busca por ID: < 200ms
- Listagem com filtros: < 1s

#### 9.2 Taxa de Sucesso
- Requisições válidas: 100% de sucesso
- Validações de entrada: 100% de rejeição para dados inválidos
- Tratamento de erros: 0% de crashes/500 errors não tratados

#### 9.3 Cobertura de Testes
- Casos positivos: 100%
- Casos negativos: 100%
- Edge cases: 90%
- Testes de segurança: 100%