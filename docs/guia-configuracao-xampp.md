# Guia Completo de Configuração do XAMPP e MySQL

## Status do Sistema

✅ **Servidor Next.js**: Funcionando em http://localhost:3000  
❌ **APIs Backend**: Retornando erro 404  
❌ **MySQL**: Não está no PATH do sistema  
❌ **Conexão com Banco**: Precisa ser configurada  

## 1. Verificar se o XAMPP está Instalado

### Verificação Rápida
```powershell
# Verificar se o XAMPP está instalado
Get-ChildItem "C:\xampp" -ErrorAction SilentlyContinue

# Ou verificar em outros locais comuns
Get-ChildItem "C:\Program Files\xampp" -ErrorAction SilentlyContinue
Get-ChildItem "D:\xampp" -ErrorAction SilentlyContinue
```

### Se o XAMPP não estiver instalado:
1. Baixe em: https://www.apachefriends.org/download.html
2. Execute o instalador como Administrador
3. Instale em `C:\xampp` (recomendado)
4. Marque: Apache, MySQL, PHP, phpMyAdmin

## 2. Adicionar MySQL ao PATH do Windows

### Método 1: Via Interface Gráfica
1. Pressione `Win + R`, digite `sysdm.cpl` e pressione Enter
2. Clique na aba "Avançado"
3. Clique em "Variáveis de Ambiente"
4. Em "Variáveis do sistema", encontre e selecione "Path"
5. Clique em "Editar"
6. Clique em "Novo" e adicione: `C:\xampp\mysql\bin`
7. Clique "OK" em todas as janelas
8. **IMPORTANTE**: Reinicie o PowerShell/Terminal

### Método 2: Via PowerShell (Como Administrador)
```powershell
# Adicionar MySQL ao PATH permanentemente
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$newPath = $currentPath + ";C:\xampp\mysql\bin"
[Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")

# Verificar se foi adicionado
$env:Path -split ';' | Where-Object { $_ -like '*mysql*' }
```

### Método 3: Temporário (apenas para sessão atual)
```powershell
$env:Path += ";C:\xampp\mysql\bin"
```

## 3. Iniciar Serviços do XAMPP

### Via XAMPP Control Panel
1. Execute `C:\xampp\xampp-control.exe` como Administrador
2. Clique em "Start" para Apache
3. Clique em "Start" para MySQL
4. Verifique se ambos ficaram verdes

### Via Linha de Comando
```powershell
# Iniciar Apache
C:\xampp\apache\bin\httpd.exe

# Iniciar MySQL
C:\xampp\mysql\bin\mysqld.exe --defaults-file=C:\xampp\mysql\bin\my.ini
```

## 4. Testar Conexão com MySQL

### Teste 1: Verificar se MySQL está rodando
```powershell
# Verificar processo MySQL
Get-Process mysqld -ErrorAction SilentlyContinue

# Verificar porta 3306
netstat -an | findstr :3306
```

### Teste 2: Conectar via linha de comando
```powershell
# Conectar ao MySQL (após adicionar ao PATH)
mysql -u root -p

# Ou usando caminho completo
C:\xampp\mysql\bin\mysql.exe -u root -p
```

### Teste 3: Verificar bancos existentes
```sql
SHOW DATABASES;
USE sis_manutencao;
SHOW TABLES;
```

## 5. Configurar Banco de Dados do Sistema

### Aplicar Scripts SQL
```powershell
# Navegar para a pasta do banco de dados
cd "C:\Users\skile\OneDrive\Área de Trabalho\MANU 4.0\banco de dados"

# Aplicar scripts na ordem correta
mysql -u root -p < "01-create-database.sql"
mysql -u root -p < "02-seed-initial-data.sql"
mysql -u root -p < "03-create-session-tables.sql"
```

### Verificar se as tabelas foram criadas
```sql
USE sis_manutencao;
SHOW TABLES;
DESCRIBE users;
DESCRIBE user_sessions;
DESCRIBE user_settings;
```

## 6. Resolver Problemas das APIs (Erro 404)

### Problema Identificado
As rotas de API estão retornando 404:
- `POST /api/auth/login 404`
- `GET /@vite/client 404`

### Verificar Estrutura de APIs
```powershell
# Verificar se os arquivos de API existem
Get-ChildItem "api" -Recurse
```

### Estrutura Esperada
```
api/
├── auth.js          # ✅ Existe
├── companies.js     # ✅ Existe  
├── equipment.js     # ✅ Existe
├── notifications.js # ✅ Existe
├── sectors.js       # ✅ Existe
├── service-orders.js# ✅ Existe
└── users.js         # ✅ Existe
```

### Possíveis Soluções
1. **Verificar se o servidor backend está rodando**
2. **Verificar configuração do Next.js para APIs**
3. **Verificar se as rotas estão configuradas corretamente**

## 7. Verificar Configuração do Servidor

### Verificar server.js
```javascript
// Verificar se server.js está configurado para servir APIs
// Deve incluir rotas para /api/*
```

### Verificar next.config.mjs
```javascript
// Verificar se há configuração de rewrites para APIs
```

## 8. Comandos de Diagnóstico

### Verificar Status Completo
```powershell
# Verificar se MySQL está no PATH
mysql --version

# Verificar processos do XAMPP
Get-Process | Where-Object { $_.Name -like '*apache*' -or $_.Name -like '*mysql*' }

# Verificar portas em uso
netstat -an | findstr "3000\|3306\|80"

# Testar conexão com banco
mysql -u root -p -e "SELECT 'Conexão OK' as status;"
```

### Script de Verificação Automática
```powershell
# Criar script de verificação
$scriptPath = "verificar-sistema.ps1"
@'
# Verificação Automática do Sistema
Write-Host "=== Verificação do Sistema MANU 4.0 ===" -ForegroundColor Green

# 1. Verificar MySQL no PATH
try {
    $mysqlVersion = mysql --version
    Write-Host "✅ MySQL encontrado: $mysqlVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ MySQL não encontrado no PATH" -ForegroundColor Red
}

# 2. Verificar processos XAMPP
$apache = Get-Process httpd -ErrorAction SilentlyContinue
$mysql = Get-Process mysqld -ErrorAction SilentlyContinue

if ($apache) { Write-Host "✅ Apache rodando" -ForegroundColor Green }
else { Write-Host "❌ Apache não está rodando" -ForegroundColor Red }

if ($mysql) { Write-Host "✅ MySQL rodando" -ForegroundColor Green }
else { Write-Host "❌ MySQL não está rodando" -ForegroundColor Red }

# 3. Verificar portas
$port3000 = netstat -an | findstr :3000
$port3306 = netstat -an | findstr :3306

if ($port3000) { Write-Host "✅ Porta 3000 em uso (Next.js)" -ForegroundColor Green }
else { Write-Host "❌ Porta 3000 livre" -ForegroundColor Red }

if ($port3306) { Write-Host "✅ Porta 3306 em uso (MySQL)" -ForegroundColor Green }
else { Write-Host "❌ Porta 3306 livre" -ForegroundColor Red }

Write-Host "\n=== Fim da Verificação ===" -ForegroundColor Green
'@ | Out-File -FilePath $scriptPath -Encoding UTF8

Write-Host "Script criado: $scriptPath"
Write-Host "Execute com: .\verificar-sistema.ps1"
```

## 9. Solução de Problemas Comuns

### Erro: "mysql não é reconhecido"
```powershell
# Solução temporária
$env:Path += ";C:\xampp\mysql\bin"

# Verificar
mysql --version
```

### Erro: "Access denied for user 'root'"
```powershell
# Resetar senha do MySQL
C:\xampp\mysql\bin\mysqladmin.exe -u root password "nova_senha"

# Ou conectar sem senha (padrão XAMPP)
mysql -u root
```

### Erro: "Can't connect to MySQL server"
1. Verificar se MySQL está rodando no XAMPP Control Panel
2. Verificar se a porta 3306 não está bloqueada
3. Reiniciar o serviço MySQL

### APIs retornando 404
1. Verificar se server.js está configurado corretamente
2. Verificar se as rotas estão mapeadas
3. Reiniciar o servidor Next.js

## 10. Próximos Passos

1. ✅ Adicionar MySQL ao PATH
2. ✅ Iniciar serviços XAMPP
3. ✅ Testar conexão com banco
4. ✅ Aplicar scripts SQL
5. 🔄 Corrigir rotas de API
6. 🔄 Testar funcionalidades do sistema

---

**Nota**: Após fazer alterações no PATH, sempre reinicie o terminal/PowerShell para que as mudanças tenham efeito.

**Suporte**: Se encontrar problemas, verifique os logs em:
- XAMPP: `C:\xampp\apache\logs\error.log`
- MySQL: `C:\xampp\mysql\data\*.err`
- Next.js: Console do terminal onde está rodando `pnpm dev`