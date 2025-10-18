const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function testTemplatesIntegration() {
  try {
    console.log('🧪 [TEST] Testando integração de templates...');
    
    const connection = await mysql.createConnection(dbConfig);
    
    // 1. Verificar templates ativos no banco
    console.log('\n1. 📋 Templates ativos no banco de dados:');
    const [templates] = await connection.execute(
      'SELECT id, name, description, content, is_active FROM service_description_templates WHERE is_active = 1 ORDER BY name'
    );
    
    console.log(`   Total de templates ativos: ${templates.length}`);
    templates.forEach(template => {
      console.log(`   - ID: ${template.id}, Nome: "${template.name}"`);
      console.log(`     Descrição: ${template.description}`);
      console.log(`     Content: ${template.content ? template.content.substring(0, 50) + '...' : 'N/A'}`);
      console.log('');
    });
    
    // 2. Testar API
    console.log('2. 🌐 Testando API /api/service-templates:');
    const response = await fetch('http://localhost:3000/api/service-templates');
    const apiData = await response.json();
    
    if (apiData.success) {
      console.log(`   ✅ API funcionando - ${apiData.data.length} templates retornados`);
      console.log(`   📊 Paginação: Página ${apiData.pagination.currentPage} de ${apiData.pagination.totalPages}`);
      
      // Verificar se os dados batem
      const activeTemplatesFromAPI = apiData.data.filter(t => t.active === 1);
      console.log(`   🔍 Templates ativos via API: ${activeTemplatesFromAPI.length}`);
      
      if (activeTemplatesFromAPI.length > 0) {
        console.log('   📄 Exemplos de templates da API:');
        activeTemplatesFromAPI.slice(0, 3).forEach(template => {
          console.log(`     - ID: ${template.id}, Nome: "${template.name}"`);
        });
      }
    } else {
      console.log('   ❌ Erro na API:', apiData.error);
    }
    
    await connection.end();
    
    console.log('\n✅ Teste de integração concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste de integração:', error.message);
  }
}

testTemplatesIntegration();