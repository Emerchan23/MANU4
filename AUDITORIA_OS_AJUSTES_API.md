# AUDITORIA TÉCNICA - AJUSTES DE API
## Nova Ordem de Serviço

### 1. VALIDAÇÕES DE ENTRADA (Alta Severidade)

#### 1.1 Validação de Prioridade
```javascript
// Adicionar no arquivo: app/api/service-orders/route.ts
const VALID_PRIORITIES = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];

function validatePriority(priority) {
    if (!priority || !VALID_PRIORITIES.includes(priority.toUpperCase())) {
        throw new Error('Prioridade inválida. Valores aceitos: BAIXA, MEDIA, ALTA, CRITICA');
    }
    return priority.toUpperCase();
}
```

#### 1.2 Validação de Status
```javascript
const VALID_STATUSES = ['ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_APROVACAO', 'APROVADA', 'REJEITADA', 'CONCLUIDA', 'CANCELADA'];

function validateStatus(status) {
    if (!status || !VALID_STATUSES.includes(status.toUpperCase())) {
        throw new Error('Status inválido. Valores aceitos: ' + VALID_STATUSES.join(', '));
    }
    return status.toUpperCase();
}
```

#### 1.3 Validação de Data Brasileira
```javascript
function validateBrazilianDate(dateStr) {
    // Regex para formato dd/mm/aaaa
    const brazilianDateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateStr.match(brazilianDateRegex);
    
    if (!match) {
        throw new Error('Data deve estar no formato dd/mm/aaaa');
    }
    
    const [, day, month, year] = match;
    const date = new Date(year, month - 1, day);
    
    // Verificar se a data é válida
    if (date.getDate() != day || date.getMonth() != (month - 1) || date.getFullYear() != year) {
        throw new Error('Data inválida');
    }
    
    return date.toISOString().split('T')[0]; // Retorna formato YYYY-MM-DD
}
```

#### 1.4 Validação de Custo
```javascript
function validateCost(cost) {
    if (cost !== null && cost !== undefined) {
        const numericCost = parseFloat(cost);
        if (isNaN(numericCost) || numericCost < 0) {
            throw new Error('Custo deve ser um valor numérico positivo ou zero');
        }
        return numericCost;
    }
    return null;
}
```

#### 1.5 Validação de Referências (Foreign Keys)
```javascript
async function validateEquipmentExists(equipmentId) {
    const result = await db.query('SELECT id FROM equipment WHERE id = ?', [equipmentId]);
    if (result.length === 0) {
        throw new Error('Equipamento não encontrado');
    }
}

async function validateCompanyExists(companyId) {
    if (companyId) {
        const result = await db.query('SELECT id FROM empresas WHERE id = ?', [companyId]);
        if (result.length === 0) {
            throw new Error('Empresa não encontrada');
        }
    }
}
```

### 2. AJUSTES NO ENDPOINT POST (Criar OS)

```javascript
// app/api/service-orders/route.ts - Método POST
export async function POST(request) {
    try {
        const body = await request.json();
        
        // Validações obrigatórias
        if (!body.equipmentId) {
            return NextResponse.json({ error: 'Equipamento é obrigatório' }, { status: 400 });
        }
        
        if (!body.description || body.description.trim().length < 10) {
            return NextResponse.json({ error: 'Descrição deve ter pelo menos 10 caracteres' }, { status: 400 });
        }
        
        if (!body.dueDate) {
            return NextResponse.json({ error: 'Data limite é obrigatória' }, { status: 400 });
        }
        
        // Validar e converter dados
        const priority = validatePriority(body.priority || 'MEDIA');
        const status = validateStatus(body.status || 'ABERTA');
        const scheduledDate = validateBrazilianDate(body.dueDate);
        const cost = validateCost(body.estimatedCost);
        
        // Validar referências
        await validateEquipmentExists(body.equipmentId);
        if (body.companyId) {
            await validateCompanyExists(body.companyId);
        }
        
        // Gerar número da OS
        const orderNumber = await generateOrderNumber();
        
        // Inserir no banco
        const query = `
            INSERT INTO service_orders (
                order_number, equipment_id, company_id, description, 
                priority, status, requested_date, scheduled_date, 
                cost, observations, created_by, type, maintenance_type_id
            ) VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
            orderNumber,
            body.equipmentId,
            body.companyId || null,
            body.description,
            priority,
            status,
            scheduledDate,
            cost,
            body.observations || null,
            body.createdBy || null,
            body.maintenanceType || null,
            body.maintenanceTypeId || null
        ];
        
        const result = await db.query(query, values);
        
        // Retornar OS criada
        const newOrder = await getServiceOrderById(result.insertId);
        
        return NextResponse.json({
            success: true,
            data: newOrder,
            message: 'Ordem de serviço criada com sucesso'
        }, { status: 201 });
        
    } catch (error) {
        console.error('Erro ao criar OS:', error);
        return NextResponse.json({
            error: error.message || 'Erro interno do servidor'
        }, { status: 500 });
    }
}
```

### 3. AJUSTES NO ENDPOINT PUT (Atualizar OS)

```javascript
// app/api/service-orders/route.ts - Método PUT
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id } = body;
        
        if (!id) {
            return NextResponse.json({ error: 'ID da OS é obrigatório' }, { status: 400 });
        }
        
        // Verificar se OS existe
        const existingOrder = await getServiceOrderById(id);
        if (!existingOrder) {
            return NextResponse.json({ error: 'Ordem de serviço não encontrada' }, { status: 404 });
        }
        
        // Construir query dinâmica
        const updates = [];
        const values = [];
        
        if (body.equipmentId !== undefined) {
            await validateEquipmentExists(body.equipmentId);
            updates.push('equipment_id = ?');
            values.push(body.equipmentId);
        }
        
        if (body.companyId !== undefined) {
            if (body.companyId) {
                await validateCompanyExists(body.companyId);
            }
            updates.push('company_id = ?');
            values.push(body.companyId);
        }
        
        if (body.description !== undefined) {
            if (!body.description || body.description.trim().length < 10) {
                return NextResponse.json({ error: 'Descrição deve ter pelo menos 10 caracteres' }, { status: 400 });
            }
            updates.push('description = ?');
            values.push(body.description);
        }
        
        if (body.priority !== undefined) {
            const priority = validatePriority(body.priority);
            updates.push('priority = ?');
            values.push(priority);
        }
        
        if (body.status !== undefined) {
            const status = validateStatus(body.status);
            updates.push('status = ?');
            values.push(status);
        }
        
        if (body.dueDate !== undefined) {
            const scheduledDate = validateBrazilianDate(body.dueDate);
            updates.push('scheduled_date = ?');
            values.push(scheduledDate);
        }
        
        if (body.estimatedCost !== undefined) {
            const cost = validateCost(body.estimatedCost);
            updates.push('cost = ?');
            values.push(cost);
        }
        
        if (body.observations !== undefined) {
            updates.push('observations = ?');
            values.push(body.observations);
        }
        
        if (updates.length === 0) {
            return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
        }
        
        // Adicionar updated_at
        updates.push('updated_at = NOW()');
        values.push(id);
        
        const query = `UPDATE service_orders SET ${updates.join(', ')} WHERE id = ?`;
        await db.query(query, values);
        
        // Retornar OS atualizada
        const updatedOrder = await getServiceOrderById(id);
        
        return NextResponse.json({
            success: true,
            data: updatedOrder,
            message: 'Ordem de serviço atualizada com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao atualizar OS:', error);
        return NextResponse.json({
            error: error.message || 'Erro interno do servidor'
        }, { status: 500 });
    }
}
```

### 4. FUNÇÃO AUXILIAR PARA BUSCAR OS

```javascript
async function getServiceOrderById(id) {
    const query = `
        SELECT 
            so.*,
            e.name as equipment_name,
            e.model as equipment_model,
            emp.name as company_name,
            mt.name as maintenance_type_name,
            u1.name as created_by_name,
            u2.name as assigned_to_name
        FROM service_orders so
        LEFT JOIN equipment e ON so.equipment_id = e.id
        LEFT JOIN empresas emp ON so.company_id = emp.id
        LEFT JOIN maintenance_types mt ON so.maintenance_type_id = mt.id
        LEFT JOIN users u1 ON so.created_by = u1.id
        LEFT JOIN users u2 ON so.assigned_to = u2.id
        WHERE so.id = ?
    `;
    
    const result = await db.query(query, [id]);
    return result[0] || null;
}
```

### 5. FUNÇÃO PARA GERAR NÚMERO DA OS

```javascript
async function generateOrderNumber() {
    const year = new Date().getFullYear();
    const query = `
        SELECT COUNT(*) as count 
        FROM service_orders 
        WHERE YEAR(created_at) = ?
    `;
    
    const result = await db.query(query, [year]);
    const count = result[0].count + 1;
    
    return `OS-${count.toString().padStart(3, '0')}/${year}`;
}
```

### 6. MIDDLEWARE DE VALIDAÇÃO

```javascript
// middleware/validateServiceOrder.js
export function validateServiceOrderMiddleware(req, res, next) {
    const { method } = req;
    
    if (method === 'POST' || method === 'PUT') {
        // Sanitizar entrada
        if (req.body.description) {
            req.body.description = req.body.description.trim();
        }
        
        if (req.body.observations) {
            req.body.observations = req.body.observations.trim();
        }
        
        // Limitar tamanho dos campos
        if (req.body.description && req.body.description.length > 5000) {
            return res.status(400).json({ error: 'Descrição muito longa (máximo 5000 caracteres)' });
        }
        
        if (req.body.observations && req.body.observations.length > 2000) {
            return res.status(400).json({ error: 'Observações muito longas (máximo 2000 caracteres)' });
        }
    }
    
    next();
}
```

### 7. TRATAMENTO DE ERROS ESPECÍFICOS

```javascript
// utils/errorHandler.js
export function handleServiceOrderError(error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return {
            status: 400,
            message: 'Referência inválida: equipamento ou empresa não encontrada'
        };
    }
    
    if (error.code === 'ER_DUP_ENTRY') {
        return {
            status: 409,
            message: 'Número da OS já existe'
        };
    }
    
    if (error.code === 'ER_DATA_TOO_LONG') {
        return {
            status: 400,
            message: 'Dados muito longos para o campo especificado'
        };
    }
    
    return {
        status: 500,
        message: 'Erro interno do servidor'
    };
}
```

### 8. LOGS E AUDITORIA

```javascript
// utils/auditLogger.js
export function logServiceOrderAction(action, orderId, userId, changes = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        action,
        order_id: orderId,
        user_id: userId,
        changes: JSON.stringify(changes),
        ip_address: req.ip || 'unknown'
    };
    
    // Inserir no log de auditoria
    db.query(
        'INSERT INTO audit_log (table_name, action, record_id, user_id, changes, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        ['service_orders', action, orderId, userId, JSON.stringify(changes)]
    );
}
```

### 9. TESTES DE INTEGRAÇÃO

```javascript
// tests/serviceOrders.test.js
describe('Service Orders API', () => {
    test('should create service order with valid data', async () => {
        const orderData = {
            equipmentId: 1,
            description: 'Manutenção preventiva do equipamento',
            priority: 'ALTA',
            dueDate: '31/12/2024',
            estimatedCost: 150.50
        };
        
        const response = await request(app)
            .post('/api/service-orders')
            .send(orderData)
            .expect(201);
            
        expect(response.body.success).toBe(true);
        expect(response.body.data.priority).toBe('ALTA');
    });
    
    test('should reject invalid date format', async () => {
        const orderData = {
            equipmentId: 1,
            description: 'Teste',
            dueDate: '2024-12-31' // Formato inválido
        };
        
        const response = await request(app)
            .post('/api/service-orders')
            .send(orderData)
            .expect(400);
            
        expect(response.body.error).toContain('formato dd/mm/aaaa');
    });
});
```

#### 1.1 Validação de Prioridade
```javascript
// Adicionar no arquivo: app/api/service-orders/route.ts
const VALID_PRIORITIES = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'];

function validatePriority(priority) {
    if (!priority || !VALID_PRIORITIES.includes(priority.toUpperCase())) {
        throw new Error('Prioridade inválida. Valores aceitos: BAIXA, MEDIA, ALTA, CRITICA');
    }
    return priority.toUpperCase();
}
```

#### 1.2 Validação de Status
```javascript
const VALID_STATUSES = ['ABERTA', 'EM_ANDAMENTO', 'AGUARDANDO_APROVACAO', 'APROVADA', 'REJEITADA', 'CONCLUIDA', 'CANCELADA'];

function validateStatus(status) {
    if (!status || !VALID_STATUSES.includes(status.toUpperCase())) {
        throw new Error('Status inválido. Valores aceitos: ' + VALID_STATUSES.join(', '));
    }
    return status.toUpperCase();
}
```

#### 1.3 Validação de Data Brasileira
```javascript
function validateBrazilianDate(dateStr) {
    // Regex para formato dd/mm/aaaa
    const brazilianDateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateStr.match(brazilianDateRegex);
    
    if (!match) {
        throw new Error('Data deve estar no formato dd/mm/aaaa');
    }
    
    const [, day, month, year] = match;
    const date = new Date(year, month - 1, day);
    
    // Verificar se a data é válida
    if (date.getDate() != day || date.getMonth() != (month - 1) || date.getFullYear() != year) {
        throw new Error('Data inválida');
    }
    
    return date.toISOString().split('T')[0]; // Retorna formato YYYY-MM-DD
}
```

#### 1.4 Validação de Custo
```javascript
function validateCost(cost) {
    if (cost !== null && cost !== undefined) {
        const numericCost = parseFloat(cost);
        if (isNaN(numericCost) || numericCost < 0) {
            throw new Error('Custo deve ser um valor numérico positivo ou zero');
        }
        return numericCost;
    }
    return null;
}
```

#### 1.5 Validação de Referências (Foreign Keys)
```javascript
async function validateEquipmentExists(equipmentId) {
    const result = await db.query('SELECT id FROM equipment WHERE id = ?', [equipmentId]);
    if (result.length === 0) {
        throw new Error('Equipamento não encontrado');
    }
}

async function validateCompanyExists(companyId) {
    if (companyId) {
        const result = await db.query('SELECT id FROM empresas WHERE id = ?', [companyId]);
        if (result.length === 0) {
            throw new Error('Empresa não encontrada');
        }
    }
}
```

### 2. AJUSTES NO ENDPOINT POST (Criar OS)

```javascript
// app/api/service-orders/route.ts - Método POST
export async function POST(request) {
    try {
        const body = await request.json();
        
        // Validações obrigatórias
        if (!body.equipmentId) {
            return NextResponse.json({ error: 'Equipamento é obrigatório' }, { status: 400 });
        }
        
        if (!body.description || body.description.trim().length < 10) {
            return NextResponse.json({ error: 'Descrição deve ter pelo menos 10 caracteres' }, { status: 400 });
        }
        
        if (!body.dueDate) {
            return NextResponse.json({ error: 'Data limite é obrigatória' }, { status: 400 });
        }
        
        // Validar e converter dados
        const priority = validatePriority(body.priority || 'MEDIA');
        const status = validateStatus(body.status || 'ABERTA');
        const scheduledDate = validateBrazilianDate(body.dueDate);
        const cost = validateCost(body.estimatedCost);
        
        // Validar referências
        await validateEquipmentExists(body.equipmentId);
        if (body.companyId) {
            await validateCompanyExists(body.companyId);
        }
        
        // Gerar número da OS
        const orderNumber = await generateOrderNumber();
        
        // Inserir no banco
        const query = `
            INSERT INTO service_orders (
                order_number, equipment_id, company_id, description, 
                priority, status, requested_date, scheduled_date, 
                cost, observations, created_by, type, maintenance_type_id
            ) VALUES (?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
            orderNumber,
            body.equipmentId,
            body.companyId || null,
            body.description,
            priority,
            status,
            scheduledDate,
            cost,
            body.observations || null,
            body.createdBy || null,
            body.maintenanceType || null,
            body.maintenanceTypeId || null
        ];
        
        const result = await db.query(query, values);
        
        // Retornar OS criada
        const newOrder = await getServiceOrderById(result.insertId);
        
        return NextResponse.json({
            success: true,
            data: newOrder,
            message: 'Ordem de serviço criada com sucesso'
        }, { status: 201 });
        
    } catch (error) {
        console.error('Erro ao criar OS:', error);
        return NextResponse.json({
            error: error.message || 'Erro interno do servidor'
        }, { status: 500 });
    }
}
```

### 3. AJUSTES NO ENDPOINT PUT (Atualizar OS)

```javascript
// app/api/service-orders/route.ts - Método PUT
export async function PUT(request) {
    try {
        const body = await request.json();
        const { id } = body;
        
        if (!id) {
            return NextResponse.json({ error: 'ID da OS é obrigatório' }, { status: 400 });
        }
        
        // Verificar se OS existe
        const existingOrder = await getServiceOrderById(id);
        if (!existingOrder) {
            return NextResponse.json({ error: 'Ordem de serviço não encontrada' }, { status: 404 });
        }
        
        // Construir query dinâmica
        const updates = [];
        const values = [];
        
        if (body.equipmentId !== undefined) {
            await validateEquipmentExists(body.equipmentId);
            updates.push('equipment_id = ?');
            values.push(body.equipmentId);
        }
        
        if (body.companyId !== undefined) {
            if (body.companyId) {
                await validateCompanyExists(body.companyId);
            }
            updates.push('company_id = ?');
            values.push(body.companyId);
        }
        
        if (body.description !== undefined) {
            if (!body.description || body.description.trim().length < 10) {
                return NextResponse.json({ error: 'Descrição deve ter pelo menos 10 caracteres' }, { status: 400 });
            }
            updates.push('description = ?');
            values.push(body.description);
        }
        
        if (body.priority !== undefined) {
            const priority = validatePriority(body.priority);
            updates.push('priority = ?');
            values.push(priority);
        }
        
        if (body.status !== undefined) {
            const status = validateStatus(body.status);
            updates.push('status = ?');
            values.push(status);
        }
        
        if (body.dueDate !== undefined) {
            const scheduledDate = validateBrazilianDate(body.dueDate);
            updates.push('scheduled_date = ?');
            values.push(scheduledDate);
        }
        
        if (body.estimatedCost !== undefined) {
            const cost = validateCost(body.estimatedCost);
            updates.push('cost = ?');
            values.push(cost);
        }
        
        if (body.observations !== undefined) {
            updates.push('observations = ?');
            values.push(body.observations);
        }
        
        if (updates.length === 0) {
            return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 });
        }
        
        // Adicionar updated_at
        updates.push('updated_at = NOW()');
        values.push(id);
        
        const query = `UPDATE service_orders SET ${updates.join(', ')} WHERE id = ?`;
        await db.query(query, values);
        
        // Retornar OS atualizada
        const updatedOrder = await getServiceOrderById(id);
        
        return NextResponse.json({
            success: true,
            data: updatedOrder,
            message: 'Ordem de serviço atualizada com sucesso'
        });
        
    } catch (error) {
        console.error('Erro ao atualizar OS:', error);
        return NextResponse.json({
            error: error.message || 'Erro interno do servidor'
        }, { status: 500 });
    }
}
```

### 4. FUNÇÃO AUXILIAR PARA BUSCAR OS

```javascript
async function getServiceOrderById(id) {
    const query = `
        SELECT 
            so.*,
            e.name as equipment_name,
            e.model as equipment_model,
            emp.name as company_name,
            mt.name as maintenance_type_name,
            u1.name as created_by_name,
            u2.name as assigned_to_name
        FROM service_orders so
        LEFT JOIN equipment e ON so.equipment_id = e.id
        LEFT JOIN empresas emp ON so.company_id = emp.id
        LEFT JOIN maintenance_types mt ON so.maintenance_type_id = mt.id
        LEFT JOIN users u1 ON so.created_by = u1.id
        LEFT JOIN users u2 ON so.assigned_to = u2.id
        WHERE so.id = ?
    `;
    
    const result = await db.query(query, [id]);
    return result[0] || null;
}
```

### 5. FUNÇÃO PARA GERAR NÚMERO DA OS

```javascript
async function generateOrderNumber() {
    const year = new Date().getFullYear();
    const query = `
        SELECT COUNT(*) as count 
        FROM service_orders 
        WHERE YEAR(created_at) = ?
    `;
    
    const result = await db.query(query, [year]);
    const count = result[0].count + 1;
    
    return `OS-${count.toString().padStart(3, '0')}/${year}`;
}
```

### 6. MIDDLEWARE DE VALIDAÇÃO

```javascript
// middleware/validateServiceOrder.js
export function validateServiceOrderMiddleware(req, res, next) {
    const { method } = req;
    
    if (method === 'POST' || method === 'PUT') {
        // Sanitizar entrada
        if (req.body.description) {
            req.body.description = req.body.description.trim();
        }
        
        if (req.body.observations) {
            req.body.observations = req.body.observations.trim();
        }
        
        // Limitar tamanho dos campos
        if (req.body.description && req.body.description.length > 5000) {
            return res.status(400).json({ error: 'Descrição muito longa (máximo 5000 caracteres)' });
        }
        
        if (req.body.observations && req.body.observations.length > 2000) {
            return res.status(400).json({ error: 'Observações muito longas (máximo 2000 caracteres)' });
        }
    }
    
    next();
}
```

### 7. TRATAMENTO DE ERROS ESPECÍFICOS

```javascript
// utils/errorHandler.js
export function handleServiceOrderError(error) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return {
            status: 400,
            message: 'Referência inválida: equipamento ou empresa não encontrada'
        };
    }
    
    if (error.code === 'ER_DUP_ENTRY') {
        return {
            status: 409,
            message: 'Número da OS já existe'
        };
    }
    
    if (error.code === 'ER_DATA_TOO_LONG') {
        return {
            status: 400,
            message: 'Dados muito longos para o campo especificado'
        };
    }
    
    return {
        status: 500,
        message: 'Erro interno do servidor'
    };
}
```

### 8. LOGS E AUDITORIA

```javascript
// utils/auditLogger.js
export function logServiceOrderAction(action, orderId, userId, changes = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        action,
        order_id: orderId,
        user_id: userId,
        changes: JSON.stringify(changes),
        ip_address: req.ip || 'unknown'
    };
    
    // Inserir no log de auditoria
    db.query(
        'INSERT INTO audit_log (table_name, action, record_id, user_id, changes, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        ['service_orders', action, orderId, userId, JSON.stringify(changes)]
    );
}
```

### 9. TESTES DE INTEGRAÇÃO

```javascript
// tests/serviceOrders.test.js
describe('Service Orders API', () => {
    test('should create service order with valid data', async () => {
        const orderData = {
            equipmentId: 1,
            description: 'Manutenção preventiva do equipamento',
            priority: 'ALTA',
            dueDate: '31/12/2024',
            estimatedCost: 150.50
        };
        
        const response = await request(app)
            .post('/api/service-orders')
            .send(orderData)
            .expect(201);
            
        expect(response.body.success).toBe(true);
        expect(response.body.data.priority).toBe('ALTA');
    });
    
    test('should reject invalid date format', async () => {
        const orderData = {
            equipmentId: 1,
            description: 'Teste',
            dueDate: '2024-12-31' // Formato inválido
        };
        
        const response = await request(app)
            .post('/api/service-orders')
            .send(orderData)
            .expect(400);
            
        expect(response.body.error).toContain('formato dd/mm/aaaa');
    });
});
```