# 🚀 Início Rápido - Formato de Data Brasileiro

## ✅ O que foi feito?

Todas as datas no **RODA SISTEMA** agora usam o formato brasileiro: **dd/mm/aaaa HH:mm:ss**

---

## 📋 Passos para Usar

### 1️⃣ Executar Setup (apenas uma vez)
```bash
node scripts/setup-roda-sistema.cjs
```

### 2️⃣ Iniciar Aplicação
```bash
npm run dev
```

### 3️⃣ Acessar Sistema
```
http://localhost:3000/roda-sistema
```

---

## 💡 Como Usar em Outros Componentes

### Importar Funções
```typescript
import { 
  formatDateBR,        // 08/10/2025
  formatDateTimeBR,    // 08/10/2025 12:44:26
  formatTimeBR,        // 12:44:26
  getCurrentDateTimeBR // Data/hora atual
} from '@/lib/date-utils';
```

### Usar no Código
```typescript
// Formatar data
const data = formatDateBR(new Date());

// Formatar data e hora
const dataHora = formatDateTimeBR(new Date());

// Obter data/hora atual
const agora = getCurrentDateTimeBR();
```

---

## 🗄️ Banco de Dados

### Timezone Configurado
```
America/Sao_Paulo (UTC-3)
```

### Funções Disponíveis
```sql
-- Formatar data e hora
SELECT format_date_br(NOW());
-- Resultado: 08/10/2025 12:44:26

-- Formatar apenas data
SELECT format_date_only_br(CURDATE());
-- Resultado: 08/10/2025
```

---

## ✅ Pronto!

Todas as datas agora aparecem no formato brasileiro automaticamente.

**Documentação completa:** `FORMATO_DATA_BRASILEIRO.md`
