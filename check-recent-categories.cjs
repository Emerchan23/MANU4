const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function checkRecentCategories() {
  try {
    const connection = await mysql.createConnection(config);
    console.log('🔍 Verificando categorias recentes...');
    
    // Buscar as últimas categorias criadas
    const [categories] = await connection.execute(
      'SELECT id, name, is_electrical, description, created_at FROM categories ORDER BY id DESC LIMIT 10'
    );
    
    console.log('\n📋 Últimas 10 categorias:');
    categories.forEach((cat, index) => {
      console.log(`${index + 1}. ID: ${cat.id} - ${cat.name}`);
      console.log(`   is_electrical (raw): ${cat.is_electrical} (tipo: ${typeof cat.is_electrical})`);
      console.log(`   Boolean: ${Boolean(cat.is_electrical)}`);
      console.log(`   Criado em: ${cat.created_at}`);
      console.log('');
    });
    
    // Buscar especificamente as categorias que deveriam ser elétricas
    console.log('🔍 Buscando categorias que deveriam ser elétricas...');
    const [electricalCategories] = await connection.execute(
      "SELECT id, name, is_electrical FROM categories WHERE name LIKE '%API Teste%' OR name LIKE '%Elétrica%' OR name LIKE '%El_trica%'"
    );
    
    console.log('\n⚡ Categorias que deveriam ser elétricas:');
    electricalCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ID: ${cat.id} - ${cat.name}`);
      console.log(`   is_electrical: ${cat.is_electrical} (${cat.is_electrical ? 'ELÉTRICA' : 'NÃO ELÉTRICA'})`);
    });
    
    await connection.end();
    console.log('\n✅ Verificação concluída!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkRecentCategories();