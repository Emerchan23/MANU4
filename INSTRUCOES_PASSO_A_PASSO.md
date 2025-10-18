# 🎯 INSTRUÇÕES PASSO A PASSO - RESOLVER PROBLEMA DE EMPRESAS TERCEIRIZADAS

## 📋 SITUAÇÃO ATUAL

Você relatou que campos como **contato, telefone, endereço e especialidade** aparecem como "Não informado" na aba de Empresas Terceirizadas.

## ✅ O QUE JÁ FOI FEITO

1. ✅ Auditoria completa do código
2. ✅ Correções na API com logs detalhados
3. ✅ Validação de todos os campos obrigatórios
4. ✅ Scripts de diagnóstico e teste criados
5. ✅ Documentação completa

## 🚀 PRÓXIMOS PASSOS (SIGA ESTA ORDEM)

---

### PASSO 1: Verificar o Banco de Dados 🔍

**Execute este comando no terminal:**

```bash
mysql -u root -p sistema_manutencao < diagnostico-empresas.sql
```

**O que você vai ver:**
- Estrutura da tabela `empresas`
- Total de registros
- Análise de campos vazios
- Primeiros registros

**O que verificar:**
- ✅ A tabela `empresas` existe?
- ✅ A coluna `specialties` existe?
- ✅ Quantas empresas têm campos vazios?

**Se houver muitas empresas com campos vazios:**
```bash
# Execute este script para identificá-las
mysql -u root -p sistema_manutencao < corrigir-empresas-vazias.sql
```

---

### PASSO 2: Iniciar o Servidor 🖥️

**No terminal, execute:**

```bash
npm run dev
```

**Aguarde até ver:**
```
✓ Ready in X ms
○ Local: http://localhost:3000
```

**⚠️ IMPORTANTE:** Deixe este terminal aberto! Você vai precisar ver os logs aqui.

---

### PASSO 3: Executar Testes Automatizados 🧪

**Abra um NOVO terminal e execute:**

```bash
node test-empresas-api.js
```

**O que você vai ver:**
- Testes de listagem
- Testes de criação
- Testes de edição
- Testes de validação
- Relatório final

**Resultado esperado:**
```
✅ Passou: 7
❌ Falhou: 0
Taxa de sucesso: 100%
```

**Se algum teste falhar:**
- Leia a mensagem de erro
- Verifique os logs no terminal do servidor
- Consulte o `GUIA_RAPIDO_EMPRESAS.md`

---

### PASSO 4: Testar Manualmente no Navegador 🌐

#### 4.1 Acessar a Página

**Abra o navegador e acesse:**
```
http://localhost:3000/empresas
```

#### 4.2 Criar Nova Empresa

1. Clique em **"Nova Empresa"**

2. Preencha TODOS os campos:
   ```
   Nome: Empresa Teste Manual
   CNPJ: 12.345.678/0001-90
   Pessoa de Contato: João Silva
   Telefone: (11) 98765-4321
   E-mail: joao@teste.com
   Endereço: Rua Teste, 123 - São Paulo/SP
   Especialidades: Elétrica, Hidráulica
   ```

3. Clique em **"Criar"**

4. **Verifique:**
   - ✅ Mensagem de sucesso apareceu?
   - ✅ Empresa aparece na lista?
   - ✅ TODOS os campos estão visíveis?
   - ✅ Nenhum campo aparece como "Não informado"?

5. **Verifique os logs no terminal do servidor:**
   ```
   📝 [API] POST /api/companies - Criando nova empresa...
   📝 [API] Dados recebidos do frontend: {...}
   💾 [API] Dados que serão inseridos no banco:
     - nome: Empresa Teste Manual
     - cnpj: 12.345.678/0001-90
     - contato_responsavel: João Silva
     - telefone: (11) 98765-4321
     - email: joao@teste.com
     - endereco: Rua Teste, 123 - São Paulo/SP
     - specialties: Elétrica, Hidráulica
   ✅ [API] Empresa criada com ID: X
   🔍 [API] Empresa salva no banco (verificação): {...}
   ```

#### 4.3 Editar Empresa

1. Clique em **"Editar"** na empresa que você acabou de criar

2. Modifique alguns campos:
   ```
   Telefone: (11) 91234-5678
   Endereço: Av. Nova, 456 - Rio de Janeiro/RJ
   ```

3. Clique em **"Atualizar"**

4. **Verifique:**
   - ✅ Mensagem de sucesso apareceu?
   - ✅ Alterações estão visíveis na lista?

5. **Verifique os logs no terminal do servidor:**
   ```
   🔄 [API] PUT /api/companies - Atualizando empresa...
   🔍 [API] Empresa atual no banco: {...}
     ✏️ Atualizando telefone: (11) 91234-5678
     ✏️ Atualizando endereco: Av. Nova, 456 - Rio de Janeiro/RJ
   📊 [API] Resultado da atualização: { affectedRows: 1, changedRows: 1 }
   🔍 [API] Empresa atualizada no banco: {...}
   ```

---

### PASSO 5: Verificar Empresas Antigas 📊

Se você tem empresas antigas que aparecem com "Não informado":

#### 5.1 Identificar Empresas com Problemas

```bash
mysql -u root -p sistema_manutencao < corrigir-empresas-vazias.sql
```

Isso vai mostrar quais empresas têm campos vazios.

#### 5.2 Corrigir Manualmente

Para cada empresa com campos vazios:

1. Clique em **"Editar"**
2. Preencha os campos vazios
3. Clique em **"Atualizar"**
4. Verifique se os dados foram salvos

#### 5.3 OU Corrigir em Massa (Opcional)

Se você quiser preencher dados de exemplo automaticamente:

1. Abra o arquivo `corrigir-empresas-vazias.sql`
2. Descomente a seção de UPDATE (remova os `/*` e `*/`)
3. Execute:
   ```bash
   mysql -u root -p sistema_manutencao < corrigir-empresas-vazias.sql
   ```

**⚠️ ATENÇÃO:** Isso vai preencher dados genéricos. Use apenas para teste!

---

## 🔍 COMO SABER SE ESTÁ FUNCIONANDO

### ✅ Sinais de que está tudo OK:

1. **Ao criar empresa:**
   - Todos os campos aparecem na lista
   - Nenhum "Não informado"
   - Logs mostram dados sendo salvos

2. **Ao editar empresa:**
   - Alterações são salvas
   - Aparecem imediatamente na lista
   - Logs mostram atualização

3. **Testes automatizados:**
   - Taxa de sucesso: 100%
   - Todos os testes passam

### ❌ Sinais de problema:

1. **Campos aparecem como "Não informado":**
   - Verifique logs do servidor
   - Execute `diagnostico-empresas.sql`
   - Veja se dados estão no banco

2. **Erro ao criar/editar:**
   - Verifique console do navegador (F12)
   - Verifique logs do servidor
   - Veja mensagem de erro

3. **Testes falham:**
   - Leia mensagem de erro do teste
   - Verifique logs do servidor
   - Consulte documentação

---

## 📞 PRECISA DE AJUDA?

### Se ainda houver problemas, compartilhe:

1. **Resultado do diagnóstico:**
   ```bash
   mysql -u root -p sistema_manutencao < diagnostico-empresas.sql > resultado-diagnostico.txt
   ```

2. **Resultado dos testes:**
   ```bash
   node test-empresas-api.js > resultado-testes.txt
   ```

3. **Logs do servidor:**
   - Copie os logs do terminal onde o servidor está rodando

4. **Capturas de tela:**
   - Tela mostrando "Não informado"
   - Console do navegador (F12)

---

## 📚 DOCUMENTAÇÃO DISPONÍVEL

- **RESUMO_AUDITORIA_EMPRESAS.md** - Resumo executivo
- **AUDITORIA_EMPRESAS_COMPLETA.md** - Relatório detalhado
- **GUIA_RAPIDO_EMPRESAS.md** - Guia de troubleshooting
- **diagnostico-empresas.sql** - Script de diagnóstico
- **corrigir-empresas-vazias.sql** - Script de correção
- **test-empresas-api.js** - Testes automatizados

---

## ✅ CHECKLIST FINAL

Marque conforme for completando:

- [ ] Executei `diagnostico-empresas.sql`
- [ ] Verifiquei estrutura da tabela
- [ ] Iniciei o servidor (`npm run dev`)
- [ ] Executei testes automatizados
- [ ] Testes passaram 100%
- [ ] Criei empresa de teste manualmente
- [ ] Todos os campos apareceram
- [ ] Editei empresa de teste
- [ ] Alterações foram salvas
- [ ] Verifiquei empresas antigas
- [ ] Corrigi empresas com campos vazios
- [ ] Tudo está funcionando! 🎉

---

## 🎯 RESULTADO ESPERADO

Após seguir todos os passos:

✅ Criar nova empresa → Todos os campos salvos e visíveis  
✅ Editar empresa → Alterações salvas e visíveis  
✅ Listar empresas → Todos os campos exibidos corretamente  
✅ Empresas antigas → Corrigidas ou identificadas  
✅ Logs detalhados → Facilitam diagnóstico  
✅ Testes automatizados → Passam 100%  

---

**Boa sorte! Se precisar de ajuda, consulte a documentação ou compartilhe os logs.** 🚀
