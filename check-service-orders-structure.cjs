const mysql = require('mysql2/promise');

async function checkServiceOrdersStructure() {
  let connection;
  
  try {
    // Conectar ao banco
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('✅ Conectado ao banco de dados hospital_maintenance');

    // Verificar estrutura da tabela service_orders
    console.log('\n🔍 Estrutura da tabela service_orders:');
    const [structure] = await connection.execute('DESCRIBE service_orders');
    
    console.table(structure);

    // Verificar se existem os campos necessários
    const hasCompanyId = structure.some(field => field.Field === 'company_id');
    const hasCost = structure.some(field => field.Field === 'cost' || field.Field === 'actual_cost' || field.Field === 'estimated_cost');
    
    console.log(`\n📋 Campo company_id existe: ${hasCompanyId ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`📋 Campo de custo existe: ${hasCost ? '✅ SIM' : '❌ NÃO'}`);

    // Buscar algumas ordens de serviço para ver a estrutura dos dados
    console.log('\n🔍 Primeiras 3 ordens de serviço:');
    const [orders] = await connection.execute('SELECT * FROM service_orders LIMIT 3');
    
    if (orders.length > 0) {
      console.log('Campos disponíveis:', Object.keys(orders[0]));
      console.log('\nPrimeira ordem de serviço:');
      console.log(JSON.stringify(orders[0], null, 2));
    } else {
      console.log('Nenhuma ordem de serviço encontrada');
    }

    // Verificar se existe tabela companies
    console.log('\n🔍 Verificando tabela companies:');
    const [companiesStructure] = await connection.execute('DESCRIBE companies');
    console.table(companiesStructure);

    // Buscar algumas empresas
    console.log('\n🔍 Primeiras 3 empresas:');
    const [companies] = await connection.execute('SELECT * FROM companies LIMIT 3');
    
    if (companies.length > 0) {
      console.log('Campos disponíveis:', Object.keys(companies[0]));
      companies.forEach((company, index) => {
        console.log(`\nEmpresa ${index + 1}:`, {
          id: company.id,
          name: company.name,
          cnpj: company.cnpj
        });
      });
    } else {
      console.log('Nenhuma empresa encontrada');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkServiceOrdersStructure();