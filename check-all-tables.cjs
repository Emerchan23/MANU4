const mysql = require('mysql2/promise');

async function checkAllTables() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  try {
    console.log('🔍 Verificando todas as tabelas no banco...');
    
    // Listar todas as tabelas
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('\n📋 Tabelas encontradas:');
    console.log('==================================================');
    
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`${index + 1}. ${tableName}`);
    });
    
    console.log('\n🔍 Verificando se existe tabela "companies" ou "empresas"...');
    
    // Verificar se existe companies
    try {
      const [companiesResult] = await connection.execute('SELECT COUNT(*) as count FROM companies LIMIT 1');
      console.log('✅ Tabela "companies" existe e tem', companiesResult[0].count, 'registros');
    } catch (error) {
      console.log('❌ Tabela "companies" não existe:', error.message);
    }
    
    // Verificar se existe empresas
    try {
      const [empresasResult] = await connection.execute('SELECT COUNT(*) as count FROM empresas LIMIT 1');
      console.log('✅ Tabela "empresas" existe e tem', empresasResult[0].count, 'registros');
    } catch (error) {
      console.log('❌ Tabela "empresas" não existe:', error.message);
    }
    
    console.log('\n🔍 Verificando estrutura da tabela service_orders...');
    const [serviceOrdersStructure] = await connection.execute('DESCRIBE service_orders');
    console.log('📊 Estrutura da tabela service_orders:');
    serviceOrdersStructure.forEach(column => {
      console.log(`   ${column.Field} - ${column.Type} - ${column.Null} - ${column.Key}`);
    });
    
    console.log('\n🔍 Verificando dados na tabela service_orders...');
    const [serviceOrdersData] = await connection.execute('SELECT * FROM service_orders LIMIT 5');
    console.log('📊 Primeiros 5 registros da service_orders:');
    serviceOrdersData.forEach((row, index) => {
      console.log(`${index + 1}.`, JSON.stringify(row, null, 2));
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await connection.end();
    console.log('🔌 Conexão fechada');
  }
}

checkAllTables();