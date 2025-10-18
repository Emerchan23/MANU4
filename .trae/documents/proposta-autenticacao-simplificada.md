# Proposta de Sistema de Autenticação Simplificado

## 1. Problemas Identificados no Sistema Atual

### 1.1 Complexidade Excessiva
- **Múltiplos arquivos de autenticação**: `lib/auth.js`, `lib/auth-client.ts`, `lib/auth.ts`
- **Diferentes formas de armazenar tokens**: localStorage, cookies, variáveis de estado
- **Middleware complexo**: Next.js middleware + Express middleware
- **Dependências pesadas**: bcrypt, jsonwebtoken
- **Problemas de sincronização**: Frontend e backend desalinhados

### 1.2 Erros Frequentes
- "Access token not found" ao criar usuários
- "ReferenceError: require is not defined" no frontend
- Tokens perdidos durante navegação
- Problemas de hidratação do React

## 2. Proposta de Solução Simplificada

### 2.1 Arquitetura Proposta
```
Frontend (Next.js) ←→ Backend (Express) ←→ Database (SQLite)
       ↑                    ↑
   Cookies httpOnly    Sessões em memória
```

### 2.2 Características da Nova Solução

#### **Autenticação por Sessão Simples**
- Substituir JWT por sessões baseadas em cookies httpOnly
- Armazenamento de sessão em memória (ou Redis para produção)
- Expiração automática de sessões

#### **Sistema Unificado**
- **Um único arquivo**: `lib/simple-auth.js`
- **Uma única forma de autenticação**: cookies httpOnly
- **Middleware único**: Express session middleware

#### **Dependências Mínimas**
- Remover: `bcrypt`, `jsonwebtoken`
- Adicionar: `express-session`, `crypto` (nativo do Node.js)
- Usar hash simples com `crypto.createHash()` para senhas

## 3. Implementação da Nova Solução

### 3.1 Estrutura de Arquivos
```
lib/
  └── simple-auth.js          # Sistema de autenticação unificado
api/
  └── auth.js                 # Endpoints de login/logout
middleware/
  └── session.js              # Middleware de sessão
```

### 3.2 Fluxo de Autenticação

1. **Login**:
   - Usuário envia credenciais
   - Servidor valida e cria sessão
   - Cookie httpOnly é enviado ao cliente

2. **Verificação**:
   - Middleware verifica cookie em cada requisição
   - Sessão válida = usuário autenticado

3. **Logout**:
   - Destruir sessão no servidor
   - Limpar cookie no cliente

### 3.3 Código Base da Implementação

#### `lib/simple-auth.js`
```javascript
const crypto = require('crypto');

class SimpleAuth {
  constructor() {
    this.sessions = new Map(); // Em produção, usar Redis
  }

  // Hash simples para senhas
  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  // Criar sessão
  createSession(userId) {
    const sessionId = crypto.randomUUID();
    this.sessions.set(sessionId, {
      userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
    });
    return sessionId;
  }

  // Verificar sessão
  verifySession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session || session.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      return null;
    }
    return session;
  }

  // Destruir sessão
  destroySession(sessionId) {
    this.sessions.delete(sessionId);
  }
}

module.exports = new SimpleAuth();
```

#### Middleware de Sessão
```javascript
const simpleAuth = require('../lib/simple-auth');

function sessionMiddleware(req, res, next) {
  const sessionId = req.cookies.sessionId;
  
  if (sessionId) {
    const session = simpleAuth.verifySession(sessionId);
    if (session) {
      req.user = { id: session.userId };
    }
  }
  
  next();
}

module.exports = sessionMiddleware;
```

## 4. Vantagens da Solução Simplificada

### 4.1 Benefícios Técnicos
- **Menos código**: 80% menos linhas de código
- **Menos dependências**: Apenas 1 nova dependência vs 3 atuais
- **Mais seguro**: Cookies httpOnly não acessíveis via JavaScript
- **Mais simples**: Um único ponto de autenticação

### 4.2 Benefícios de Manutenção
- **Debugging mais fácil**: Menos pontos de falha
- **Configuração simples**: Sem configuração de JWT
- **Menos bugs**: Sistema mais previsível
- **Desenvolvimento mais rápido**: Menos complexidade

## 5. Plano de Migração

### 5.1 Fase 1: Preparação (1 dia)
- Backup do sistema atual
- Instalar `express-session`
- Criar `lib/simple-auth.js`

### 5.2 Fase 2: Implementação Backend (1 dia)
- Substituir endpoints de autenticação
- Implementar middleware de sessão
- Testar APIs

### 5.3 Fase 3: Atualização Frontend (1 dia)
- Remover código de JWT do frontend
- Atualizar hooks de autenticação
- Testar fluxos de usuário

### 5.4 Fase 4: Limpeza (0.5 dia)
- Remover arquivos antigos
- Remover dependências não utilizadas
- Documentar nova implementação

## 6. Comparação: Antes vs Depois

| Aspecto | Sistema Atual | Sistema Proposto |
|---------|---------------|------------------|
| Arquivos de auth | 3 arquivos | 1 arquivo |
| Dependências | bcrypt + jsonwebtoken | express-session |
| Armazenamento | localStorage + cookies | cookies httpOnly |
| Middleware | 2 middlewares | 1 middleware |
| Complexidade | Alta | Baixa |
| Debugging | Difícil | Fácil |
| Segurança | Boa | Melhor |
| Manutenção | Complexa | Simples |

## 7. Considerações de Segurança

### 7.1 Melhorias de Segurança
- **Cookies httpOnly**: Não acessíveis via JavaScript (proteção XSS)
- **Secure flag**: Apenas HTTPS em produção
- **SameSite**: Proteção CSRF
- **Expiração automática**: Sessões expiram automaticamente

### 7.2 Configuração Recomendada
```javascript
app.use(session({
  secret: process.env.SESSION_SECRET,
  name: 'sessionId',
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));
```

## 8. Conclusão

A migração para um sistema de autenticação baseado em sessões simples resolverá os problemas atuais de:
- Tokens perdidos
- Erros de sincronização
- Complexidade excessiva
- Dificuldade de manutenção

**Recomendação**: Implementar esta solução o mais rápido possível para estabilizar o sistema e facilitar o desenvolvimento futuro.

**Tempo estimado de implementação**: 3-4 dias
**Risco**: Baixo (sistema mais simples = menos pontos de falha)
**Benefício**: Alto (sistema mais estável e fácil de manter)