# TEST PLAN AUTOMATIZÁVEL - AUDITORIA GERAL API

## 📊 RESUMO EXECUTIVO

**Data:** 2025-01-27  
**Sistema:** Sistema de Manutenção  
**Framework:** Jest/Newman/k6  
**Cobertura:** APIs REST, Validações, Autenticação, Performance  
**Objetivo:** Automatizar testes para garantir qualidade contínua

---

## 🧪 ESTRUTURA DE TESTES

### 1. TESTES DE SMOKE (Disponibilidade)
**Objetivo:** Verificar se todas as APIs estão respondendo

```javascript
// tests/smoke/api-availability.test.js
const request = require('supertest');
const app = require('../../app');

describe('API Smoke Tests', () => {
  const endpoints = [
    { method: 'GET', path: '/api/health', expectedStatus: 200 },
    { method: 'GET', path: '/api/categories', expectedStatus: 200 },
    { method: 'GET', path: '/api/sectors', expectedStatus: 200 },
    { method: 'GET', path: '/api/subsectors', expectedStatus: 200 },
    { method: 'GET', path: '/api/equipment', expectedStatus: 200 },
    { method: 'GET', path: '/api/companies', expectedStatus: 200 },
    { method: 'GET', path: '/api/service-orders', expectedStatus: 200 },
    { method: 'GET', path: '/api/users', expectedStatus: 200 },
    { method: 'GET', path: '/api/dashboard/stats', expectedStatus: 200 }
  ];

  endpoints.forEach(({ method, path, expectedStatus }) => {
    test(`${method} ${path} should return ${expectedStatus}`, async () => {
      const response = await request(app)
        [method.toLowerCase()](path)
        .set('Authorization', `Bearer ${process.env.TEST_TOKEN}`);
      
      expect(response.status).toBe(expectedStatus);
    });
  });
});
```

### 2. TESTES DE VALIDAÇÃO (422)
**Objetivo:** Verificar validações de entrada

```javascript
// tests/validation/post-validations.test.js
describe('POST Validation Tests', () => {
  describe('Companies API', () => {
    test('should return 422 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${process.env.TEST_TOKEN}`)
        .send({});
      
      expect(response.status).toBe(422);
      expect(response.body.error).toContain('Dados inválidos');
    });

    test('should return 422 for invalid CNPJ', async () => {
      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${process.env.TEST_TOKEN}`)
        .send({
          nome: 'Empresa Teste',
          cnpj: '12345678000190' // CNPJ inválido
        });
      
      expect(response.status).toBe(422);
      expect(response.body.details).toContain('CNPJ inválido');
    });

    test('should return 201 for valid data', async () => {
      const validCompany = {
        nome: 'Empresa Teste LTDA',
        cnpj: '11.222.333/0001-81',
        email: 'contato@empresa.com',
        telefone: '(11) 99999-9999'
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${process.env.TEST_TOKEN}`)
        .send(validCompany);
      
      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.nome).toBe(validCompany.nome);
    });
  });

  describe('Service Orders API', () => {
    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/service-orders')
        .set('Authorization', `Bearer ${process.env.TEST_TOKEN}`)
        .send({
          titulo: '' // Campo obrigatório vazio
        });
      
      expect(response.status).toBe(422);
    });

    test('should validate date format', async () => {
      const response = await request(app)
        .post('/api/service-orders')
        .set('Authorization', `Bearer ${process.env.TEST_TOKEN}`)
        .send({
          titulo: 'OS Teste',
          data_prevista: '32/01/2024' // Data inválida
        });
      
      expect(response.status).toBe(422);
      expect(response.body.details).toContain('Data inválida');
    });
  });

  describe('Users API', () => {
    test('should validate email format', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${process.env.TEST_TOKEN}`)
        .send({
          nome: 'Usuário Teste',
          email: 'email-invalido' // Email inválido
        });
      
      expect(response.status).toBe(422);
    });
  });
});
```

### 3. TESTES DE CONFLITO (409)
**Objetivo:** Verificar constraints de unicidade

```javascript
// tests/conflict/uniqueness.test.js
describe('Uniqueness Constraint Tests', () => {
  test('should return 409 for duplicate CNPJ', async () => {
    const companyData = {
      nome: 'Empresa Duplicada',
      cnpj: '11.222.333/0001-81'
    };

    // Primeira criação
    await request(app)
      .post('/api/companies')
      .set('Authorization', `Bearer ${process.env.TEST_TOKEN}`)
      .send(companyData);

    // Segunda criação (deve falhar)
    const response = await request(app)
      .post('/api/companies')
      .set('Authorization', `Bearer ${process.env.TEST_TOKEN}`)
      .send(companyData);
    
    expect(response.status).toBe(409);
    expect(response.body.error).toContain('CNPJ já cadastrado');
  });

  test('should return 409 for duplicate company name', async () => {
    const companyData = {
      nome: 'Empresa Única LTDA',
      cnpj: '22.333.444/0001-92'
    };

    // Primeira criação
    await request(app)
      .post('/api/companies')
      .set('Authorization', `Bearer ${process.env.TEST_TOKEN}`)
      .send(companyData);

    // Segunda criação com mesmo nome
    const duplicateData = {
      ...companyData,
      cnpj: '33.444.555/0001-03'
    };

    const response = await request(app)
      .post('/api/companies')
      .set('Authorization', `Bearer ${process.env.TEST_TOKEN}`)
      .send(duplicateData);
    
    expect(response.status).toBe(409);
  });
});
```

### 4. TESTES DE AUTENTICAÇÃO (401/403)
**Objetivo:** Verificar segurança e autorização

```javascript
// tests/auth/authentication.test.js
describe('Authentication Tests', () => {
  test('should return 401 for missing token', async () => {
    const response = await request(app)
      .get('/api/users');
    
    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Token de acesso requerido');
  });

  test('should return 401 for invalid token', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer invalid-token');
    
    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Token inválido');
  });

  test('should return 403 for insufficient permissions', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${process.env.TEST_USER_TOKEN}`) // Token sem permissão admin
      .send({
        nome: 'Novo Usuário',
        email: 'novo@email.com'
      });
    
    expect(response.status).toBe(403);
  });

  test('should return 200 for valid admin token', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${process.env.TEST_ADMIN_TOKEN}`);
    
    expect(response.status).toBe(200);
  });
});
```

### 5. TESTES DE RATE LIMITING (429)
**Objetivo:** Verificar proteção contra abuso

```javascript
// tests/rate-limit/rate-limiting.test.js
describe('Rate Limiting Tests', () => {
  test('should return 429 after exceeding rate limit', async () => {
    const promises = [];
    
    // Fazer 101 requisições simultâneas
    for (let i = 0; i < 101; i++) {
      promises.push(
        request(app)
          .get('/api/health')
          .set('X-Forwarded-For', '192.168.1.100') // IP fixo para teste
      );
    }

    const responses = await Promise.all(promises);
    const rateLimitedResponses = responses.filter(r => r.status === 429);
    
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });

  test('should reset rate limit after time window', async () => {
    // Exceder limite
    for (let i = 0; i < 101; i++) {
      await request(app).get('/api/health');
    }

    // Aguardar reset (1 minuto)
    await new Promise(resolve => setTimeout(resolve, 61000));

    // Deve funcionar novamente
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
  }, 70000);
});
```

### 6. TESTES DE NOT FOUND (404)
**Objetivo:** Verificar tratamento de recursos inexistentes

```javascript
// tests/not-found/resource-not-found.test.js
describe('Not Found Tests', () => {
  test('should return 404 for non-existent company', async () => {
    const response = await request(app)
      .get('/api/companies/99999')
      .set('Authorization', `Bearer ${process.env.TEST_TOKEN}`);
    
    expect(response.status).toBe(404);
    expect(response.body.error).toContain('Empresa não encontrada');
  });

  test('should return 404 for non-existent equipment', async () => {
    const response = await request(app)
      .get('/api/equipment/99999')
      .set('Authorization', `Bearer ${process.env.TEST_TOKEN}`);
    
    expect(response.status).toBe(404);
  });

  test('should return 404 for invalid API endpoint', async () => {
    const response = await request(app)
      .get('/api/non-existent-endpoint')
      .set('Authorization', `Bearer ${process.env.TEST_TOKEN}`);
    
    expect(response.status).toBe(404);
  });
});
```

---

## 🚀 TESTES DE PERFORMANCE (k6)

### Script k6 para Load Testing
```javascript
// tests/performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% das requisições < 500ms
    http_req_failed: ['rate<0.1'],    // Taxa de erro < 10%
  },
};

const BASE_URL = 'http://localhost:3000';
const TOKEN = __ENV.TEST_TOKEN;

export default function () {
  const headers = {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  };

  // Teste GET /api/companies
  let response = http.get(`${BASE_URL}/api/companies`, { headers });
  check(response, {
    'GET companies status is 200': (r) => r.status === 200,
    'GET companies response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Teste GET /api/equipment
  response = http.get(`${BASE_URL}/api/equipment`, { headers });
  check(response, {
    'GET equipment status is 200': (r) => r.status === 200,
    'GET equipment response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(1);

  // Teste POST /api/companies
  const companyData = {
    nome: `Empresa Teste ${Math.random()}`,
    cnpj: generateRandomCNPJ(),
    email: `teste${Math.random()}@empresa.com`
  };

  response = http.post(`${BASE_URL}/api/companies`, JSON.stringify(companyData), { headers });
  check(response, {
    'POST companies status is 201': (r) => r.status === 201,
    'POST companies response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(1);
}

function generateRandomCNPJ() {
  // Gerar CNPJ válido aleatório
  const digits = Array.from({length: 12}, () => Math.floor(Math.random() * 10));
  
  // Calcular dígitos verificadores
  let sum = 0;
  let weight = 2;
  for (let i = 11; i >= 0; i--) {
    sum += digits[i] * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  const digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  
  sum = 0;
  weight = 2;
  for (let i = 11; i >= 0; i--) {
    sum += digits[i] * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  sum += digit1 * 2;
  const digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  
  return `${digits.slice(0,2).join('')}.${digits.slice(2,5).join('')}.${digits.slice(5,8).join('')}/${digits.slice(8,12).join('')}-${digit1}${digit2}`;
}
```

---

## 📋 TESTES DE INTEGRAÇÃO COM BANCO

### Testes de Integridade de Dados
```javascript
// tests/database/data-integrity.test.js
const db = require('../../lib/database');

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database
    await db.query('START TRANSACTION');
  });

  afterAll(async () => {
    // Cleanup
    await db.query('ROLLBACK');
  });

  test('should maintain referential integrity', async () => {
    // Criar setor
    const [sectorResult] = await db.query(
      'INSERT INTO sectors (nome) VALUES (?)',
      ['Setor Teste']
    );
    const sectorId = sectorResult.insertId;

    // Criar equipamento vinculado ao setor
    const [equipmentResult] = await db.query(
      'INSERT INTO equipment (name, sector_id) VALUES (?, ?)',
      ['Equipamento Teste', sectorId]
    );

    // Tentar deletar setor (deve falhar por FK)
    await expect(
      db.query('DELETE FROM sectors WHERE id = ?', [sectorId])
    ).rejects.toThrow();
  });

  test('should enforce unique constraints', async () => {
    const cnpj = '11.222.333/0001-81';
    
    // Primeira inserção
    await db.query(
      'INSERT INTO companies (nome, cnpj) VALUES (?, ?)',
      ['Empresa 1', cnpj]
    );

    // Segunda inserção com mesmo CNPJ (deve falhar)
    await expect(
      db.query(
        'INSERT INTO companies (nome, cnpj) VALUES (?, ?)',
        ['Empresa 2', cnpj]
      )
    ).rejects.toThrow();
  });

  test('should validate CNPJ format in database', async () => {
    // Inserir CNPJ inválido (deve falhar se trigger estiver implementado)
    await expect(
      db.query(
        'INSERT INTO companies (nome, cnpj) VALUES (?, ?)',
        ['Empresa Teste', '12345678000190']
      )
    ).rejects.toThrow();
  });
});
```

---

## 🔧 CONFIGURAÇÃO DE AMBIENTE DE TESTE

### package.json - Scripts de Teste
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:smoke": "jest tests/smoke",
    "test:validation": "jest tests/validation",
    "test:auth": "jest tests/auth",
    "test:performance": "k6 run tests/performance/load-test.js",
    "test:all": "npm run test && npm run test:performance"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "supertest": "^6.3.0",
    "@types/jest": "^29.0.0"
  }
}
```

### jest.config.js
```javascript
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'app/api/**/*.js',
    'lib/**/*.js',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### tests/setup.js
```javascript
const db = require('../lib/database');

// Setup global test environment
beforeAll(async () => {
  // Configurar banco de teste
  process.env.NODE_ENV = 'test';
  process.env.DB_NAME = 'hospital_maintenance_test';
  
  // Gerar tokens de teste
  process.env.TEST_TOKEN = 'valid-test-token';
  process.env.TEST_ADMIN_TOKEN = 'valid-admin-token';
  process.env.TEST_USER_TOKEN = 'valid-user-token';
});

afterAll(async () => {
  // Limpar conexões
  await db.end();
});
```

---

## 📊 NEWMAN/POSTMAN COLLECTION

### Coleção Postman para Testes Automatizados
```json
{
  "info": {
    "name": "Sistema Manutenção - API Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000"
    },
    {
      "key": "authToken",
      "value": "{{token}}"
    }
  ],
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"admin@test.com\",\n  \"password\": \"123456\"\n}"
            },
            "url": "{{baseUrl}}/api/auth/login"
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Login successful', function () {",
                  "    pm.response.to.have.status(200);",
                  "    const response = pm.response.json();",
                  "    pm.expect(response.token).to.exist;",
                  "    pm.collectionVariables.set('token', response.token);",
                  "});"
                ]
              }
            }
          ]
        }
      ]
    },
    {
      "name": "Companies CRUD",
      "item": [
        {
          "name": "Create Company",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"nome\": \"Empresa Teste LTDA\",\n  \"cnpj\": \"11.222.333/0001-81\",\n  \"email\": \"contato@empresa.com\"\n}"
            },
            "url": "{{baseUrl}}/api/companies"
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Company created successfully', function () {",
                  "    pm.response.to.have.status(201);",
                  "    const response = pm.response.json();",
                  "    pm.expect(response.id).to.exist;",
                  "    pm.collectionVariables.set('companyId', response.id);",
                  "});"
                ]
              }
            }
          ]
        },
        {
          "name": "Get Companies",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "url": "{{baseUrl}}/api/companies"
          },
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Companies retrieved successfully', function () {",
                  "    pm.response.to.have.status(200);",
                  "    const response = pm.response.json();",
                  "    pm.expect(response).to.be.an('array');",
                  "});"
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 🎯 EXECUÇÃO DOS TESTES

### Comandos para Execução
```bash
# Testes unitários e integração
npm test

# Testes com cobertura
npm run test:coverage

# Testes de smoke
npm run test:smoke

# Testes de performance
npm run test:performance

# Newman (Postman)
newman run postman-collection.json -e environment.json

# k6 com relatório
k6 run --out json=results.json tests/performance/load-test.js
```

### Pipeline CI/CD (GitHub Actions)
```yaml
# .github/workflows/test.yml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mariadb:
        image: mariadb:10.6
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: hospital_maintenance_test
        ports:
          - 3306:3306
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:coverage
        env:
          DB_HOST: localhost
          DB_USER: root
          DB_PASSWORD: root
          DB_NAME: hospital_maintenance_test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

---

## ✅ CRITÉRIOS DE ACEITE

### Cobertura Mínima:
- **Linhas:** 80%
- **Funções:** 80%
- **Branches:** 75%
- **Statements:** 80%

### Performance:
- **P95 < 500ms** para GETs
- **P95 < 1000ms** para POSTs
- **Taxa de erro < 1%**

### Funcionalidade:
- **100% dos endpoints** testados
- **Todos os status codes** validados
- **Validações** funcionando
- **Autenticação** segura

---

*Test Plan gerado pela Auditoria Geral de APIs - 2025-01-27*