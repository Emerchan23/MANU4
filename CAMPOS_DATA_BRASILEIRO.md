# Campos de Data - Formato Brasileiro (DD/MM/AAAA)

Este projeto utiliza o formato brasileiro de data (DD/MM/AAAA) em todos os campos de entrada de data.

## Componente DateInput

O componente `DateInput` foi desenvolvido para fornecer uma experiência de usuário otimizada com:

- ✅ **Formato Brasileiro**: DD/MM/AAAA
- ✅ **Máscara Automática**: Adiciona "/" automaticamente enquanto o usuário digita
- ✅ **Validação em Tempo Real**: Valida a data enquanto o usuário digita
- ✅ **Conversão Automática**: Converte entre formato brasileiro e ISO internamente
- ✅ **Placeholder Intuitivo**: "dd/mm/aaaa"

## Como Usar

### Importação

```tsx
import { DateInput } from "@/components/ui/date-input"
```

### Uso Básico

```tsx
import { useState } from 'react'
import { DateInput } from "@/components/ui/date-input"
import { Label } from "@/components/ui/label"

function MeuFormulario() {
  const [data, setData] = useState('')

  return (
    <div className="space-y-2">
      <Label htmlFor="data">Data</Label>
      <DateInput
        id="data"
        value={data}
        onChange={(value) => setData(value)}
        placeholder="dd/mm/aaaa"
      />
    </div>
  )
}
```

### Com Validação Obrigatória

```tsx
<DateInput
  id="dataLimite"
  value={formData.dataLimite}
  onChange={(value) => setFormData({ ...formData, dataLimite: value })}
  required
/>
```

### Com Classe Customizada

```tsx
<DateInput
  id="dataNascimento"
  value={dataNascimento}
  onChange={setDataNascimento}
  className="w-full"
  placeholder="dd/mm/aaaa"
/>
```

## Funções Utilitárias de Data

O projeto inclui diversas funções utilitárias para trabalhar com datas no formato brasileiro:

### Importação

```tsx
import {
  formatDateBR,
  formatDateTimeBR,
  convertBRToISO,
  convertISOToBR,
  formatForHTMLInput,
  convertHTMLInputToBR,
  isValidBRDate,
  parseDateBR,
  getCurrentDateBR,
  getCurrentDateTimeBR
} from '@/lib/date-utils'
```

### Funções Disponíveis

#### `formatDateBR(date)`
Formata uma data para o padrão brasileiro DD/MM/AAAA

```tsx
formatDateBR(new Date()) // "25/01/2024"
formatDateBR("2024-01-25") // "25/01/2024"
```

#### `formatDateTimeBR(date)`
Formata uma data e hora para o padrão brasileiro DD/MM/AAAA HH:mm:ss

```tsx
formatDateTimeBR(new Date()) // "25/01/2024 14:30:00"
```

#### `convertBRToISO(dateBR)`
Converte data do formato brasileiro para ISO (YYYY-MM-DD)

```tsx
convertBRToISO("25/01/2024") // "2024-01-25"
```

#### `convertISOToBR(dateISO)`
Converte data do formato ISO para brasileiro

```tsx
convertISOToBR("2024-01-25") // "25/01/2024"
```

#### `isValidBRDate(dateStr)`
Valida se uma string está no formato brasileiro válido

```tsx
isValidBRDate("25/01/2024") // true
isValidBRDate("32/01/2024") // false
isValidBRDate("25-01-2024") // false
```

#### `parseDateBR(dateStr)`
Converte string no formato DD/MM/AAAA para objeto Date

```tsx
parseDateBR("25/01/2024") // Date object
```

#### `getCurrentDateBR()`
Retorna a data atual formatada em padrão brasileiro

```tsx
getCurrentDateBR() // "25/01/2024"
```

#### `getCurrentDateTimeBR()`
Retorna a data e hora atual formatada em padrão brasileiro

```tsx
getCurrentDateTimeBR() // "25/01/2024 14:30:00"
```

## Comportamento do Campo

### Digitação
- O usuário digita apenas números
- A máscara adiciona "/" automaticamente: `25012024` → `25/01/2024`
- Limite de 10 caracteres (DD/MM/AAAA)

### Validação
- Valida dia (1-31), mês (1-12) e ano (1900-2100)
- Verifica se a data é válida (ex: 31/02/2024 é inválido)
- Limpa o campo se a data for inválida ao sair do campo (blur)

### Conversão Automática
- **Entrada**: Aceita formato brasileiro (DD/MM/AAAA) ou ISO (YYYY-MM-DD)
- **Saída**: Sempre retorna formato ISO (YYYY-MM-DD) no onChange
- **Display**: Sempre mostra formato brasileiro (DD/MM/AAAA)

## Exemplos de Uso no Projeto

### Formulário de Ordem de Serviço

```tsx
<div className="space-y-2">
  <Label htmlFor="dueDate">Data Limite *</Label>
  <DateInput
    id="dueDate"
    placeholder="dd/mm/aaaa"
    value={formData.dueDate}
    onChange={(value) => setFormData((prev) => ({ ...prev, dueDate: value }))}
    required
  />
</div>
```

### Formulário de Manutenção Preventiva

```tsx
<div className="space-y-2">
  <Label htmlFor="scheduledDate">Data Agendada *</Label>
  <DateInput
    id="scheduledDate"
    value={formData.scheduledDate}
    onChange={(value) => setFormData({ ...formData, scheduledDate: value })}
    required
  />
</div>
```

### Filtros de Data

```tsx
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label htmlFor="startDate">Data Inicial</Label>
    <DateInput
      id="startDate"
      value={filters.startDate}
      onChange={(value) => setFilters({ ...filters, startDate: value })}
    />
  </div>
  <div className="space-y-2">
    <Label htmlFor="endDate">Data Final</Label>
    <DateInput
      id="endDate"
      value={filters.endDate}
      onChange={(value) => setFilters({ ...filters, endDate: value })}
    />
  </div>
</div>
```

## Integração com API

Ao enviar dados para a API, o componente já converte automaticamente para o formato ISO:

```tsx
// O usuário vê: 25/01/2024
// O onChange recebe: "2024-01-25"
// Pronto para enviar para a API

const handleSubmit = async () => {
  const response = await fetch('/api/service-orders', {
    method: 'POST',
    body: JSON.stringify({
      dueDate: formData.dueDate, // Já está em formato ISO
      // ... outros campos
    })
  })
}
```

## Integração com Banco de Dados

As datas são armazenadas no formato ISO no banco de dados e convertidas automaticamente:

```tsx
// Ao carregar do banco
const data = await fetchData()
setFormData({
  dueDate: data.due_date // "2024-01-25" será exibido como "25/01/2024"
})

// Ao salvar no banco
await saveData({
  due_date: formData.dueDate // "2024-01-25" (formato ISO)
})
```

## Estilização

O componente herda os estilos do componente `Input` base e pode ser customizado:

```tsx
<DateInput
  className="w-full border-blue-500 focus:ring-blue-500"
  value={data}
  onChange={setData}
/>
```

## Acessibilidade

- ✅ Suporta `ref` para integração com formulários
- ✅ Suporta todos os atributos HTML padrão de input
- ✅ Placeholder descritivo
- ✅ Labels associados via `htmlFor`
- ✅ Validação com `required`

## Notas Importantes

1. **Formato de Armazenamento**: Sempre use formato ISO (YYYY-MM-DD) para armazenar no banco de dados
2. **Formato de Exibição**: Sempre use formato brasileiro (DD/MM/AAAA) para exibir ao usuário
3. **Conversão Automática**: O componente faz a conversão automaticamente
4. **Validação**: A validação é feita em tempo real e ao sair do campo

## Migração de Campos Existentes

Se você tem campos usando `type="date"` nativo do HTML, substitua por:

### Antes
```tsx
<input
  type="date"
  value={data}
  onChange={(e) => setData(e.target.value)}
/>
```

### Depois
```tsx
<DateInput
  value={data}
  onChange={(value) => setData(value)}
/>
```

## Suporte

Para dúvidas ou problemas, consulte:
- Arquivo: `components/ui/date-input.tsx`
- Utilitários: `lib/date-utils.ts` ou `lib/date-utils.js`
