const mysql = require('mysql2/promise');

async function checkCompaniesTable() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao banco de dados...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('✅ Conectado ao banco com sucesso!');

    // Verificar estrutura da tabela companies
    console.log('\n📋 Estrutura da tabela companies:');
    const [companiesStructure] = await connection.execute('DESCRIBE companies');
    console.table(companiesStructure);

    // Verificar dados existentes
    console.log('\n📊 Dados existentes na tabela companies:');
    const [companiesData] = await connection.execute('SELECT * FROM companies LIMIT 5');
    console.table(companiesData);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkCompaniesTable();