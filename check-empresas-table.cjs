const mysql = require('mysql2/promise');

async function checkEmpresasTable() {
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
    
    // Verificar se a tabela empresas existe
    console.log('\n🔍 Verificando se a tabela "empresas" existe...');
    
    const [tables] = await connection.execute("SHOW TABLES LIKE 'empresas'");
    
    if (tables.length > 0) {
      console.log('\n⚠️  TABELA "empresas" ENCONTRADA!');
      
      // Verificar estrutura da tabela
      console.log('\n📊 Estrutura da tabela empresas:');
      const [structure] = await connection.execute('DESCRIBE empresas');
      structure.forEach(col => {
        console.log(`   ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} - Default: ${col.Default || 'NULL'}`);
      });
      
      // Verificar quantos registros existem
      const [count] = await connection.execute('SELECT COUNT(*) as total FROM empresas');
      console.log(`\n📊 Total de registros na tabela empresas: ${count[0].total}`);
      
      // Mostrar alguns registros se existirem
      if (count[0].total > 0) {
        console.log('\n📋 Registros na tabela empresas:');
        const [records] = await connection.execute('SELECT * FROM empresas LIMIT 10');
        records.forEach((record, index) => {
          console.log(`   ${index + 1}. ID: ${record.id} | Nome: ${record.name || record.nome || 'N/A'} | CNPJ: ${record.cnpj || 'N/A'}`);
        });
      }
      
      // Verificar quais tabelas referenciam a tabela empresas
      console.log('\n🔗 Verificando tabelas que referenciam "empresas":');
      const [references] = await connection.execute(`
        SELECT 
          TABLE_NAME,
          COLUMN_NAME,
          CONSTRAINT_NAME
        FROM 
          INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE 
          REFERENCED_TABLE_SCHEMA = 'hospital_maintenance'
          AND REFERENCED_TABLE_NAME = 'empresas'
      `);
      
      if (references.length > 0) {
        console.log('\n⚠️  TABELAS QUE REFERENCIAM "empresas":');
        references.forEach((ref, index) => {
          console.log(`   ${index + 1}. Tabela: ${ref.TABLE_NAME} | Coluna: ${ref.COLUMN_NAME} | Constraint: ${ref.CONSTRAINT_NAME}`);
        });
      } else {
        console.log('\n✅ Nenhuma tabela referencia "empresas" (sem foreign keys)');
      }
      
    } else {
      console.log('\n✅ Tabela "empresas" NÃO existe no banco de dados');
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
checkEmpresasTable().catch(console.error);