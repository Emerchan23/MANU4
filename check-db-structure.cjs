const mysql = require('mysql2/promise');

async function checkDatabaseStructure() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('🔍 Verificando estrutura da tabela companies...\n');
    
    const [rows] = await connection.execute('DESCRIBE companies');
    console.log('Colunas da tabela companies:');
    rows.forEach(row => {
      console.log(`- ${row.Field} (${row.Type}) ${row.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${row.Key ? `[${row.Key}]` : ''}`);
    });

    console.log('\n🔍 Verificando se existem dados na empresa ID 20...\n');
    
    const [companyData] = await connection.execute(
      'SELECT id, name, contracts, technicians, comments, evaluations FROM companies WHERE id = 20'
    );
    
    if (companyData.length > 0) {
      const company = companyData[0];
      console.log('Dados da empresa ID 20:');
      console.log(`- Nome: ${company.name}`);
      console.log(`- Contratos: ${company.contracts || 'NULL'}`);
      console.log(`- Técnicos: ${company.technicians || 'NULL'}`);
      console.log(`- Comentários: ${company.comments || 'NULL'}`);
      console.log(`- Avaliações: ${company.evaluations || 'NULL'}`);
    } else {
      console.log('Empresa ID 20 não encontrada');
    }

    await connection.end();
  } catch (error) {
    console.error('Erro ao verificar estrutura do banco:', error.message);
  }
}

checkDatabaseStructure();