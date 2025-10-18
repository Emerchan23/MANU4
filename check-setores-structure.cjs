const mysql = require('mysql2/promise');

async function checkSetoresStructure() {
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

    // Verificar estrutura da tabela setores
    console.log('\n📋 Estrutura da tabela SETORES:');
    const [setoresStructure] = await connection.execute('DESCRIBE setores');
    console.table(setoresStructure);
    
    // Verificar se existe company_id ou empresa_id na tabela setores
    console.log('\n🔍 Verificando se existe relação com empresas na tabela setores...');
    const hasCompanyId = setoresStructure.some(col => 
      col.Field.toLowerCase().includes('company') || 
      col.Field.toLowerCase().includes('empresa')
    );
    
    if (hasCompanyId) {
      console.log('✅ Encontrada coluna relacionada a empresa na tabela setores!');
      const companyColumns = setoresStructure.filter(col => 
        col.Field.toLowerCase().includes('company') || 
        col.Field.toLowerCase().includes('empresa')
      );
      console.log('Colunas encontradas:', companyColumns.map(col => col.Field));
    } else {
      console.log('❌ NÃO foi encontrada coluna relacionada a empresa na tabela setores');
    }
    
    // Mostrar alguns dados da tabela setores
    console.log('\n📊 Dados na tabela SETORES (primeiros 5 registros):');
    const [setoresData] = await connection.execute('SELECT * FROM setores LIMIT 5');
    console.table(setoresData);
    
    // Verificar se existe tabela companies
    console.log('\n🔍 Verificando se existe tabela companies...');
    const [companiesTable] = await connection.execute("SHOW TABLES LIKE 'companies'");
    
    if (companiesTable.length > 0) {
      console.log('✅ Tabela companies existe!');
      
      // Mostrar estrutura da tabela companies
      console.log('\n📋 Estrutura da tabela COMPANIES:');
      const [companiesStructure] = await connection.execute('DESCRIBE companies');
      console.table(companiesStructure);
      
      // Mostrar alguns dados da tabela companies
      console.log('\n📊 Dados na tabela COMPANIES (primeiros 5 registros):');
      const [companiesData] = await connection.execute('SELECT * FROM companies LIMIT 5');
      console.table(companiesData);
    } else {
      console.log('❌ Tabela companies NÃO existe');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada');
    }
  }
}

checkSetoresStructure();