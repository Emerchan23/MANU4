const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTables() {
  try {
    // Configuração do banco de dados
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance',
      charset: 'utf8mb4',
      timezone: '-03:00'
    };

    console.log('🔍 Conectando ao banco de dados...');
    const connection = await mysql.createConnection(dbConfig);
    
    // Listar todas as tabelas
    console.log('\n📋 TABELAS ENCONTRADAS NO BANCO:');
    console.log('================================');
    const [tables] = await connection.execute('SHOW TABLES');
    
    const tableNames = [];
    tables.forEach((row, index) => {
      const tableName = Object.values(row)[0];
      tableNames.push(tableName);
      console.log(`${index + 1}. ${tableName}`);
    });
    
    console.log(`\n📊 Total de tabelas: ${tableNames.length}`);
    
    // Verificar estrutura de cada tabela
    console.log('\n🔍 ESTRUTURA DAS TABELAS:');
    console.log('========================');
    
    for (const tableName of tableNames) {
      try {
        console.log(`\n📋 Tabela: ${tableName}`);
        console.log('-'.repeat(50));
        
        // Obter estrutura da tabela
        const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
        columns.forEach(col => {
          console.log(`  ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
        });
        
        // Contar registros
        const [count] = await connection.execute(`SELECT COUNT(*) as total FROM ${tableName}`);
        console.log(`  📊 Registros: ${count[0].total}`);
        
      } catch (error) {
        console.log(`  ❌ Erro ao analisar tabela ${tableName}: ${error.message}`);
      }
    }
    
    // Verificar tabelas que podem estar duplicadas ou não utilizadas
    console.log('\n🔍 ANÁLISE DE POSSÍVEIS DUPLICAÇÕES:');
    console.log('===================================');
    
    const possibleDuplicates = [];
    const unusedTables = [];
    
    // Verificar padrões de nomes similares
    for (let i = 0; i < tableNames.length; i++) {
      for (let j = i + 1; j < tableNames.length; j++) {
        const table1 = tableNames[i].toLowerCase();
        const table2 = tableNames[j].toLowerCase();
        
        // Verificar se são similares (diferença de 1-2 caracteres ou plural/singular)
        if (
          table1.includes(table2) || table2.includes(table1) ||
          (table1.endsWith('s') && table1.slice(0, -1) === table2) ||
          (table2.endsWith('s') && table2.slice(0, -1) === table1)
        ) {
          possibleDuplicates.push([tableNames[i], tableNames[j]]);
        }
      }
    }
    
    if (possibleDuplicates.length > 0) {
      console.log('\n⚠️ Possíveis tabelas duplicadas ou similares:');
      possibleDuplicates.forEach(([table1, table2], index) => {
        console.log(`${index + 1}. ${table1} ↔ ${table2}`);
      });
    } else {
      console.log('\n✅ Nenhuma duplicação óbvia encontrada');
    }
    
    // Verificar tabelas que podem não estar sendo utilizadas
    console.log('\n🔍 VERIFICANDO USO DAS TABELAS NO CÓDIGO:');
    console.log('========================================');
    
    const fs = require('fs');
    const path = require('path');
    
    // Função para buscar referências no código
    function searchInFiles(dir, extensions = ['.js', '.ts', '.tsx', '.jsx']) {
      const results = new Map();
      
      function searchDir(currentDir) {
        try {
          const files = fs.readdirSync(currentDir);
          
          for (const file of files) {
            const filePath = path.join(currentDir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
              searchDir(filePath);
            } else if (stat.isFile() && extensions.some(ext => file.endsWith(ext))) {
              try {
                const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
                
                for (const tableName of tableNames) {
                  const tableNameLower = tableName.toLowerCase();
                  if (content.includes(tableNameLower)) {
                    if (!results.has(tableName)) {
                      results.set(tableName, []);
                    }
                    results.get(tableName).push(filePath);
                  }
                }
              } catch (err) {
                // Ignorar erros de leitura de arquivo
              }
            }
          }
        } catch (err) {
          // Ignorar erros de diretório
        }
      }
      
      searchDir(dir);
      return results;
    }
    
    const codeReferences = searchInFiles(process.cwd());
    
    console.log('\n📋 Uso das tabelas no código:');
    tableNames.forEach(tableName => {
      const references = codeReferences.get(tableName);
      if (references && references.length > 0) {
        console.log(`✅ ${tableName} - Encontrada em ${references.length} arquivo(s)`);
      } else {
        console.log(`❌ ${tableName} - NÃO encontrada no código`);
        unusedTables.push(tableName);
      }
    });
    
    if (unusedTables.length > 0) {
      console.log('\n⚠️ TABELAS POSSIVELMENTE NÃO UTILIZADAS:');
      console.log('=====================================');
      unusedTables.forEach((table, index) => {
        console.log(`${index + 1}. ${table}`);
      });
      
      console.log('\n💡 RECOMENDAÇÕES:');
      console.log('================');
      console.log('1. Verifique se essas tabelas são realmente necessárias');
      console.log('2. Faça backup antes de remover qualquer tabela');
      console.log('3. Considere renomear tabelas com nomes similares para evitar confusão');
      console.log('4. Documente o propósito de cada tabela');
    } else {
      console.log('\n✅ Todas as tabelas parecem estar sendo utilizadas no código');
    }
    
    await connection.end();
    console.log('\n✅ Análise concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao analisar tabelas:', error.message);
    process.exit(1);
  }
}

checkTables();