# PLANO DE CORREÇÃO - AUDITORIA GERAL API

## 📊 RESUMO EXECUTIVO

**Data:** 2025-01-27  
**Sistema:** Sistema de Manutenção  
**Escopo:** Correções para APIs, Banco MariaDB, Configurações e Logs  
**Prioridade:** 8 correções críticas, 9 médias, 6 baixas  
**Tempo Estimado:** 4-6 semanas

---

## 🚨 CORREÇÕES CRÍTICAS (Prioridade 1 - 48h)

### C001 - Corrigir Validações POST em APIs
**Problema:** APIs POST retornando 400 em vez de 201  
**Rotas Afetadas:** `/api/companies`, `/api/service-orders`, `/api/users`

**Solução API:**
```javascript
// Exemplo para /api/companies/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validação de schema
    const schema = {
      nome: { required: true, type: 'string', minLength: 2, maxLength: 100 },
      cnpj: { required: true, type: 'string', pattern: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/ },
      email: { required: false, type: 'email' },
      telefone: { required: false, type: 'string', pattern: /^\(\d{2}\)\s\d{4,5}-\d{4}$/ }
    };
    
    const validation = validateSchema(body, schema);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.errors },
        { status: 422 }
      );
    }
    
    // Verificar CNPJ único
    const existingCompany = await db.query(
      'SELECT id FROM companies WHERE cnpj = ?',
      [body.cnpj]
    );
    
    if (existingCompany.length > 0) {
      return NextResponse.json(
        { error: 'CNPJ já cadastrado' },
        { status: 409 }
      );
    }
    
    // Inserir no banco
    const result = await db.query(
      'INSERT INTO companies (nome, cnpj, email, telefone, ativo, criado_em) VALUES (?, ?, ?, ?, 1, NOW())',
      [body.nome, body.cnpj, body.email, body.telefone]
    );
    
    return NextResponse.json(
      { id: result.insertId, ...body, ativo: true },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
```

**Teste cURL:**
```bash
# Antes (falha)
curl -X POST http://localhost:3000/api/companies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"nome":"Empresa Teste"}'

# Depois (sucesso)
curl -X POST http://localhost:3000/api/companies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "nome": "Empresa Teste LTDA",
    "cnpj": "12.345.678/0001-90",
    "email": "contato@empresa.com",
    "telefone": "(11) 99999-9999"
  }'
```

### C002 - Resolver Problemas de Autenticação
**Problema:** Rotas protegidas retornando 401 inesperadamente  
**Rotas Afetadas:** `/api/notifications`, `/api/reports/stats`

**Solução Middleware:**
```javascript
// middleware.ts - Correção
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Rotas públicas
  const publicPaths = [
    '/api/health',
    '/api/auth/login',
    '/login',
    '/_next',
    '/favicon.ico'
  ];
  
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Verificar token para rotas protegidas
  if (pathname.startsWith('/api/')) {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token de acesso requerido' },
        { status: 401 }
      );
    }
    
    try {
      const decoded = await verifyToken(token);
      
      // Adicionar dados do usuário ao header para as rotas
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', decoded.userId);
      requestHeaders.set('x-user-role', decoded.role);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
      
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### C003 - Criar Tabelas Faltantes no Banco
**Problema:** Tabelas referenciadas no código não existem no banco

**DDL para Correção:**
```sql
-- Criar tabela subsector (referenciada mas não existe)
CREATE TABLE IF NOT EXISTS subsector (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  setor_id INT NOT NULL,
  ativo BOOLEAN DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_setor_id (setor_id),
  INDEX idx_ativo (ativo),
  FOREIGN KEY (setor_id) REFERENCES sectors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela especialidades
CREATE TABLE IF NOT EXISTS especialidades (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN DEFAULT 1,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_nome (nome),
  INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar tabela empresa_especialidade (relacionamento N:N)
CREATE TABLE IF NOT EXISTS empresa_especialidade (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  especialidade_id INT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_empresa_especialidade (empresa_id, especialidade_id),
  FOREIGN KEY (empresa_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (especialidade_id) REFERENCES especialidades(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### C004 - Implementar Constraints de Unicidade
**Problema:** Falta de UNIQUE constraints para CNPJ e nome

**DDL para Constraints:**
```sql
-- Adicionar constraints de unicidade
ALTER TABLE companies 
ADD CONSTRAINT unique_cnpj UNIQUE (cnpj),
ADD CONSTRAINT unique_nome UNIQUE (nome);

-- Adicionar constraint para email (se aplicável)
ALTER TABLE companies 
ADD CONSTRAINT unique_email UNIQUE (email);

-- Verificar dados duplicados antes de aplicar
SELECT cnpj, COUNT(*) as count 
FROM companies 
GROUP BY cnpj 
HAVING count > 1;

-- Limpar duplicatas se necessário
DELETE c1 FROM companies c1
INNER JOIN companies c2 
WHERE c1.id > c2.id AND c1.cnpj = c2.cnpj;
```

---

## ⚠️ CORREÇÕES IMPORTANTES (Prioridade 2 - 1 semana)

### C005 - Implementar Validações CNPJ/CPF
**Solução:**
```javascript
// lib/validators.js
export function validateCNPJ(cnpj) {
  cnpj = cnpj.replace(/[^\d]/g, '');
  
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;
  
  // Algoritmo de validação CNPJ
  let sum = 0;
  let weight = 2;
  
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cnpj.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  
  let digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(cnpj.charAt(12)) !== digit1) return false;
  
  sum = 0;
  weight = 2;
  
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cnpj.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  
  let digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return parseInt(cnpj.charAt(13)) === digit2;
}

export function validateCPF(cpf) {
  cpf = cpf.replace(/[^\d]/g, '');
  
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  // Algoritmo de validação CPF
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  
  let digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(cpf.charAt(9)) !== digit1) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  
  let digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return parseInt(cpf.charAt(10)) === digit2;
}
```

### C006 - Criar Índices de Performance
**DDL para Índices:**
```sql
-- Índices para tabela companies
CREATE INDEX idx_companies_cnpj ON companies(cnpj);
CREATE INDEX idx_companies_nome ON companies(nome);
CREATE INDEX idx_companies_ativo ON companies(ativo);
CREATE INDEX idx_companies_created ON companies(criado_em);

-- Índices para tabela service_orders
CREATE INDEX idx_service_orders_status ON service_orders(status);
CREATE INDEX idx_service_orders_priority ON service_orders(prioridade);
CREATE INDEX idx_service_orders_created ON service_orders(criado_em);
CREATE INDEX idx_service_orders_company ON service_orders(empresa_id);

-- Índices para tabela equipment
CREATE INDEX idx_equipment_sector ON equipment(setor_id);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_model ON equipment(modelo);

-- Índices compostos para consultas frequentes
CREATE INDEX idx_service_orders_status_created ON service_orders(status, criado_em);
CREATE INDEX idx_equipment_sector_status ON equipment(setor_id, status);
```

### C007 - Padronizar Tratamento de Erros
**Solução:**
```javascript
// lib/errorHandler.js
export class APIError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'APIError';
  }
}

export function handleAPIError(error, request) {
  const correlationId = request.headers.get('x-correlation-id') || generateId();
  
  console.error(`[${correlationId}] API Error:`, {
    message: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
    timestamp: new Date().toISOString()
  });
  
  if (error instanceof APIError) {
    return NextResponse.json({
      error: {
        message: error.message,
        code: error.code,
        correlationId
      }
    }, { status: error.statusCode });
  }
  
  // Erro não tratado
  return NextResponse.json({
    error: {
      message: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR',
      correlationId
    }
  }, { status: 500 });
}

// Wrapper para rotas
export function withErrorHandler(handler) {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleAPIError(error, request);
    }
  };
}
```

---

## 📊 CORREÇÕES DE CONFIGURAÇÃO E INFRAESTRUTURA

### C008 - Configurar Pool de Conexões MariaDB
**Arquivo:** `lib/database.js`
```javascript
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: 'utf8mb4',
  timezone: '+00:00' // UTC
});

export default pool;
```

### C009 - Configurar CORS Adequadamente
**Arquivo:** `next.config.mjs`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: process.env.ALLOWED_ORIGINS || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization,X-Correlation-ID' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ];
  },
  // ... resto da configuração
};
```

### C010 - Implementar Rate Limiting
**Solução:**
```javascript
// lib/rateLimit.js
import { LRUCache } from 'lru-cache';

const rateLimit = new LRUCache({
  max: 500,
  ttl: 60000, // 1 minuto
});

export function rateLimiter(limit = 100) {
  return (request) => {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const key = `rate_limit_${ip}`;
    const current = rateLimit.get(key) || 0;
    
    if (current >= limit) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
        { status: 429 }
      );
    }
    
    rateLimit.set(key, current + 1);
    return null; // Permitir requisição
  };
}
```

---

## 📝 CORREÇÕES DE LOGS E OBSERVABILIDADE

### C011 - Implementar Logs Estruturados
**Solução:**
```javascript
// lib/logger.js
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'maintenance-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;

// Middleware de logging
export function logRequest(request) {
  const correlationId = request.headers.get('x-correlation-id') || generateId();
  
  logger.info('API Request', {
    correlationId,
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    ip: request.headers.get('x-forwarded-for'),
    timestamp: new Date().toISOString()
  });
  
  return correlationId;
}
```

---

## 🧪 EXEMPLOS DE TESTE APÓS CORREÇÕES

### Teste de Validação CNPJ:
```bash
# Teste com CNPJ inválido
curl -X POST http://localhost:3000/api/companies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"nome":"Teste","cnpj":"12345678000190"}'

# Resposta esperada: 422
{
  "error": "Dados inválidos",
  "details": ["CNPJ inválido"]
}
```

### Teste de Rate Limiting:
```bash
# Fazer 101 requisições rapidamente
for i in {1..101}; do
  curl -X GET http://localhost:3000/api/health
done

# A partir da 101ª: 429 Too Many Requests
```

---

## 📅 CRONOGRAMA DE IMPLEMENTAÇÃO

### Semana 1 (Crítico):
- [ ] C001: Corrigir validações POST
- [ ] C002: Resolver autenticação
- [ ] C003: Criar tabelas faltantes
- [ ] C004: Implementar constraints

### Semana 2 (Importante):
- [ ] C005: Validações CNPJ/CPF
- [ ] C006: Criar índices
- [ ] C007: Padronizar erros
- [ ] C008: Pool de conexões

### Semana 3 (Configuração):
- [ ] C009: Configurar CORS
- [ ] C010: Rate limiting
- [ ] C011: Logs estruturados

### Semana 4 (Testes e Validação):
- [ ] Testes de regressão
- [ ] Validação em staging
- [ ] Deploy em produção

---

## ✅ CRITÉRIOS DE ACEITE

1. **APIs POST retornando 201** para dados válidos
2. **Autenticação funcionando** em todas as rotas protegidas
3. **Validações CNPJ/CPF** implementadas e testadas
4. **Constraints de unicidade** aplicadas no banco
5. **Índices criados** e performance melhorada
6. **Logs estruturados** com correlation ID
7. **Rate limiting** funcionando
8. **Cobertura de testes** > 80%

---

*Plano de Correção gerado pela Auditoria Geral de APIs - 2025-01-27*