const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function analyzeDatabase() {
  let connection;
  
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
    connection = await mysql.createConnection(dbConfig);
    
    // Listar todas as tabelas
    console.log('\n📋 TODAS AS TABELAS DO BANCO:');
    console.log('============================');
    const [tables] = await connection.execute('SHOW TABLES');
    
    const tableNames = [];
    tables.forEach((row, index) => {
      const tableName = Object.values(row)[0];
      tableNames.push(tableName);
      console.log(`${String(index + 1).padStart(2, '0')}. ${tableName}`);
    });
    
    console.log(`\n📊 Total de tabelas: ${tableNames.length}`);
    
    // Analisar cada tabela
    const tableAnalysis = new Map();
    
    console.log('\n🔍 ANÁLISE DETALHADA DAS TABELAS:');
    console.log('=================================');
    
    for (const tableName of tableNames) {
      try {
        // Obter estrutura da tabela
        const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
        
        // Contar registros
        const [count] = await connection.execute(`SELECT COUNT(*) as total FROM ${tableName}`);
        const recordCount = count[0].total;
        
        // Obter tamanho da tabela
        const [size] = await connection.execute(`
          SELECT 
            ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'size_mb'
          FROM information_schema.tables 
          WHERE table_schema = ? AND table_name = ?
        `, [dbConfig.database, tableName]);
        
        const sizeInfo = size[0] ? size[0].size_mb : 0;
        
        tableAnalysis.set(tableName, {
          columns: columns.length,
          records: recordCount,
          size_mb: sizeInfo,
          structure: columns
        });
        
        console.log(`\n📋 ${tableName}`);
        console.log(`   📊 Colunas: ${columns.length} | Registros: ${recordCount} | Tamanho: ${sizeInfo} MB`);
        
        if (recordCount === 0) {
          console.log('   ⚠️  TABELA VAZIA');
        }
        
      } catch (error) {
        console.log(`   ❌ Erro ao analisar: ${error.message}`);
      }
    }
    
    // Buscar referências no código
    console.log('\n🔍 VERIFICANDO USO DAS TABELAS NO CÓDIGO:');
    console.log('========================================');
    
    function searchInFiles(dir, extensions = ['.js', '.ts', '.tsx', '.jsx', '.cjs']) {
      const results = new Map();
      
      function searchDir(currentDir) {
        try {
          const files = fs.readdirSync(currentDir);
          
          for (const file of files) {
            const filePath = path.join(currentDir, file);
            
            try {
              const stat = fs.statSync(filePath);
              
              if (stat.isDirectory() && 
                  !file.startsWith('.') && 
                  file !== 'node_modules' && 
                  file !== 'banco de dados' &&
                  file !== '.next') {
                searchDir(filePath);
              } else if (stat.isFile() && extensions.some(ext => file.endsWith(ext))) {
                try {
                  const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
                  
                  for (const tableName of tableNames) {
                    const tableNameLower = tableName.toLowerCase();
                    // Buscar por referências mais específicas
                    const patterns = [
                      `from ${tableNameLower}`,
                      `into ${tableNameLower}`,
                      `update ${tableNameLower}`,
                      `delete from ${tableNameLower}`,
                      `'${tableNameLower}'`,
                      `"${tableNameLower}"`,
                      `\`${tableNameLower}\``,
                      `${tableNameLower} where`,
                      `${tableNameLower} set`,
                      `join ${tableNameLower}`,
                      `table: '${tableNameLower}'`,
                      `table: "${tableNameLower}"`
                    ];
                    
                    if (patterns.some(pattern => content.includes(pattern))) {
                      if (!results.has(tableName)) {
                        results.set(tableName, new Set());
                      }
                      results.get(tableName).add(filePath);
                    }
                  }
                } catch (err) {
                  // Ignorar erros de leitura de arquivo
                }
              }
            } catch (err) {
              // Ignorar erros de stat
            }
          }
        } catch (err) {
          // Ignorar erros de diretório
        }
      }
      
      searchDir(dir);
      
      // Converter Sets para Arrays
      const finalResults = new Map();
      for (const [key, value] of results) {
        finalResults.set(key, Array.from(value));
      }
      
      return finalResults;
    }
    
    const codeReferences = searchInFiles(process.cwd());
    
    const usedTables = [];
    const unusedTables = [];
    const emptyTables = [];
    
    console.log('\n📋 Status de uso das tabelas:');
    tableNames.forEach(tableName => {
      const references = codeReferences.get(tableName);
      const analysis = tableAnalysis.get(tableName);
      
      if (references && references.length > 0) {
        console.log(`✅ ${tableName.padEnd(30)} - Usada em ${references.length} arquivo(s)`);
        usedTables.push(tableName);
      } else {
        console.log(`❌ ${tableName.padEnd(30)} - NÃO encontrada no código`);
        unusedTables.push(tableName);
      }
      
      if (analysis && analysis.records === 0) {
        emptyTables.push(tableName);
      }
    });
    
    // Identificar possíveis duplicações
    console.log('\n🔍 ANÁLISE DE POSSÍVEIS DUPLICAÇÕES:');
    console.log('===================================');
    
    const possibleDuplicates = [];
    const similarTables = [];
    
    for (let i = 0; i < tableNames.length; i++) {
      for (let j = i + 1; j < tableNames.length; j++) {
        const table1 = tableNames[i].toLowerCase();
        const table2 = tableNames[j].toLowerCase();
        
        // Verificar nomes muito similares
        if (
          table1.includes(table2) || table2.includes(table1) ||
          (table1.endsWith('s') && table1.slice(0, -1) === table2) ||
          (table2.endsWith('s') && table2.slice(0, -1) === table1) ||
          table1.replace('_', '') === table2.replace('_', '') ||
          Math.abs(table1.length - table2.length) <= 2 && 
          (table1.includes(table2.substring(0, table2.length - 2)) || 
           table2.includes(table1.substring(0, table1.length - 2)))
        ) {
          similarTables.push([tableNames[i], tableNames[j]]);
        }
      }
    }
    
    if (similarTables.length > 0) {
      console.log('\n⚠️ Tabelas com nomes similares (possíveis duplicações):');
      similarTables.forEach(([table1, table2], index) => {
        const analysis1 = tableAnalysis.get(table1);
        const analysis2 = tableAnalysis.get(table2);
        console.log(`${index + 1}. ${table1} (${analysis1.records} registros) ↔ ${table2} (${analysis2.records} registros)`);
      });
    } else {
      console.log('\n✅ Nenhuma duplicação óbvia encontrada');
    }
    
    // Relatório final
    console.log('\n📊 RELATÓRIO FINAL:');
    console.log('==================');
    console.log(`📋 Total de tabelas: ${tableNames.length}`);
    console.log(`✅ Tabelas utilizadas: ${usedTables.length}`);
    console.log(`❌ Tabelas não utilizadas: ${unusedTables.length}`);
    console.log(`📭 Tabelas vazias: ${emptyTables.length}`);
    console.log(`⚠️ Possíveis duplicações: ${similarTables.length}`);
    
    if (unusedTables.length > 0) {
      console.log('\n❌ TABELAS NÃO UTILIZADAS NO CÓDIGO:');
      console.log('===================================');
      unusedTables.forEach((table, index) => {
        const analysis = tableAnalysis.get(table);
        console.log(`${index + 1}. ${table} (${analysis.records} registros, ${analysis.size_mb} MB)`);
      });
    }
    
    if (emptyTables.length > 0) {
      console.log('\n📭 TABELAS VAZIAS:');
      console.log('=================');
      emptyTables.forEach((table, index) => {
        const isUsed = usedTables.includes(table) ? '✅ Usada' : '❌ Não usada';
        console.log(`${index + 1}. ${table} - ${isUsed}`);
      });
    }
    
    // Recomendações
    console.log('\n💡 RECOMENDAÇÕES:');
    console.log('================');
    
    if (unusedTables.length > 0) {
      console.log('🗑️ Tabelas candidatas para remoção (não utilizadas no código):');
      unusedTables.forEach(table => {
        const analysis = tableAnalysis.get(table);
        if (analysis.records === 0) {
          console.log(`   - ${table} (vazia - SEGURO remover)`);
        } else {
          console.log(`   - ${table} (${analysis.records} registros - VERIFICAR antes de remover)`);
        }
      });
    }
    
    if (similarTables.length > 0) {
      console.log('\n🔄 Tabelas com nomes similares para revisar:');
      similarTables.forEach(([table1, table2]) => {
        console.log(`   - Comparar: ${table1} vs ${table2}`);
      });
    }
    
    console.log('\n⚠️ IMPORTANTE:');
    console.log('- Sempre faça backup antes de remover tabelas');
    console.log('- Verifique se tabelas "não utilizadas" não são usadas por sistemas externos');
    console.log('- Considere manter tabelas de log/auditoria mesmo se vazias');
    console.log('- Documente o propósito de cada tabela mantida');
    
  } catch (error) {
    console.error('❌ Erro ao analisar banco de dados:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada');
    }
  }
}

analyzeDatabase();