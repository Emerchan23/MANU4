# 📅 Formato de Data Brasileiro - RODA SISTEMA

## ✅ Alterações Implementadas

Todas as datas no sistema RODA SISTEMA agora utilizam o **formato brasileiro (dd/mm/aaaa HH:mm:ss)**.

---

## 📋 Arquivos Criados/Modificados

### 1. **lib/date-utils.ts** ✨ NOVO
Biblioteca completa de utilitários para formatação de datas em padrão brasileiro.

**Funções principais:**
- `formatDateBR(date)` - Formata data como dd/mm/aaaa
- `formatDateTimeBR(date)` - Formata data e hora como dd/mm/aaaa HH:mm:ss
- `formatTimeBR(date)` - Formata apenas hora como HH:mm:ss
- `parseDateBR(dateStr)` - Converte string dd/mm/aaaa para Date
- `parseDateTimeBR(dateTimeStr)` - Converte string dd/mm/aaaa HH:mm:ss para Date
- `formatDateForInput(date)` - Formata para input HTML (yyyy-mm-dd)
- `formatDateForMySQL(date)` - Formata para MySQL (yyyy-mm-dd HH:mm:ss)
- `getCurrentDateBR()` - Retorna data atual em formato brasileiro
- `getCurrentDateTimeBR()` - Retorna data/hora atual em formato brasileiro
- `isValidDateBR(dateStr)` - Valida formato dd/mm/aaaa
- `diffInDays(date1, date2)` - Calcula diferença em dias
- `formatRelativeDateBR(date)` - Formata data relativa ("há 2 horas", "ontem")

### 2. **lib/db.ts** 🔧 MODIFICADO
Configuração do banco de dados atualizada:
```typescript
timezone: '-03:00', // Timezone de Brasília (America/Sao_Paulo - UTC-3)
```

### 3. **components/roda-sistema/wheel-control.tsx** 🔧 MODIFICADO
Componente atualizado para usar formatação brasileira:
```typescript
import { formatDateTimeBR, formatTimeBR } from '@/lib/date-utils';

// Exibição de data
Última atualização: {formatTimeBR(wheelState.lastUpdated)} - {formatDateTimeBR(wheelState.lastUpdated)}
```

### 4. **app/(dashboard)/roda-sistema/page.tsx** 🔧 MODIFICADO
Página principal atualizada:
```typescript
import { getCurrentDateTimeBR } from '@/lib/date-utils';

// Exibição de data
{getCurrentDateTimeBR()}
```

### 5. **app/api/roda-sistema/route.ts** 🔧 MODIFICADO
API atualizada para retornar datas formatadas:
```typescript
import { formatDateTimeBR } from '@/lib/date-utils';

function formatWheelData(wheel: any) {
  return {
    ...wheel,
    created_at: formatDateTimeBR(wheel.created_at),
    updated_at: formatDateTimeBR(wheel.updated_at),
  };
}
```

### 6. **app/api/roda-sistema/logs/route.ts** 🔧 MODIFICADO
API de logs atualizada:
```typescript
import { formatDateTimeBR } from '@/lib/date-utils';

function formatLogData(log: any) {
  return {
    ...log,
    timestamp: formatDateTimeBR(log.timestamp),
  };
}
```

### 7. **scripts/create-roda-sistema-tables.sql** 🔧 MODIFICADO
Script SQL atualizado com:
- Configuração de timezone: `SET time_zone = '-03:00';`
- Funções MySQL para formatação brasileira:
  - `format_date_br(input_date)` - Retorna dd/mm/aaaa HH:mm:ss
  - `format_date_only_br(input_date)` - Retorna dd/mm/aaaa

### 8. **scripts/setup-roda-sistema.cjs** 🔧 MODIFICADO
Script de setup atualizado com:
- Configuração de timezone na conexão
- Criação de funções de formatação
- Teste de formatação de data

---

## 🗄️ Banco de Dados

### Configuração de Timezone
```sql
SET time_zone = '-03:00'; -- America/Sao_Paulo (UTC-3)
```

### Funções MySQL Criadas

#### 1. format_date_br
```sql
CREATE FUNCTION format_date_br(input_date DATETIME)
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
  RETURN DATE_FORMAT(input_date, '%d/%m/%Y %H:%i:%s');
END
```

**Uso:**
```sql
SELECT format_date_br(NOW()); -- Retorna: 08/10/2025 12:44:26
```

#### 2. format_date_only_br
```sql
CREATE FUNCTION format_date_only_br(input_date DATE)
RETURNS VARCHAR(10)
DETERMINISTIC
BEGIN
  RETURN DATE_FORMAT(input_date, '%d/%m/%Y');
END
```

**Uso:**
```sql
SELECT format_date_only_br(CURDATE()); -- Retorna: 08/10/2025
```

### Estrutura de Armazenamento
- **Tipo de coluna:** `TIMESTAMP`
- **Armazenamento:** UTC no banco de dados
- **Exibição:** Convertido para UTC-3 (Brasília) e formatado como dd/mm/aaaa HH:mm:ss

---

## 🚀 Como Usar

### No Frontend (React/TypeScript)

```typescript
import { 
  formatDateBR, 
  formatDateTimeBR, 
  formatTimeBR,
  getCurrentDateTimeBR,
  parseDateBR 
} from '@/lib/date-utils';

// Formatar data
const dataFormatada = formatDateBR(new Date()); // "08/10/2025"

// Formatar data e hora
const dataHoraFormatada = formatDateTimeBR(new Date()); // "08/10/2025 12:44:26"

// Formatar apenas hora
const horaFormatada = formatTimeBR(new Date()); // "12:44:26"

// Obter data/hora atual
const agora = getCurrentDateTimeBR(); // "08/10/2025 12:44:26"

// Converter string para Date
const data = parseDateBR("08/10/2025"); // Date object
```

### No Backend (API Routes)

```typescript
import { formatDateTimeBR } from '@/lib/date-utils';

// Formatar dados antes de retornar
const formattedData = {
  ...data,
  created_at: formatDateTimeBR(data.created_at),
  updated_at: formatDateTimeBR(data.updated_at),
};

return NextResponse.json(formattedData);
```

### No Banco de Dados (SQL)

```sql
-- Usar função de formatação
SELECT 
  id,
  name,
  format_date_br(created_at) as data_criacao,
  format_date_br(updated_at) as data_atualizacao
FROM wheel_states;

-- Resultado:
-- data_criacao: 08/10/2025 12:44:26
-- data_atualizacao: 08/10/2025 12:44:26
```

---

## 📊 Exemplos de Exibição

### Antes (Formato Americano)
```
Created: 2025-10-08T12:44:26.000Z
Updated: 10/8/2025, 12:44:26 PM
```

### Depois (Formato Brasileiro)
```
Criado em: 08/10/2025 12:44:26
Atualizado em: 08/10/2025 12:44:26
```

---

## 🔧 Configuração do Ambiente

### Arquivo .env
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=hospital_maintenance
```

### Conexão do Banco
```typescript
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  charset: 'utf8mb4',
  timezone: '-03:00', // ⭐ Timezone de Brasília
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
```

---

## ✅ Verificação

### 1. Executar Setup
```bash
node scripts/setup-roda-sistema.cjs
```

**Saída esperada:**
```
✅ Timezone configurado para America/Sao_Paulo (UTC-3)
✅ Funções de formatação criadas
🧪 Testando formatação de data...
   Data formatada BR: 08/10/2025 12:44:26
```

### 2. Testar no Banco
```sql
-- Verificar timezone
SELECT @@session.time_zone;
-- Resultado: -03:00

-- Testar formatação
SELECT format_date_br(NOW());
-- Resultado: 08/10/2025 12:44:26
```

### 3. Testar na Aplicação
1. Acesse `/roda-sistema`
2. Verifique a exibição de datas
3. Todas devem estar no formato dd/mm/aaaa HH:mm:ss

---

## 📝 Notas Importantes

### Armazenamento vs Exibição
- **Armazenamento:** Datas são armazenadas como TIMESTAMP no banco (UTC)
- **Exibição:** Datas são convertidas para UTC-3 e formatadas como dd/mm/aaaa HH:mm:ss
- **Vantagem:** Permite suporte a múltiplos timezones no futuro

### Compatibilidade
- ✅ Compatível com MySQL/MariaDB
- ✅ Compatível com inputs HTML (conversão automática)
- ✅ Compatível com APIs REST (JSON)
- ✅ Compatível com exportação PDF

### Performance
- Formatação feita na camada de aplicação (não no banco)
- Funções MySQL disponíveis para queries específicas
- Cache de conexões com pool

---

## 🎯 Próximos Passos

Para aplicar o formato brasileiro em **todo o sistema** (não apenas RODA SISTEMA):

1. **Importar utilitários em outros componentes:**
```typescript
import { formatDateTimeBR } from '@/lib/date-utils';
```

2. **Atualizar APIs existentes:**
```typescript
// Em cada API route
import { formatDateTimeBR } from '@/lib/date-utils';

// Formatar antes de retornar
const formatted = data.map(item => ({
  ...item,
  created_at: formatDateTimeBR(item.created_at),
  updated_at: formatDateTimeBR(item.updated_at),
}));
```

3. **Atualizar componentes existentes:**
```typescript
// Substituir
{new Date(data.created_at).toLocaleString()}

// Por
{formatDateTimeBR(data.created_at)}
```

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique se o timezone está configurado: `SELECT @@session.time_zone;`
2. Teste as funções de formatação: `SELECT format_date_br(NOW());`
3. Verifique os logs da aplicação
4. Consulte a documentação em `lib/date-utils.ts`

---

**Status:** ✅ Implementado e Testado  
**Data:** 08/10/2025  
**Formato:** dd/mm/aaaa HH:mm:ss (Padrão Brasileiro)
