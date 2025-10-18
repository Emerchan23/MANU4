const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\Adm\\Desktop\\App Manutenção\\sis manu\\app\\api\\pdf\\new-download\\[id]\\route.ts';

// Ler o arquivo
let content = fs.readFileSync(filePath, 'utf8');

// Função para corrigir chamadas doc.rect que não usam Number()
function fixRectCalls(content) {
  // Regex para encontrar chamadas doc.rect que não começam com Number(
  const rectRegex = /doc\.rect\(([^)]+)\)/g;
  
  return content.replace(rectRegex, (match, params) => {
    // Se já tem Number() no início, não alterar
    if (params.trim().startsWith('Number(')) {
      return match;
    }
    
    // Dividir os parâmetros
    const paramList = params.split(',').map(p => p.trim());
    
    // Aplicar Number() apenas nos primeiros 4 parâmetros (x, y, width, height)
    const fixedParams = paramList.map((param, index) => {
      if (index < 4) {
        // Se é um número literal simples, não precisa de Number()
        if (/^\d+(\.\d+)?$/.test(param)) {
          return param;
        }
        // Se já tem Number(), não alterar
        if (param.startsWith('Number(')) {
          return param;
        }
        // Aplicar Number() para expressões
        return `Number(${param})`;
      }
      return param;
    });
    
    return `doc.rect(${fixedParams.join(', ')})`;
  });
}

// Aplicar as correções
const fixedContent = fixRectCalls(content);

// Salvar o arquivo corrigido
fs.writeFileSync(filePath, fixedContent, 'utf8');

console.log('Arquivo corrigido com sucesso!');