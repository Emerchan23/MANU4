const mysql = require('mysql2/promise');
const path = require('path');

async function checkEmpresaTables() {
  let connection;
  
  try {
    // Configuração do banco de dados
    const dbConfig = {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance',
      port: 3306
    };

    console.log('🔍 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Conectado ao banco de dados');
    
    // Listar todas as tabelas
    console.log('\n📋 Listando todas as tabelas do banco de dados:');
    const [tables] = await connection.execute('SHOW TABLES');
    
    console.log('\n🗂️  Tabelas encontradas:');
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`${index + 1}. ${tableName}`);
    });
    
    // Procurar por tabelas relacionadas a empresas
    console.log('\n🔍 Procurando por tabelas relacionadas a empresas...');
    
    const empresaRelatedTables = [];
    const searchTerms = [
      'empresa', 'empresas', 'company', 'companies', 
      'third_party', 'terceirizada', 'terceirizadas',
      'contractor', 'contratada', 'contratadas'
    ];
    
    tables.forEach((table) => {
      const tableName = Object.values(table)[0].toLowerCase();
      
      searchTerms.forEach(term => {
        if (tableName.includes(term)) {
          empresaRelatedTables.push(Object.values(table)[0]);
        }
      });
    });
    
    if (empresaRelatedTables.length > 0) {
      console.log('\n⚠️  TABELAS RELACIONADAS A EMPRESAS ENCONTRADAS:');
      empresaRelatedTables.forEach((table, index) => {
        console.log(`${index + 1}. ${table}`);
      });
      
      // Verificar estrutura de cada tabela encontrada
      console.log('\n📊 Verificando estrutura das tabelas encontradas:');
      
      for (const table of empresaRelatedTables) {
        console.log(`\n--- Estrutura da tabela: ${table} ---`);
        try {
          const [columns] = await connection.execute(`DESCRIBE ${table}`);
          columns.forEach(col => {
            console.log(`  ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
          });
          
          // Verificar se há dados na tabela
          const [count] = await connection.execute(`SELECT COUNT(*) as total FROM ${table}`);
          console.log(`  📊 Total de registros: ${count[0].total}`);
          
        } catch (error) {
          console.log(`  ❌ Erro ao verificar tabela ${table}: ${error.message}`);
        }
      }
      
    } else {
      console.log('\n✅ Nenhuma tabela relacionada a empresas foi encontrada!');
    }
    
    // Verificar também por colunas que referenciam empresas em outras tabelas
    console.log('\n🔍 Verificando colunas que podem referenciar empresas em outras tabelas...');
    
    const potentialReferences = [];
    
    for (const table of tables) {
      const tableName = Object.values(table)[0];
      
      // Pular tabelas já identificadas como relacionadas a empresas
      if (empresaRelatedTables.includes(tableName)) continue;
      
      try {
        const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
        
        columns.forEach(col => {
          const columnName = col.Field.toLowerCase();
          const searchTerms = ['company', 'empresa', 'terceirizada', 'contractor'];
          
          searchTerms.forEach(term => {
            if (columnName.includes(term)) {
              potentialReferences.push({
                table: tableName,
                column: col.Field,
                type: col.Type
              });
            }
          });
        });
        
      } catch (error) {
        console.log(`  ⚠️  Erro ao verificar colunas da tabela ${tableName}: ${error.message}`);
      }
    }
    
    if (potentialReferences.length > 0) {
      console.log('\n⚠️  COLUNAS QUE PODEM REFERENCIAR EMPRESAS:');
      potentialReferences.forEach((ref, index) => {
        console.log(`${index + 1}. Tabela: ${ref.table} | Coluna: ${ref.column} | Tipo: ${ref.type}`);
      });
    } else {
      console.log('\n✅ Nenhuma coluna relacionada a empresas foi encontrada em outras tabelas!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão com o banco de dados fechada');
    }
  }
}

// Executar a verificação
checkEmpresaTables().catch(console.error);