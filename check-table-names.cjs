const mysql = require('mysql2/promise');

async function checkTableNames() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '',
    database: 'hospital_maintenance'
  });

  console.log('=== VERIFICANDO NOMES DAS TABELAS ===\n');

  // 1. Verificar todas as tabelas do banco
  console.log('1. TODAS AS TABELAS DO BANCO:');
  const [tables] = await connection.execute("SHOW TABLES");
  console.table(tables);

  // 2. Verificar tabelas relacionadas a categorias
  console.log('\n2. TABELAS RELACIONADAS A CATEGORIAS:');
  const [categoryTables] = await connection.execute("SHOW TABLES LIKE '%categor%'");
  console.table(categoryTables);

  // 3. Verificar tabelas relacionadas a subsetores
  console.log('\n3. TABELAS RELACIONADAS A SUBSETORES:');
  const [subsectorTables] = await connection.execute("SHOW TABLES LIKE '%subset%'");
  console.table(subsectorTables);

  // 4. Verificar se existe categories (inglês)
  console.log('\n4. VERIFICANDO TABELA CATEGORIES:');
  const [categoriesTable] = await connection.execute("SHOW TABLES LIKE 'categories'");
  if (categoriesTable.length > 0) {
    console.log('✅ Tabela categories encontrada');
    const [categoriesStructure] = await connection.execute("DESCRIBE categories");
    console.table(categoriesStructure);
  } else {
    console.log('❌ Tabela categories NÃO encontrada');
  }

  // 5. Verificar se existe subsectors (inglês)
  console.log('\n5. VERIFICANDO TABELA SUBSECTORS:');
  const [subsectorsTable] = await connection.execute("SHOW TABLES LIKE 'subsectors'");
  if (subsectorsTable.length > 0) {
    console.log('✅ Tabela subsectors encontrada');
    const [subsectorsStructure] = await connection.execute("DESCRIBE subsectors");
    console.table(subsectorsStructure);
  } else {
    console.log('❌ Tabela subsectors NÃO encontrada');
  }

  await connection.end();
}

checkTableNames().catch(console.error);