const mysql = require('mysql2/promise');

async function checkSectorsTable() {
  const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance',
    charset: 'utf8mb4',
    timezone: '+00:00'
  };

  try {
    console.log('🔍 Verificando tabelas relacionadas a setores...');
    const connection = await mysql.createConnection(dbConfig);
    
    // Verificar todas as tabelas que contêm "sector"
    console.log('📋 Buscando tabelas com "sector" no nome...');
    const [tables] = await connection.query("SHOW TABLES LIKE '%sector%'");
    console.log('Tabelas encontradas:', tables);
    
    // Verificar se existe "setores" (português)
    console.log('\n📋 Verificando tabela "setores"...');
    const [setoresTable] = await connection.query("SHOW TABLES LIKE 'setores'");
    console.log('Tabela setores:', setoresTable);
    
    if (setoresTable.length > 0) {
      console.log('\n🔍 Estrutura da tabela setores:');
      const [columns] = await connection.query("DESCRIBE setores");
      console.table(columns);
    }
    
    // Verificar se existe "subsectors"
    console.log('\n📋 Verificando tabela "subsectors"...');
    const [subsectorsTable] = await connection.query("SHOW TABLES LIKE 'subsectors'");
    console.log('Tabela subsectors:', subsectorsTable);
    
    if (subsectorsTable.length > 0) {
      console.log('\n🔍 Estrutura da tabela subsectors:');
      const [columns] = await connection.query("DESCRIBE subsectors");
      console.table(columns);
    }
    
    // Listar todas as tabelas do banco
    console.log('\n📋 Todas as tabelas do banco:');
    const [allTables] = await connection.query("SHOW TABLES");
    allTables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`${index + 1}. ${tableName}`);
    });
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkSectorsTable();