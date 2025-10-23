const mysql = require('mysql2/promise');

async function checkTables() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance',
    port: 3306
  });

  try {
    console.log('Verificando todas as tabelas relacionadas a PDF...');
    const [tables] = await connection.execute("SHOW TABLES LIKE '%pdf%'");
    
    console.log('Tabelas encontradas:');
    tables.forEach(table => {
      console.log('- ' + Object.values(table)[0]);
    });

    console.log('\nVerificando se existe tabela de configurações PDF...');
    const [configTables] = await connection.execute("SHOW TABLES LIKE '%config%'");
    
    console.log('Tabelas de configuração:');
    configTables.forEach(table => {
      console.log('- ' + Object.values(table)[0]);
    });

    console.log('\nVerificando todas as tabelas...');
    const [allTables] = await connection.execute("SHOW TABLES");
    
    console.log('Todas as tabelas:');
    allTables.forEach(table => {
      console.log('- ' + Object.values(table)[0]);
    });

  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await connection.end();
  }
}

checkTables();