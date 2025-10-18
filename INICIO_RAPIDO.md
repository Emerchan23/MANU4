# 🚀 INÍCIO RÁPIDO - Sistema de Manutenção

## ⚡ 3 Passos para Começar

### 1️⃣ Verificar Banco de Dados
```bash
node quick-verify.cjs
```
✅ Deve mostrar todas as tabelas e suas estruturas

### 2️⃣ Iniciar Servidor
```bash
npm run dev
```
✅ Aguarde a mensagem: "Ready in X.Xs"

### 3️⃣ Acessar Sistema
Abra o navegador em: **http://localhost:3000**

---

## 📋 Documentação Disponível

| Arquivo | Descrição |
|---------|-----------|
| **RESUMO_EXECUTIVO.md** | 📊 Visão geral completa |
| **GUIA_TESTES_MANUAIS.md** | 🧪 Passo a passo de testes |
| **RESULTADO_VERIFICACAO_BANCO.md** | 🔍 Estrutura do banco |
| **RELATORIO_CORRECOES.md** | 📝 Detalhes das correções |

---

## ✅ O Que Foi Corrigido

- ✅ Formatação brasileira de datas (dd/mm/yyyy)
- ✅ Formatação brasileira de valores (R$ X.XXX,XX)
- ✅ Integração com setores e subsectores
- ✅ Geração de PDF para agendamentos
- ✅ Correção de imports nas APIs

---

## 🧪 Testes Rápidos

### Testar API de Ordem de Serviço
```bash
curl "http://localhost:3000/api/service-orders?page=1&limit=5"
```

### Testar Verificação do Banco
```bash
node quick-verify.cjs
```

### Testar APIs Automaticamente
```bash
node test-apis.cjs
```

---

## 📄 Páginas Principais

- **Home:** http://localhost:3000
- **Ordens de Serviço:** http://localhost:3000/service-orders
- **Agendamentos:** http://localhost:3000/maintenance-schedules
- **Equipamentos:** http://localhost:3000/equipment
- **Empresas:** http://localhost:3000/companies

---

## 🎯 Próximo Passo

👉 **Abra o `GUIA_TESTES_MANUAIS.md` e siga o passo a passo!**

---

## ❓ Problemas?

1. **Servidor não inicia?**
   - Verifique se a porta 3000 está livre
   - Execute: `npm install` para instalar dependências

2. **Banco não conecta?**
   - Verifique se o XAMPP está rodando
   - Confirme as credenciais no arquivo `.env`

3. **Erro ao gerar PDF?**
   - Verifique se os dados estão corretos
   - Consulte o console do navegador (F12)

---

**✅ Sistema Pronto para Uso!**

**Data:** ${new Date().toLocaleDateString('pt-BR')}
