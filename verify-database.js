const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  port: parseInt(process.env.DB_PORT || '3306'),
  multipleStatements: true
};

async function verifyDatabaseStructure() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao banco de dados...');
    console.log(`📍 Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`📊 Database: ${dbConfig.database}`);
    console.log('');
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexão estabelecida com sucesso!\n');
    
    // Ler o arquivo SQL
    const sqlFilePath = path.join(__dirname, 'verify-database-structure.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Dividir o SQL em queries individuais
    const queries = sqlContent
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'));
    
    console.log('📋 VERIFICAÇÃO DA ESTRUTURA DO BANCO DE DADOS\n');
    console.log('='.repeat(80));
    console.log('');
    
    for (const query of queries) {
      // Pular comentários de status
      if (query.includes("'Verificando") || query.includes("'Estrutura") || 
          query.includes("'Chaves") || query.includes("'Índices") || 
          query.includes("'Contagem")) {
        
        const [rows] = await connection.execute(query);
        if (rows && rows.length > 0 && rows[0].status) {
          console.log('\n' + '─'.repeat(80));
          console.log(`📌 ${rows[0].status}`);
          console.log('─'.repeat(80) + '\n');
        }
        continue;
      }
      
      try {
        const [rows] = await connection.execute(query);
        
        if (rows && rows.length > 0) {
          // Verificar se é uma query de contagem
          if (rows[0].tabela && rows[0].total_registros !== undefined) {
            console.log('📊 Registros nas tabelas:');
            rows.forEach(row => {
              console.log(`   ${row.tabela.padEnd(25)} : ${row.total_registros} registros`);
            });
          }
          // Verificar se é uma query de tabelas
          else if (rows[0].TABLE_NAME) {
            console.log('📁 Tabelas encontradas:');
            rows.forEach(row => {
              const status = row.TABLE_ROWS > 0 ? '✅' : '⚠️';
              console.log(`   ${status} ${row.TABLE_NAME.padEnd(30)} (${row.TABLE_ROWS || 0} registros)`);
            });
          }
          // Verificar se é uma query de colunas
          else if (rows[0].COLUMN_NAME) {
            const tableName = query.match(/TABLE_NAME = '(\w+)'/)?.[1];
            if (tableName) {
              console.log(`\n🔧 Estrutura da tabela: ${tableName}`);
              console.log('   ' + '-'.repeat(76));
              rows.forEach(row => {
                const nullable = row.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
                const key = row.COLUMN_KEY ? `[${row.COLUMN_KEY}]` : '';
                console.log(`   ${row.COLUMN_NAME.padEnd(25)} ${row.COLUMN_TYPE.padEnd(20)} ${nullable.padEnd(10)} ${key}`);
              });
            }
          }
          // Verificar se é uma query de chaves estrangeiras
          else if (rows[0].CONSTRAINT_NAME && rows[0].REFERENCED_TABLE_NAME) {
            console.log('\n🔗 Chaves estrangeiras:');
            rows.forEach(row => {
              console.log(`   ${row.COLUMN_NAME} → ${row.REFERENCED_TABLE_NAME}.${row.REFERENCED_COLUMN_NAME}`);
            });
          }
          // Verificar se é uma query de índices
          else if (rows[0].INDEX_NAME) {
            console.log('\n📑 Índices:');
            const indexes = {};
            rows.forEach(row => {
              if (!indexes[row.INDEX_NAME]) {
                indexes[row.INDEX_NAME] = [];
              }
              indexes[row.INDEX_NAME].push(row.COLUMN_NAME);
            });
            Object.entries(indexes).forEach(([indexName, columns]) => {
              console.log(`   ${indexName}: ${columns.join(', ')}`);
            });
          }
        }
      } catch (error) {
        // Ignorar erros de queries de status
        if (!query.includes('status')) {
          console.error(`❌ Erro ao executar query: ${error.message}`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ VERIFICAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.error('\n📝 Detalhes do erro:');
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão com o banco de dados encerrada.\n');
    }
  }
}

// Executar verificação
verifyDatabaseStructure();
