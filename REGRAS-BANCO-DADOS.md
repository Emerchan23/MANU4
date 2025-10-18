# 🚫 REGRAS OBRIGATÓRIAS - BANCO DE DADOS

## ⚠️ PROIBIÇÃO ABSOLUTA

**É ESTRITAMENTE PROIBIDO armazenar qualquer arquivo de banco de dados dentro da pasta `sis manu`**

### 🔒 REGRAS FUNDAMENTAIS

1. **LOCALIZAÇÃO OBRIGATÓRIA**: O banco de dados DEVE estar na pasta externa `banco de dados/`
2. **SEPARAÇÃO TOTAL**: Código e dados devem estar completamente separados
3. **VERIFICAÇÃO AUTOMÁTICA**: O sistema verifica automaticamente esta regra na inicialização
4. **FALHA IMEDIATA**: Qualquer violação resulta em erro crítico e parada do sistema

### ❌ O QUE É PROIBIDO

- Arquivos `.db`, `.sqlite`, `.sqlite3` na pasta do projeto
- Pastas `database/`, `db/`, `data/` dentro de `sis manu/`
- Arquivos `.mdb`, `.accdb` no código fonte
- Backups de banco (`.sql.backup`, `.dump`, `.bak`) no projeto
- Logs de banco (`mysql.log`, `mariadb.log`) no diretório do sistema

### ✅ CONFIGURAÇÃO CORRETA

```
MANU 4.0/
├── sis manu/          ← Código do sistema (SEM banco de dados)
│   ├── pages/
│   ├── components/
│   ├── lib/
│   └── ...
└── banco de dados/    ← Banco de dados (FORA do código)
    ├── 01-create-database.sql
    ├── 02-seed-initial-data.sql
    └── complete-database-schema.sql
```

### 🔧 CONFIGURAÇÃO NO .env

```bash
# OBRIGATÓRIO: Banco DEVE estar fora da pasta sis manu
DB_DATA_PATH=../banco de dados
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=hospital_maintenance
```

### 🔍 VERIFICAÇÃO AUTOMÁTICA

O sistema possui verificações automáticas que:

1. **Verificam na inicialização** se `DB_DATA_PATH` aponta para fora da pasta `sis manu`
2. **Impedem a execução** se o banco estiver configurado incorretamente
3. **Alertam** sobre violações das regras
4. **Validam** a existência da pasta externa

### 🛠️ COMANDOS DE VERIFICAÇÃO

```bash
# Verificar configuração do banco
pnpm verificar-banco
# ou
pnpm check-db
```

### 🚨 CONSEQUÊNCIAS DE VIOLAÇÃO

- **Erro crítico** na inicialização do sistema
- **Falha** nos testes automatizados
- **Bloqueio** do Git (arquivos ignorados)
- **Impossibilidade** de executar o sistema

### 📞 SUPORTE

Se você encontrar problemas:

1. Execute `pnpm verificar-banco` para diagnóstico
2. Verifique se `DB_DATA_PATH=../banco de dados` no `.env`
3. Confirme que a pasta `banco de dados/` existe fora de `sis manu/`
4. Remova qualquer arquivo de banco da pasta do projeto

---

**⚠️ ESTA REGRA É INVIOLÁVEL E DEVE SER RESPEITADA POR TODOS OS DESENVOLVEDORES ⚠️**