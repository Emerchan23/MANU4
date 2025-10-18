/**
 * Teste das funções de data no formato brasileiro
 * Execute: node test-date-functions.js
 */

const {
  formatDateBR,
  formatDateTimeBR,
  convertBRToISO,
  convertISOToBR,
  isValidBRDate,
  getCurrentDateBR,
  getCurrentDateTimeBR,
  formatForHTMLInput,
  convertHTMLInputToBR
} = require('./lib/date-utils.js');

console.log('=== TESTE DE FUNÇÕES DE DATA BRASILEIRA ===\n');

// Teste 1: Formatar data para brasileiro
console.log('1. formatDateBR()');
console.log('   Data atual:', formatDateBR(new Date()));
console.log('   ISO string:', formatDateBR('2024-01-25'));
console.log('   Date object:', formatDateBR(new Date('2024-01-25')));
console.log('');

// Teste 2: Formatar data e hora
console.log('2. formatDateTimeBR()');
console.log('   Data/hora atual:', formatDateTimeBR(new Date()));
console.log('   ISO string:', formatDateTimeBR('2024-01-25T14:30:00'));
console.log('');

// Teste 3: Converter BR para ISO
console.log('3. convertBRToISO()');
console.log('   25/01/2024 →', convertBRToISO('25/01/2024'));
console.log('   31/12/2023 →', convertBRToISO('31/12/2023'));
console.log('   01/01/2024 →', convertBRToISO('01/01/2024'));
console.log('');

// Teste 4: Converter ISO para BR
console.log('4. convertISOToBR()');
console.log('   2024-01-25 →', convertISOToBR('2024-01-25'));
console.log('   2023-12-31 →', convertISOToBR('2023-12-31'));
console.log('   2024-01-01 →', convertISOToBR('2024-01-01'));
console.log('');

// Teste 5: Validar data brasileira
console.log('5. isValidBRDate()');
console.log('   25/01/2024:', isValidBRDate('25/01/2024') ? '✅ Válida' : '❌ Inválida');
console.log('   31/02/2024:', isValidBRDate('31/02/2024') ? '✅ Válida' : '❌ Inválida');
console.log('   32/01/2024:', isValidBRDate('32/01/2024') ? '✅ Válida' : '❌ Inválida');
console.log('   25/13/2024:', isValidBRDate('25/13/2024') ? '✅ Válida' : '❌ Inválida');
console.log('   29/02/2024:', isValidBRDate('29/02/2024') ? '✅ Válida (ano bissexto)' : '❌ Inválida');
console.log('   29/02/2023:', isValidBRDate('29/02/2023') ? '✅ Válida' : '❌ Inválida (não é bissexto)');
console.log('');

// Teste 6: Data atual
console.log('6. getCurrentDateBR()');
console.log('   Data atual:', getCurrentDateBR());
console.log('');

// Teste 7: Data e hora atual
console.log('7. getCurrentDateTimeBR()');
console.log('   Data/hora atual:', getCurrentDateTimeBR());
console.log('');

// Teste 8: Formatar para input HTML
console.log('8. formatForHTMLInput()');
console.log('   Data atual:', formatForHTMLInput(new Date()));
console.log('   25/01/2024:', formatForHTMLInput('25/01/2024'));
console.log('');

// Teste 9: Converter input HTML para BR
console.log('9. convertHTMLInputToBR()');
console.log('   2024-01-25 →', convertHTMLInputToBR('2024-01-25'));
console.log('   2023-12-31 →', convertHTMLInputToBR('2023-12-31'));
console.log('');

// Teste 10: Ciclo completo de conversão
console.log('10. Ciclo Completo de Conversão');
const dataBR = '25/01/2024';
const dataISO = convertBRToISO(dataBR);
const dataVoltaBR = convertISOToBR(dataISO);
console.log('   Início (BR):', dataBR);
console.log('   Convertido para ISO:', dataISO);
console.log('   Convertido de volta para BR:', dataVoltaBR);
console.log('   Ciclo completo:', dataBR === dataVoltaBR ? '✅ Sucesso' : '❌ Falhou');
console.log('');

// Teste 11: Casos extremos
console.log('11. Casos Extremos');
console.log('   String vazia:', convertBRToISO('') || '(vazio)');
console.log('   null:', formatDateBR(null) || '(vazio)');
console.log('   undefined:', formatDateBR(undefined) || '(vazio)');
console.log('   Data inválida:', formatDateBR('data-invalida') || '(vazio)');
console.log('');

console.log('=== TESTES CONCLUÍDOS ===');
