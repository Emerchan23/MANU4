# MAPA COMPLETO DAS ROTAS - AUDITORIA GERAL API

## 📊 RESUMO EXECUTIVO

**Data da Auditoria:** 2025-01-27  
**Sistema:** Sistema de Manutenção  
**Backend:** Next.js/Node.js  
**Banco:** MariaDB  
**Total de Rotas Identificadas:** 45+  
**Taxa de Sucesso nos Testes:** 72.2% (13/18 testes)

---

## 🗺️ MAPA DETALHADO DAS ROTAS

### 1. AUTENTICAÇÃO E AUTORIZAÇÃO

| Método | Endpoint | Descrição | Auth | Request | Response | Status |
|--------|----------|-----------|------|---------|----------|--------|
| GET | `/api/auth/me` | Obter usuário atual e permissões | JWT | - | User + Permissions | ✅ |
| POST | `/api/auth/login` | Login do usuário | - | email, password | JWT Token | ✅ |
| POST | `/api/auth/logout` | Logout do usuário | JWT | - | Success | ✅ |

### 2. GESTÃO DE USUÁRIOS

| Método | Endpoint | Descrição | Auth | Request | Response | Status |
|--------|----------|-----------|------|---------|----------|--------|
| GET | `/api/users` | Listar usuários (admin only) | JWT + Admin | query params | User[] | ✅ |
| POST | `/api/users` | Criar novo usuário | JWT + Admin | User data | User | ❌ 400 |
| PUT | `/api/users/[id]` | Atualizar usuário | JWT + Admin | User data | User | ⚠️ |
| DELETE | `/api/users/[id]` | Deletar usuário | JWT + Admin | - | Success | ⚠️ |

### 3. GESTÃO DE EMPRESAS

| Método | Endpoint | Descrição | Auth | Request | Response | Status |
|--------|----------|-----------|------|---------|----------|--------|
| GET | `/api/companies` | Listar empresas | JWT | filters, pagination | Company[] | ✅ |
| POST | `/api/companies` | Criar empresa | JWT | Company data | Company | ❌ 400 |
| PUT | `/api/companies/[id]` | Atualizar empresa | JWT | Company data | Company | ⚠️ |
| DELETE | `/api/companies/[id]` | Deletar empresa | JWT | - | Success/Error | ⚠️ |

### 4. GESTÃO DE SETORES E SUBSETORES

| Método | Endpoint | Descrição | Auth | Request | Response | Status |
|--------|----------|-----------|------|---------|----------|--------|
| GET | `/api/sectors` | Listar setores | JWT | - | Sector[] | ✅ |
| POST | `/api/sectors` | Criar setor | JWT | Sector data | Sector | ✅ |
| PUT | `/api/sectors/[id]` | Atualizar setor | JWT | Sector data | Sector | ⚠️ |
| DELETE | `/api/sectors/[id]` | Deletar setor | JWT | - | Success | ⚠️ |
| GET | `/api/subsectors` | Listar subsetores | JWT | sectorId? | Subsector[] | ✅ |
| POST | `/api/subsectors` | Criar subsetor | JWT | Subsector data | Subsector | ✅ |
| DELETE | `/api/subsectors/[id]` | Deletar subsetor | JWT | - | Success | ⚠️ |

### 5. GESTÃO DE CATEGORIAS

| Método | Endpoint | Descrição | Auth | Request | Response | Status |
|--------|----------|-----------|------|---------|----------|--------|
| GET | `/api/categories` | Listar categorias | JWT | - | Category[] | ✅ |
| POST | `/api/categories` | Criar categoria | JWT | Category data | Category | ✅ |
| PUT | `/api/categories/[id]` | Atualizar categoria | JWT | Category data | Category | ⚠️ |
| DELETE | `/api/categories/[id]` | Deletar categoria | JWT | - | Success | ⚠️ |

### 6. GESTÃO DE EQUIPAMENTOS

| Método | Endpoint | Descrição | Auth | Request | Response | Status |
|--------|----------|-----------|------|---------|----------|--------|
| GET | `/api/equipment` | Listar equipamentos | JWT | filters, joins | Equipment[] | ✅ |
| POST | `/api/equipment` | Criar equipamento | JWT | Equipment data | Equipment | ✅ |
| PUT | `/api/equipment/[id]` | Atualizar equipamento | JWT | Equipment data | Equipment | ⚠️ |
| DELETE | `/api/equipment/[id]` | Deletar equipamento | JWT | - | Success | ⚠️ |

### 7. ORDENS DE SERVIÇO

| Método | Endpoint | Descrição | Auth | Request | Response | Status |
|--------|----------|-----------|------|---------|----------|--------|
| GET | `/api/service-orders` | Listar OS | JWT | filters, pagination | ServiceOrder[] | ✅ |
| POST | `/api/service-orders` | Criar OS | JWT | ServiceOrder data | ServiceOrder | ❌ 400 |
| PUT | `/api/service-orders/[id]` | Atualizar OS | JWT | ServiceOrder data | ServiceOrder | ⚠️ |
| DELETE | `/api/service-orders/[id]` | Deletar OS | JWT | - | Success | ⚠️ |

### 8. TEMPLATES DE SERVIÇO

| Método | Endpoint | Descrição | Auth | Request | Response | Status |
|--------|----------|-----------|------|---------|----------|--------|
| GET | `/api/service-templates` | Listar templates | JWT | pagination | Template[] | ⚠️ |
| POST | `/api/service-templates` | Criar template | JWT | Template data | Template | ⚠️ |
| PUT | `/api/service-templates/[id]` | Atualizar template | JWT | Template data | Template | ⚠️ |
| DELETE | `/api/service-templates/[id]` | Deletar template | JWT | - | Success | ⚠️ |

### 9. CATEGORIAS DE TEMPLATES

| Método | Endpoint | Descrição | Auth | Request | Response | Status |
|--------|----------|-----------|------|---------|----------|--------|
| GET | `/api/template-categories` | Listar categorias | JWT | pagination | TemplateCategory[] | ⚠️ |
| POST | `/api/template-categories` | Criar categoria | JWT | Category data | Category | ⚠️ |

### 10. MANUTENÇÃO PREVENTIVA

| Método | Endpoint | Descrição | Auth | Request | Response | Status |
|--------|----------|-----------|------|---------|----------|--------|
| GET | `/api/preventive-maintenance` | Listar manutenções | JWT | filters | Maintenance[] | ⚠️ |
| POST | `/api/preventive-maintenance` | Criar manutenção | JWT | Maintenance data | Maintenance | ⚠️ |
| PUT | `/api/preventive-maintenance/[id]` | Atualizar manutenção | JWT | Maintenance data | Maintenance | ⚠️ |

### 11. TIPOS DE MANUTENÇÃO

| Método | Endpoint | Descrição | Auth | Request | Response | Status |
|--------|----------|-----------|------|---------|----------|--------|
| GET | `/api/maintenance-types` | Listar tipos | JWT | - | MaintenanceType[] | ⚠️ |
| POST | `/api/maintenance-types` | Criar tipo | JWT | Type data | Type | ⚠️ |

### 12. DASHBOARD E MÉTRICAS

| Método | Endpoint | Descrição | Auth | Request | Response | Status |
|--------|----------|-----------|------|---------|----------|--------|
| GET | `/api/dashboard/stats` | Estatísticas gerais | JWT | - | Stats | ✅ |
| GET | `/api/dashboard/status` | Status equipamentos/OS | JWT | - | Status | ⚠️ |

### 13. RELATÓRIOS

| Método | Endpoint | Descrição | Auth | Request | Response | Status |
|--------|----------|-----------|------|---------|----------|--------|
| GET | `/api/reports/stats` | Estatísticas | JWT | - | Stats | ❌ 401 |
| GET | `/api/reports/sector-performance` | Performance setores | JWT | - | Performance | ⚠️ |
| GET | `/api/reports` | Relatórios combinados | JWT | - | Reports | ⚠️ |

### 14. NOTIFICAÇÕES

| Método | Endpoint | Descrição | Auth | Request | Response | Status |
|--------|----------|-----------|------|---------|----------|--------|
| GET | `/api/notifications` | Listar notificações | JWT | - | Notification[] | ❌ 401 |
| POST | `/api/notifications` | Criar notificação | JWT | Notification data | Notification | ⚠️ |
| PUT | `/api/notifications/[id]` | Atualizar notificação | JWT | Notification data | Notification | ⚠️ |

### 15. CONFIGURAÇÕES DO SISTEMA

| Método | Endpoint | Descrição | Auth | Request | Response | Status |
|--------|----------|-----------|------|---------|----------|--------|
| GET | `/api/system-settings` | Obter configurações | JWT | - | Settings | ⚠️ |
| PUT | `/api/system-settings` | Atualizar configurações | JWT + Admin | Settings data | Settings | ⚠️ |

### 16. CONFIGURAÇÕES GLOBAIS

| Método | Endpoint | Descrição | Auth | Request | Response | Status |
|--------|----------|-----------|------|---------|----------|--------|
| GET | `/api/global-settings` | Configurações globais | JWT | - | GlobalSettings | ⚠️ |
| PUT | `/api/global-settings` | Atualizar globais | JWT + Admin | Settings data | Settings | ⚠️ |

### 17. ALERTAS

| Método | Endpoint | Descrição | Auth | Request | Response | Status |
|--------|----------|-----------|------|---------|----------|--------|
| GET | `/api/alerts` | Listar alertas | JWT | - | Alert[] | ⚠️ |
| POST | `/api/alerts` | Criar alerta | JWT | Alert data | Alert | ⚠️ |
| PUT | `/api/alerts/[id]` | Atualizar alerta | JWT | Alert data | Alert | ⚠️ |

### 18. GERAÇÃO DE PDF

| Método | Endpoint | Descrição | Auth | Request | Response | Status |
|--------|----------|-----------|------|---------|----------|--------|
| GET | `/api/pdf/logo` | Logo ativo para PDF | JWT | - | Logo | ⚠️ |
| POST | `/api/pdf/service-order/[id]` | Gerar PDF da OS | JWT | - | PDF | ⚠️ |

### 19. WEBSOCKETS

| Método | Endpoint | Descrição | Auth | Request | Response | Status |
|--------|----------|-----------|------|---------|----------|--------|
| WS | `/api/websocket` | Conexão WebSocket | JWT | - | Real-time data | ⚠️ |

### 20. HEALTH CHECK

| Método | Endpoint | Descrição | Auth | Request | Response | Status |
|--------|----------|-----------|------|---------|----------|--------|
| GET | `/api/health` | Verificação de saúde | - | - | Health status | ✅ |

---

## 📈 ANÁLISE DE PERFORMANCE DOS TESTES

### ✅ ROTAS COM SUCESSO (72.2%)
- `/api/categories` - GET/POST: 100%
- `/api/sectors` - GET/POST: 100%  
- `/api/subsectors` - GET/POST: 100%
- `/api/equipment` - GET/POST: 100%
- `/api/dashboard/stats` - GET: 100%
- `/api/health` - GET: 100%

### ❌ ROTAS COM FALHAS (27.8%)
- `/api/companies` - POST: 400 (validação)
- `/api/service-orders` - POST: 400 (validação)
- `/api/users` - POST: 400 (validação)
- `/api/notifications` - GET: 401 (auth)
- `/api/reports/stats` - GET: 401 (auth)

### ⚠️ ROTAS NÃO TESTADAS
- Todas as rotas PUT/DELETE
- Rotas de templates
- Rotas de manutenção preventiva
- Rotas de configurações
- Rotas de PDF
- WebSockets

---

## 🔍 OBSERVAÇÕES TÉCNICAS

### Padrões Identificados:
1. **Autenticação:** JWT obrigatório para maioria das rotas
2. **Autorização:** Algumas rotas requerem perfil admin
3. **Paginação:** Implementada em rotas de listagem
4. **Filtros:** Suporte a filtros em rotas GET
5. **Validação:** Falhas 400 indicam problemas de validação
6. **CORS:** Configurado no middleware

### Problemas Detectados:
1. **Falhas de Validação:** POST retornando 400
2. **Problemas de Auth:** Algumas rotas retornando 401
3. **Cobertura de Testes:** Apenas 40% das rotas testadas
4. **Documentação:** Falta OpenAPI/Swagger

---

## 📋 PRÓXIMOS PASSOS

1. **Investigar falhas 400:** Validar payloads de POST
2. **Corrigir problemas 401:** Verificar middleware de auth
3. **Testar rotas PUT/DELETE:** Expandir cobertura de testes
4. **Implementar OpenAPI:** Documentar contratos
5. **Adicionar logs estruturados:** Melhorar observabilidade

---

*Documento gerado automaticamente pela Auditoria Geral de APIs - 2025-01-27*