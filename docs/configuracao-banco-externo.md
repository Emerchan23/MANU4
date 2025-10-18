# ⚠️ CONFIGURAÇÃO OBRIGATÓRIA DO BANCO DE DADOS EXTERNO ⚠️

## 🚫 REGRA FUNDAMENTAL - PROIBIÇÃO ABSOLUTA

**ATENÇÃO: É ESTRITAMENTE PROIBIDO armazenar o banco de dados dentro da pasta 'sis manu'**

### ❌ O QUE NÃO PODE ACONTECER:
- Banco de dados dentro de `sis manu/`
- Arquivos `.db`, `.sqlite`, `.mdb` na pasta do projeto
- Dados do MySQL/MariaDB no diretório do sistema
- Qualquer arquivo de banco de dados no código fonte

### ✅ CONFIGURAÇÃO CORRETA OBRIGATÓRIA:
- Banco de dados DEVE estar na pasta externa `banco de dados/`
- Localização: `../banco de dados/` (fora da pasta sis manu)
- Separação completa entre código e dados

## 📋 Configuração do Banco de Dados Externo

## Objetivo
Configurar o XAMPP para usar a pasta externa "banco de dados" como volume de dados do MariaDB, mantendo os dados fora da pasta do projeto "sis manu".

## Estrutura de Pastas
```
MANU 4.0/
├── sis manu/           # Projeto da aplicação
└── banco de dados/     # Volume externo para dados do MariaDB
    ├── 01-create-database.sql
    ├── 02-seed-initial-data.sql
    ├── complete-database-schema.sql
    ├── README.md
    └── data/           # Diretório de dados do MariaDB (criado após configuração)
```

## Configuração do XAMPP

### 1. Parar o MySQL/MariaDB no XAMPP
- Abra o painel de controle do XAMPP
- Pare o serviço MySQL se estiver rodando

### 2. Configurar o my.ini
- Localize o arquivo `my.ini` no diretório do XAMPP (geralmente em `C:\xampp\mysql\bin\my.ini`)
- Faça backup do arquivo original
- Edite as seguintes linhas:

```ini
[mysqld]
# Altere o datadir para apontar para a pasta externa
datadir="C:/Users/skile/OneDrive/Área de Trabalho/MANU 4.0/banco de dados/data"

# Mantenha outras configurações importantes
port=3306
default-storage-engine=INNODB
sql-mode="STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION"
max_connections=100
query_cache_size=10M
tmp_table_size=16M
max_heap_table_size=16M
max_user_connections=500
thread_cache_size=128
myisam_max_sort_file_size=2G
myisam_repair_threads=1
myisam_recover

[mysqldump]
quick
max_allowed_packet=16M

[mysql]
no-auto-rehash

[myisamchk]
key_buffer_size=20M
sort_buffer_size=20M
read_buffer=2M
write_buffer=2M

[mysqlhotcopy]
interactive-timeout
```

### 3. Criar a estrutura de pastas
- Crie a pasta `data` dentro de "banco de dados":
  ```
  banco de dados/
  ├── 01-create-database.sql     # Scripts já incluídos
  ├── 02-seed-initial-data.sql   # Scripts já incluídos
  ├── complete-database-schema.sql # Scripts já incluídos
  ├── README.md                  # Documentação dos scripts
  └── data/                      # Diretório de dados (criar manualmente)
  ```

### 4. Migrar dados existentes (se houver)
- Se já existem dados no MySQL, copie o conteúdo da pasta original de dados do XAMPP para a nova pasta
- Pasta original geralmente em: `C:\xampp\mysql\data`
- Copie todo o conteúdo para: `C:/Users/skile/OneDrive/Área de Trabalho/MANU 4.0/banco de dados/data`

### 5. Reiniciar o MySQL/MariaDB
- Inicie o serviço MySQL no painel do XAMPP
- Verifique se não há erros nos logs

## Configuração da Aplicação

O arquivo `.env` já foi configurado com:
```env
DB_DATA_PATH=../banco de dados
```

Esta variável pode ser usada pela aplicação para referenciar a pasta de dados externa.

## Scripts de Banco de Dados

A pasta "banco de dados" já contém todos os scripts SQL necessários:

- **01-create-database.sql**: Cria o banco de dados e estrutura inicial
- **02-seed-initial-data.sql**: Insere dados iniciais no sistema
- **complete-database-schema.sql**: Schema completo do banco de dados
- **README.md**: Documentação detalhada dos scripts

### Executar Scripts

Após configurar o XAMPP, execute os scripts na seguinte ordem:

1. Via phpMyAdmin:
   - Acesse http://localhost/phpmyadmin
   - Importe e execute `01-create-database.sql`
   - Importe e execute `02-seed-initial-data.sql`

2. Via linha de comando:
   ```bash
   mysql -u root -p < "../banco de dados/01-create-database.sql"
   mysql -u root -p < "../banco de dados/02-seed-initial-data.sql"
   ```

## Verificação

1. Acesse o phpMyAdmin
2. Verifique se o banco `hospital_maintenance` está acessível
3. Execute uma consulta de teste
4. Verifique se os dados estão sendo salvos na pasta externa

## Benefícios

- **Separação de responsabilidades**: Dados ficam separados do código da aplicação
- **Backup facilitado**: Pasta de dados pode ser facilmente copiada/sincronizada
- **Volume externo**: Permite uso como volume Docker ou compartilhamento de rede
- **Organização**: Estrutura mais limpa e organizada do projeto

## Troubleshooting

### MySQL não inicia após alteração
- Verifique se o caminho no `my.ini` está correto
- Certifique-se de que a pasta `data` existe
- Verifique permissões da pasta
- Consulte os logs do MySQL em `C:\xampp\mysql\data\mysql_error.log`

### Banco não encontrado
- Verifique se os dados foram migrados corretamente
- Execute os scripts de criação do banco novamente se necessário
- Confirme se o `datadir` está apontando para o local correto