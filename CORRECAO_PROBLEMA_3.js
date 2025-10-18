// Script para corrigir o problema de formatação de datas na API de manutenção preventiva
// 
// PROBLEMA: A API está formatando as datas para DD/MM/AAAA antes de enviar para o frontend,
// mas o frontend espera receber datas em formato ISO para processá-las corretamente.
//
// SOLUÇÃO: Remover a formatação de datas nas linhas 142-161 do arquivo
// app/api/preventive-maintenance/route.ts
//
// SUBSTITUIR:
//
//     // Formatar datas para o padrão brasileiro
//     const formattedListRows = (listRows as any[]).map(row => ({
//       ...row,
//       scheduled_date: formatDateBR(row.scheduled_date),
//       completion_date: formatDateBR(row.completion_date),
//       created_at: formatDateTimeBR(row.created_at),
//       updated_at: formatDateTimeBR(row.updated_at)
//     }))
//
//     const formattedUpcoming = (upcoming as any[]).map(row => ({
//       ...row,
//       scheduled_date: formatDateBR(row.scheduled_date),
//       created_at: formatDateTimeBR(row.created_at)
//     }))
//
//     const formattedOverdue = (overdueList as any[]).map(row => ({
//       ...row,
//       scheduled_date: formatDateBR(row.scheduled_date),
//       created_at: formatDateTimeBR(row.created_at)
//     }))
//
// POR:
//
//     // Não formatar datas - enviar em formato ISO para o frontend processar
//     const formattedListRows = listRows as any[]
//     const formattedUpcoming = upcoming as any[]
//     const formattedOverdue = overdueList as any[]

console.log('Para corrigir o problema 3 (Manutenção Preventiva - Data Inválida):')
console.log('1. Abra o arquivo: app/api/preventive-maintenance/route.ts')
console.log('2. Localize as linhas 142-161')
console.log('3. Remova a formatação de datas conforme indicado acima')
console.log('4. Salve o arquivo')
console.log('5. O servidor Next.js irá recarregar automaticamente')
