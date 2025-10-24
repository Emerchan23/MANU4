import mysql from 'mysql2/promise';

async function checkTableStructure() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('🔍 Verificando estrutura da tabela service_orders...');
    const [columns] = await connection.execute('DESCRIBE service_orders');
    console.log('📋 Colunas da tabela service_orders:');
    columns.forEach(col => {
      console.log(`- ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? col.Key : ''}`);
    });
    
    console.log('\n🔍 Verificando dados de exemplo...');
    const [rows] = await connection.execute('SELECT * FROM service_orders LIMIT 3');
    console.log('📊 Quantidade de registros encontrados:', rows.length);
    
    if (rows.length > 0) {
      console.log('📊 Primeiro registro:', JSON.stringify(rows[0], null, 2));
    }
    
    console.log('\n🔍 Verificando empresas...');
    const [companies] = await connection.execute('SELECT id, name FROM companies LIMIT 5');
    console.log('🏢 Empresas encontradas:', companies.length);
    companies.forEach(company => {
      console.log(`- ID: ${company.id}, Nome: ${company.name}`);
    });
    
    await connection.end();
    console.log('✅ Verificação concluída');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkTableStructure();