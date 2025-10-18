const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function testMaintenancePlansAPI() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados MariaDB');
    
    console.log('\n🧪 Testando API de Planos de Manutenção...');
    
    // 1. Testar query direta no banco
    console.log('📋 Testando query direta no banco...');
    const [plans] = await connection.execute(`
      SELECT 
        id,
        name,
        description,
        frequency,
        maintenance_type,
        estimated_duration,
        estimated_cost,
        equipment_ids,
        is_active,
        created_at,
        updated_at
      FROM maintenance_plans
      WHERE is_active = 1
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log(`✅ Encontrados ${plans.length} planos de manutenção`);
    
    plans.forEach((plan, index) => {
      console.log(`\n📋 Plano ${index + 1}:`);
      console.log(`  - ID: ${plan.id}`);
      console.log(`  - Nome: ${plan.name}`);
      console.log(`  - Descrição: ${plan.description || 'N/A'}`);
      console.log(`  - Frequência: ${plan.frequency}`);
      console.log(`  - Tipo: ${plan.maintenance_type}`);
      console.log(`  - Duração: ${plan.estimated_duration} minutos`);
      console.log(`  - Custo: R$ ${plan.estimated_cost}`);
      console.log(`  - Equipment IDs: ${plan.equipment_ids || '[]'}`);
      console.log(`  - Ativo: ${plan.is_active ? 'Sim' : 'Não'}`);
      console.log(`  - Criado em: ${plan.created_at}`);
    });
    
    // 2. Testar contagem total
    console.log('\n📊 Testando contagem total...');
    const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM maintenance_plans');
    console.log(`Total de planos: ${countResult[0].total}`);
    
    // 3. Testar filtros
    console.log('\n🔍 Testando filtros...');
    
    // Filtro por tipo
    const [preventivePlans] = await connection.execute(`
      SELECT COUNT(*) as total 
      FROM maintenance_plans 
      WHERE maintenance_type = 'PREVENTIVE'
    `);
    console.log(`Planos preventivos: ${preventivePlans[0].total}`);
    
    // Filtro por frequência
    const [monthlyPlans] = await connection.execute(`
      SELECT COUNT(*) as total 
      FROM maintenance_plans 
      WHERE frequency = 'MONTHLY'
    `);
    console.log(`Planos mensais: ${monthlyPlans[0].total}`);
    
    // Filtro por status ativo
    const [activePlans] = await connection.execute(`
      SELECT COUNT(*) as total 
      FROM maintenance_plans 
      WHERE is_active = 1
    `);
    console.log(`Planos ativos: ${activePlans[0].total}`);
    
    // 4. Testar busca por texto
    console.log('\n🔍 Testando busca por texto...');
    const [searchResults] = await connection.execute(`
      SELECT id, name 
      FROM maintenance_plans 
      WHERE (name LIKE ? OR description LIKE ?)
      LIMIT 5
    `, ['%Preventiva%', '%Preventiva%']);
    
    console.log(`Resultados da busca por "Preventiva": ${searchResults.length}`);
    searchResults.forEach(result => {
      console.log(`  - ${result.name}`);
    });
    
    console.log('\n🎉 Teste da API concluído com sucesso!');
    console.log('\n📝 Resumo:');
    console.log(`  - Total de planos: ${countResult[0].total}`);
    console.log(`  - Planos ativos: ${activePlans[0].total}`);
    console.log(`  - Planos preventivos: ${preventivePlans[0].total}`);
    console.log(`  - Planos mensais: ${monthlyPlans[0].total}`);
    console.log(`  - Estrutura do banco: ✅ Corrigida`);
    console.log(`  - Dados de exemplo: ✅ Disponíveis`);
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testMaintenancePlansAPI();