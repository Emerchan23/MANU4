# ✅ CHECKLIST DE VALIDAÇÃO - NOVO EQUIPAMENTO

## 1. VALIDAÇÃO DA INTERFACE (UI)

### 1.1. Campos do Formulário
- [ ] **Número do Patrimônio**: Campo obrigatório, texto curto, único
- [ ] **Nome do Equipamento**: Campo obrigatório, texto curto
- [ ] **Marca**: Campo opcional, texto
- [ ] **Modelo**: Campo opcional, texto
- [ ] **Número de Série**: Campo opcional, texto, único se preenchido
- [ ] **Categoria**: Select com opção "+ Cadastrar"
- [ ] **Setor**: Select obrigatório
- [ ] **Subsetor**: Select dependente do setor selecionado
- [ ] **Data de Instalação**: Campo de data com máscara dd/mm/aaaa
- [ ] **Frequência de Manutenção**: Campo numérico (dias), inteiro > 0
- [ ] **Status**: Select com valores (Ativo, Inativo, Em_Manutenção), default "Ativo"
- [ ] **Observações**: Campo de texto longo, opcional
- [ ] **Voltagem**: Campo opcional, texto

### 1.2. Validações da UI
- [ ] Máscara de data funciona corretamente (dd/mm/aaaa)
- [ ] Validação de data impede datas inválidas (31/02, etc.)
- [ ] Subsetor é filtrado baseado no setor selecionado
- [ ] Campos obrigatórios são destacados visualmente
- [ ] Mensagens de erro são exibidas claramente
- [ ] Botão "Salvar" fica desabilitado durante o envio
- [ ] Loading state é exibido durante operações

### 1.3. Experiência do Usuário
- [ ] Formulário é responsivo em diferentes tamanhos de tela
- [ ] Navegação por teclado (Tab) funciona corretamente
- [ ] Campos têm labels e placeholders apropriados
- [ ] Feedback visual para campos válidos/inválidos
- [ ] Confirmação de sucesso após salvar

## 2. VALIDAÇÃO DA API

### 2.1. Endpoints Funcionais
- [ ] **GET /api/equipment**: Lista todos os equipamentos
- [ ] **GET /api/equipment/{id}**: Busca equipamento por ID
- [ ] **POST /api/equipment**: Cria novo equipamento
- [ ] **PUT /api/equipment/{id}**: Atualiza equipamento existente

### 2.2. Validações de Entrada
- [ ] Patrimônio obrigatório e único (erro 409 se duplicado)
- [ ] Nome obrigatório (erro 422 se vazio)
- [ ] Número de série único se informado (erro 409 se duplicado)
- [ ] Data no formato dd/mm/aaaa é convertida para ISO
- [ ] Datas inválidas são rejeitadas (erro 422)
- [ ] Frequência de manutenção > 0 (erro 422 se ≤ 0)
- [ ] Status deve ser válido (Ativo, Inativo, Em_Manutencao)
- [ ] Subsetor deve pertencer ao setor selecionado

### 2.3. Respostas da API
- [ ] Status codes corretos (200, 201, 400, 409, 422, 500)
- [ ] Estrutura JSON consistente com `success`, `data`, `message`
- [ ] Mensagens de erro são claras e específicas
- [ ] Dados retornados incluem joins com nomes de setor/categoria/subsetor

### 2.4. Segurança
- [ ] Proteção contra SQL Injection
- [ ] Sanitização de dados de entrada
- [ ] Validação de tamanho máximo dos campos
- [ ] Logs de erro não expõem informações sensíveis

## 3. VALIDAÇÃO DO BANCO DE DADOS

### 3.1. Estrutura da Tabela `equipment`
- [ ] **id**: BIGINT PRIMARY KEY AUTO_INCREMENT
- [ ] **patrimonio_number**: VARCHAR(32) NOT NULL UNIQUE
- [ ] **name**: VARCHAR(120) NOT NULL
- [ ] **manufacturer**: VARCHAR(80) NULL
- [ ] **model**: VARCHAR(120) NULL
- [ ] **serial_number**: VARCHAR(64) NULL UNIQUE (permite múltiplos NULLs)
- [ ] **category_id**: BIGINT NULL FK → categories(id)
- [ ] **sector_id**: BIGINT NULL FK → setores(id)
- [ ] **subsector_id**: BIGINT NULL FK → subsetores(id)
- [ ] **installation_date**: DATE NULL
- [ ] **maintenance_frequency_days**: INT UNSIGNED NULL
- [ ] **status**: ENUM('Ativo','Inativo','Em_Manutencao') NOT NULL DEFAULT 'Ativo'
- [ ] **observations**: TEXT NULL
- [ ] **voltage**: VARCHAR(20) NULL
- [ ] **created_at**: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- [ ] **updated_at**: TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

### 3.2. Índices e Constraints
- [ ] Índice único em `patrimonio_number`
- [ ] Índice único em `serial_number` (ignorando NULLs)
- [ ] Chave estrangeira para `categories(id)`
- [ ] Chave estrangeira para `setores(id)`
- [ ] Chave estrangeira para `subsetores(id)`
- [ ] Trigger para validar subsetor pertence ao setor
- [ ] Índices de performance em campos de busca

### 3.3. Tabelas Auxiliares
- [ ] **categories**: id, name UNIQUE, ativo
- [ ] **setores**: id, nome UNIQUE, ativo
- [ ] **subsetores**: id, setor_id FK, nome, UNIQUE(nome,setor_id)

### 3.4. Integridade Referencial
- [ ] Não existem equipamentos com category_id órfão
- [ ] Não existem equipamentos com sector_id órfão
- [ ] Não existem equipamentos com subsector_id órfão
- [ ] Todos os subsetores pertencem a setores válidos

## 4. TESTES DE INTEGRAÇÃO

### 4.1. Fluxo Completo - Criação
1. [ ] Abrir formulário "Novo Equipamento"
2. [ ] Preencher todos os campos obrigatórios
3. [ ] Selecionar setor e subsetor compatível
4. [ ] Inserir data no formato dd/mm/aaaa
5. [ ] Clicar em "Salvar"
6. [ ] Verificar mensagem de sucesso
7. [ ] Confirmar que equipamento aparece na listagem
8. [ ] Verificar dados no banco de dados

### 4.2. Fluxo Completo - Edição
1. [ ] Selecionar equipamento existente para editar
2. [ ] Modificar alguns campos
3. [ ] Salvar alterações
4. [ ] Verificar mensagem de sucesso
5. [ ] Confirmar alterações na listagem
6. [ ] Verificar dados atualizados no banco

### 4.3. Validação de Erros
1. [ ] Tentar criar equipamento com patrimônio duplicado
2. [ ] Tentar criar com campos obrigatórios vazios
3. [ ] Tentar inserir data inválida (31/02/2024)
4. [ ] Tentar inserir frequência negativa
5. [ ] Verificar mensagens de erro apropriadas

## 5. TESTES DE PERFORMANCE

### 5.1. Carga de Dados
- [ ] Formulário carrega rapidamente (< 2 segundos)
- [ ] Listagem de equipamentos carrega em tempo aceitável
- [ ] Filtros por setor/categoria funcionam rapidamente
- [ ] Busca por ID é instantânea

### 5.2. Volume de Dados
- [ ] Sistema funciona com 1000+ equipamentos
- [ ] Paginação funciona corretamente
- [ ] Filtros mantêm performance com grande volume

## 6. TESTES DE COMPATIBILIDADE

### 6.1. Navegadores
- [ ] Chrome (última versão)
- [ ] Firefox (última versão)
- [ ] Safari (se aplicável)
- [ ] Edge (última versão)

### 6.2. Dispositivos
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

## 7. VALIDAÇÃO FINAL

### 7.1. Documentação
- [ ] README atualizado com instruções
- [ ] Comentários no código são claros
- [ ] Estrutura do banco documentada

### 7.2. Logs e Monitoramento
- [ ] Logs de erro são informativos
- [ ] Logs de sucesso registram operações importantes
- [ ] Não há vazamento de informações sensíveis nos logs

### 7.3. Backup e Recuperação
- [ ] Estrutura do banco permite backup completo
- [ ] Dados podem ser restaurados sem perda de integridade
- [ ] Migrações são reversíveis

---

## ✅ APROVAÇÃO FINAL

**Data da Auditoria**: _______________

**Auditor Responsável**: _______________

**Status**: 
- [ ] ✅ **APROVADO** - Sistema está pronto para produção
- [ ] ⚠️ **APROVADO COM RESSALVAS** - Correções menores necessárias
- [ ] ❌ **REPROVADO** - Correções críticas necessárias

**Observações Finais**:
_________________________________________________
_________________________________________________
_________________________________________________

**Assinatura**: _______________