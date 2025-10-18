# 🧪 GUIA DE TESTES MANUAIS
## Sistema de Manutenção - Validação de Correções

**Data:** ${new Date().toLocaleDateString('pt-BR')}

---

## 📋 PRÉ-REQUISITOS

Antes de iniciar os testes, certifique-se de que:

- [ ] ✅ XAMPP está rodando (MySQL/MariaDB)
- [ ] ✅ Banco de dados `hospital_maintenance` existe
- [ ] ✅ Servidor de desenvolvimento está rodando (`npm run dev`)
- [ ] ✅ Navegador está aberto

---

## 🚀 PASSO 1: INICIAR O SERVIDOR

### 1.1. Abrir Terminal
```bash
cd "C:\Users\Adm\Desktop\App Manutenção\sis manu"
```

### 1.2. Iniciar Servidor
```bash
npm run dev
```

### 1.3. Aguardar Mensagem
Aguarde até ver a mensagem:
```
✓ Ready in X.Xs
○ Local: http://localhost:3000
```

---

## 🧪 PASSO 2: TESTAR ORDEM DE SERVIÇO

### 2.1. Acessar Página de Ordens de Serviço
1. Abra o navegador
2. Acesse: `http://localhost:3000/service-orders`
3. Faça login se necessário

### 2.2. Verificar Listagem
**O que verificar:**
- [ ] ✅ A página carrega sem erros
- [ ] ✅ As ordens de serviço são exibidas
- [ ] ✅ As datas estão no formato **dd/mm/yyyy** (ex: 15/01/2024)
- [ ] ✅ Os valores estão no formato **R$ X.XXX,XX** (ex: R$ 1.500,50)
- [ ] ✅ Nome do equipamento é exibido
- [ ] ✅ Nome da empresa é exibida
- [ ] ✅ Nome do setor é exibido (se disponível)
- [ ] ✅ Status e prioridade são exibidos

**Exemplo de dados esperados:**
```
Ordem: OS-2024-001
Equipamento: Autoclave XYZ
Empresa: Hospital ABC
Setor: Centro Cirúrgico
Data Agendada: 20/01/2024
Status: Pendente
Prioridade: Alta
```

### 2.3. Criar Nova Ordem de Serviço
1. Clique no botão **"Nova Ordem de Serviço"** ou **"Criar"**
2. Preencha o formulário:
   - **Equipamento:** Selecione um equipamento
   - **Empresa:** Selecione uma empresa
   - **Descrição:** "Teste de criação de ordem de serviço"
   - **Prioridade:** Média
   - **Status:** Pendente
   - **Data Solicitada:** 15/01/2024
   - **Data Agendada:** 20/01/2024
   - **Tipo:** Preventiva
3. Clique em **"Salvar"** ou **"Criar"**

**O que verificar:**
- [ ] ✅ Formulário é exibido corretamente
- [ ] ✅ Campos de data aceitam formato dd/mm/yyyy
- [ ] ✅ Seleção de equipamento mostra nome e setor
- [ ] ✅ Ordem é criada com sucesso
- [ ] ✅ Mensagem de sucesso é exibida
- [ ] ✅ Nova ordem aparece na listagem
- [ ] ✅ Datas da nova ordem estão formatadas corretamente

### 2.4. Visualizar Detalhes da Ordem
1. Clique em uma ordem de serviço da lista
2. Visualize os detalhes

**O que verificar:**
- [ ] ✅ Todos os dados são exibidos
- [ ] ✅ Datas estão no formato brasileiro
- [ ] ✅ Valores monetários estão formatados
- [ ] ✅ Informações do equipamento estão completas
- [ ] ✅ Setor e subsetor são exibidos (se disponíveis)
- [ ] ✅ Responsáveis são exibidos

---

## 📄 PASSO 3: TESTAR GERAÇÃO DE PDF

### 3.1. Gerar PDF de Ordem de Serviço
1. Na página de detalhes de uma ordem de serviço
2. Clique no botão **"Gerar PDF"** ou **"Imprimir"**
3. O PDF deve ser baixado automaticamente

**O que verificar no PDF:**
- [ ] ✅ PDF é gerado sem erros
- [ ] ✅ Cabeçalho com logo (se configurado)
- [ ] ✅ Título: "Ordem de Serviço"
- [ ] ✅ Número da ordem
- [ ] ✅ Informações do equipamento
- [ ] ✅ Informações da empresa
- [ ] ✅ Setor e subsetor (se disponíveis)
- [ ] ✅ **Datas no formato dd/mm/yyyy**
- [ ] ✅ **Valores no formato R$ X.XXX,XX**
- [ ] ✅ Descrição completa
- [ ] ✅ Responsáveis
- [ ] ✅ Rodapé (se configurado)

**Exemplo de formatação esperada no PDF:**
```
Data de Abertura: 15/01/2024
Data Agendada: 20/01/2024
Prazo: 25/01/2024
Custo Estimado: R$ 1.500,50
```

### 3.2. Testar PDF via API (Opcional)
Se quiser testar diretamente via API:

1. Abra um novo terminal
2. Execute:
```bash
curl -X POST "http://localhost:3000/api/pdf/generate" ^
  -H "Content-Type: application/json" ^
  -d "{\"type\":\"service-order\",\"data\":{\"id\":1,\"order_number\":\"OS-2024-001\",\"equipment_name\":\"Teste\",\"scheduled_date\":\"2024-01-20\",\"estimated_cost\":1500.50}}" ^
  --output test-order.pdf
```

3. Abra o arquivo `test-order.pdf` gerado
4. Verifique a formatação

---

## 📅 PASSO 4: TESTAR AGENDAMENTOS

### 4.1. Acessar Página de Agendamentos
1. Acesse: `http://localhost:3000/maintenance-schedules`
2. Ou navegue pelo menu: **Manutenção** → **Agendamentos**

### 4.2. Criar Novo Agendamento
1. Clique em **"Novo Agendamento"** ou **"Criar"**
2. Preencha o formulário:
   - **Equipamento:** Selecione um equipamento
   - **Plano de Manutenção:** Selecione um plano (se disponível)
   - **Data Agendada:** 25/01/2024
   - **Duração Estimada:** 120 minutos
   - **Prioridade:** Alta
   - **Status:** Agendado
   - **Descrição:** "Teste de agendamento de manutenção"
   - **Responsável:** Selecione um usuário
3. Clique em **"Salvar"**

**O que verificar:**
- [ ] ✅ Formulário é exibido corretamente
- [ ] ✅ Campo de data aceita formato dd/mm/yyyy
- [ ] ✅ Agendamento é criado com sucesso
- [ ] ✅ Mensagem de sucesso é exibida
- [ ] ✅ Novo agendamento aparece na listagem
- [ ] ✅ Data está formatada corretamente

### 4.3. Gerar PDF de Agendamento
1. Clique em um agendamento da lista
2. Clique em **"Gerar PDF"** ou **"Imprimir"**

**O que verificar no PDF:**
- [ ] ✅ PDF é gerado sem erros
- [ ] ✅ Título: "Agendamento de Manutenção"
- [ ] ✅ Informações do equipamento
- [ ] ✅ Informações do agendamento
- [ ] ✅ **Data agendada no formato dd/mm/yyyy**
- [ ] ✅ Duração estimada
- [ ] ✅ Descrição
- [ ] ✅ Responsável
- [ ] ✅ Espaço para assinaturas

---

## 🔍 PASSO 5: VALIDAR INTEGRAÇÕES

### 5.1. Verificar Integração com Equipamentos
1. Ao criar/editar ordem de serviço
2. Selecione um equipamento
3. Verifique se aparecem:
   - [ ] ✅ Nome do equipamento
   - [ ] ✅ Código/Patrimônio
   - [ ] ✅ Setor (automaticamente)
   - [ ] ✅ Subsetor (se disponível)

### 5.2. Verificar Integração com Empresas
1. Ao criar/editar ordem de serviço
2. Selecione uma empresa
3. Verifique se o nome da empresa é exibido corretamente

### 5.3. Verificar Integração com Setores
1. Na listagem de ordens de serviço
2. Verifique se a coluna "Setor" mostra o setor do equipamento
3. Ao visualizar detalhes, verifique se setor e subsetor são exibidos

### 5.4. Verificar Integração com Usuários
1. Ao criar ordem de serviço
2. Verifique se pode selecionar:
   - [ ] ✅ Criado por (usuário atual)
   - [ ] ✅ Atribuído a (técnico responsável)
3. Na listagem, verifique se os nomes dos usuários são exibidos

---

## 📊 PASSO 6: TESTAR API DIRETAMENTE

### 6.1. Testar GET - Listar Ordens
Abra um terminal e execute:
```bash
curl "http://localhost:3000/api/service-orders?page=1&limit=5"
```

**O que verificar:**
- [ ] ✅ Retorna JSON com sucesso
- [ ] ✅ Campo `success: true`
- [ ] ✅ Array `data` com ordens de serviço
- [ ] ✅ Datas no formato dd/mm/yyyy
- [ ] ✅ Campos de integração preenchidos:
  - `equipment_name`
  - `company_name`
  - `sector_name`
  - `subsector_name`
  - `created_by_name`
  - `assigned_to_name`

### 6.2. Testar POST - Criar Ordem
```bash
curl -X POST "http://localhost:3000/api/service-orders" ^
  -H "Content-Type: application/json" ^
  -d "{\"equipment_id\":1,\"company_id\":1,\"description\":\"Teste API\",\"priority\":\"medium\",\"status\":\"pending\",\"requested_date\":\"2024-01-15\",\"scheduled_date\":\"2024-01-20\",\"created_by\":1,\"assigned_to\":1}"
```

**O que verificar:**
- [ ] ✅ Retorna status 201 (Created)
- [ ] ✅ Retorna dados da ordem criada
- [ ] ✅ Datas formatadas corretamente
- [ ] ✅ Integrações preenchidas

---

## ✅ CHECKLIST FINAL

### Formatação Brasileira
- [ ] ✅ Todas as datas estão no formato dd/mm/yyyy
- [ ] ✅ Todos os valores estão no formato R$ X.XXX,XX
- [ ] ✅ PDFs têm formatação brasileira

### Integrações
- [ ] ✅ Ordem de Serviço ↔ Equipamentos
- [ ] ✅ Ordem de Serviço ↔ Empresas
- [ ] ✅ Ordem de Serviço ↔ Setores (via equipamento)
- [ ] ✅ Ordem de Serviço ↔ Subsectores (via equipamento)
- [ ] ✅ Ordem de Serviço ↔ Usuários
- [ ] ✅ Agendamento ↔ Equipamentos
- [ ] ✅ Agendamento ↔ Planos de Manutenção
- [ ] ✅ Agendamento ↔ Usuários

### Funcionalidades
- [ ] ✅ Listar ordens de serviço
- [ ] ✅ Criar ordem de serviço
- [ ] ✅ Visualizar detalhes da ordem
- [ ] ✅ Gerar PDF de ordem de serviço
- [ ] ✅ Listar agendamentos
- [ ] ✅ Criar agendamento
- [ ] ✅ Gerar PDF de agendamento

### APIs
- [ ] ✅ GET /api/service-orders funciona
- [ ] ✅ POST /api/service-orders funciona
- [ ] ✅ GET /api/maintenance-schedules funciona
- [ ] ✅ POST /api/maintenance-schedules funciona
- [ ] ✅ POST /api/pdf/generate funciona

---

## 🐛 PROBLEMAS ENCONTRADOS

Se encontrar algum problema, anote aqui:

### Problema 1:
- **Descrição:**
- **Onde ocorreu:**
- **Mensagem de erro:**
- **Passos para reproduzir:**

### Problema 2:
- **Descrição:**
- **Onde ocorreu:**
- **Mensagem de erro:**
- **Passos para reproduzir:**

---

## 📝 OBSERVAÇÕES

Anote aqui qualquer observação adicional sobre os testes:

---

**✅ TESTES CONCLUÍDOS!**

Se todos os itens do checklist foram marcados, o sistema está funcionando corretamente!

---

**Data do Teste:** ___/___/______
**Testado por:** _________________
**Resultado:** [ ] Aprovado [ ] Reprovado
