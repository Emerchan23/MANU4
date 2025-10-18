# CHECKLIST DE ACEITE PARA PRODUÇÃO - AUDITORIA GERAL

## 📋 RESUMO EXECUTIVO

**Data:** 2025-01-27  
**Sistema:** Sistema de Manutenção  
**Ambiente:** Produção/Homologação  
**Responsável:** Auditor Técnico Full-Stack  
**Objetivo:** Validação manual final antes do deploy

---

## ✅ CRITÉRIOS DE ACEITE OBRIGATÓRIOS

### 🚀 1. DISPONIBILIDADE E SAÚDE DO SISTEMA

#### 1.1 Healthchecks
- [ ] **GET /api/health** retorna 200 OK
- [ ] **GET /api/ready** retorna 200 OK (se implementado)
- [ ] Tempo de resposta < 500ms para healthchecks
- [ ] Conexão com MariaDB ativa e responsiva

#### 1.2 Rotas Críticas
- [ ] **0 rotas retornando 5xx** em ambiente de produção
- [ ] Todas as rotas GET principais retornam 200 ou 404 (quando apropriado)
- [ ] APIs de autenticação funcionando corretamente

### 📊 2. PERFORMANCE E LATÊNCIA

#### 2.1 Métricas de Performance
- [ ] **P95 < 2000ms** para todas as rotas GET
- [ ] **P95 < 3000ms** para todas as rotas POST/PUT
- [ ] **P99 < 5000ms** para operações complexas
- [ ] Sem queries > 10s no slow_query_log do MariaDB

#### 2.2 Carga e Concorrência
- [ ] Sistema suporta 50 usuários simultâneos sem degradação
- [ ] Rate limiting funcionando (429 quando apropriado)
- [ ] Pool de conexões MariaDB configurado adequadamente

### 🔐 3. SEGURANÇA E AUTENTICAÇÃO

#### 3.1 Autenticação
- [ ] Login funciona com credenciais válidas
- [ ] Retorna 401 para credenciais inválidas
- [ ] JWT/Session expira conforme configurado
- [ ] Refresh token funciona (se implementado)

#### 3.2 Autorização
- [ ] Rotas protegidas retornam 401 sem token
- [ ] RBAC funciona conforme perfis definidos
- [ ] Não há vazamento de dados entre usuários

#### 3.3 CORS e Headers
- [ ] CORS configurado corretamente para frontend
- [ ] Headers de segurança presentes (CSP, HSTS, etc.)
- [ ] Não há exposição de informações sensíveis

### 🗄️ 4. INTEGRAÇÃO COM MARIADB

#### 4.1 Conectividade
- [ ] Conexão com MariaDB estável
- [ ] Pool de conexões funcionando
- [ ] Timeout configurado adequadamente
- [ ] Sem "MySQL server has gone away"

#### 4.2 Integridade dos Dados
- [ ] Constraints de FK funcionando
- [ ] Unique constraints validando corretamente
- [ ] Datas em formato ISO (não dd/mm/aaaa)
- [ ] Charset utf8mb4 em todas as tabelas

#### 4.3 Performance do Banco
- [ ] Índices criados para queries frequentes
- [ ] Sem table scans desnecessários
- [ ] Queries otimizadas (< 1s para operações normais)

### 📝 5. VALIDAÇÕES E TRATAMENTO DE ERROS

#### 5.1 Validações de Input
- [ ] **POST /api/companies** valida CNPJ corretamente
- [ ] **POST /api/users** valida email e campos obrigatórios
- [ ] **POST /api/service-orders** valida estrutura do payload
- [ ] Retorna 422 para dados inválidos com mensagens claras

#### 5.2 Tratamento de Erros
- [ ] Mensagens de erro padronizadas e informativas
- [ ] Stack traces não expostos em produção
- [ ] Logs estruturados para debugging
- [ ] Códigos de status HTTP corretos

### 🔍 6. OBSERVABILIDADE E LOGS

#### 6.1 Logging
- [ ] **Sem warnings críticos** nos logs de aplicação
- [ ] Logs estruturados com níveis apropriados
- [ ] Request ID para correlação (se implementado)
- [ ] Logs de erro com contexto suficiente

#### 6.2 Monitoramento
- [ ] Métricas de aplicação coletadas
- [ ] Alertas configurados para erros críticos
- [ ] Dashboard de saúde do sistema (se disponível)

### 🧪 7. TESTES FUNCIONAIS MANUAIS

#### 7.1 Fluxos Críticos
- [ ] **Cadastro de Empresa:** Criar, listar, editar, excluir
- [ ] **Gestão de Usuários:** Criar, autenticar, autorizar
- [ ] **Ordens de Serviço:** Criar, atualizar, consultar
- [ ] **Equipamentos:** Cadastrar, associar, manter

#### 7.2 Cenários de Erro
- [ ] Dados inválidos retornam 422 com detalhes
- [ ] Recursos não encontrados retornam 404
- [ ] Conflitos retornam 409 (ex: CNPJ duplicado)
- [ ] **Sem 4xx inesperados** em operações normais

---

## 🚨 CRITÉRIOS DE BLOQUEIO (SHOW STOPPERS)

### ❌ NÃO PODE IR PARA PRODUÇÃO SE:

1. **Qualquer rota crítica retornando 5xx**
2. **P95 > 5000ms** em operações básicas
3. **Falhas de autenticação** em fluxos principais
4. **Perda de dados** ou corrupção detectada
5. **Vulnerabilidades de segurança** não corrigidas
6. **Queries > 30s** no banco de dados
7. **Memory leaks** ou consumo excessivo de recursos

---

## 📋 CHECKLIST DE EXECUÇÃO MANUAL

### Pré-Deploy
```bash
# 1. Verificar saúde do sistema
curl -X GET http://localhost:3000/api/health
curl -X GET http://localhost:3000/api/categories

# 2. Testar autenticação
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@teste.com","password":"123456"}'

# 3. Validar CRUD básico
curl -X GET http://localhost:3000/api/companies
curl -X GET http://localhost:3000/api/equipment
```

### Pós-Deploy
```bash
# 1. Smoke test completo
npm run test:smoke

# 2. Verificar logs
tail -f logs/application.log | grep ERROR
tail -f logs/access.log | grep 5xx

# 3. Monitorar performance
# Verificar dashboard de métricas
# Acompanhar por 30 minutos
```

---

## 📊 MÉTRICAS DE ACEITE

### Targets Mínimos
- **Disponibilidade:** 99.9%
- **P95 Response Time:** < 2000ms
- **Error Rate:** < 0.1%
- **Database Connections:** < 80% do pool
- **Memory Usage:** < 70% da capacidade

### Targets Ideais
- **Disponibilidade:** 99.99%
- **P95 Response Time:** < 1000ms
- **Error Rate:** < 0.01%
- **Database Connections:** < 50% do pool
- **Memory Usage:** < 50% da capacidade

---

## 🔄 PROCEDIMENTO DE ROLLBACK

### Critérios para Rollback Imediato
1. **Error rate > 5%** por mais de 5 minutos
2. **P95 > 10000ms** por mais de 2 minutos
3. **Indisponibilidade** de funcionalidades críticas
4. **Corrupção de dados** detectada

### Comando de Rollback
```bash
# Reverter para versão anterior
git checkout <previous-stable-commit>
npm run build
pm2 restart all

# Verificar saúde pós-rollback
curl -X GET http://localhost:3000/api/health
```

---

## ✅ ASSINATURA DE ACEITE

**Testado por:** ___________________  
**Data:** ___________________  
**Ambiente:** ___________________  
**Versão:** ___________________  

**Status:** [ ] APROVADO [ ] REPROVADO [ ] APROVADO COM RESSALVAS

**Observações:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## 📞 CONTATOS DE EMERGÊNCIA

**Desenvolvedor Principal:** ___________________  
**DBA:** ___________________  
**DevOps:** ___________________  
**Product Owner:** ___________________

---

*Documento gerado pela Auditoria Geral - Sistema de Manutenção*  
*Versão 1.0 - Janeiro 2025*