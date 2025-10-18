const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function checkTemplateCategoriesTable() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('🔍 Verificando tabela template_categories...');
    
    // Verificar se a tabela existe
    const [tables] = await connection.execute(
      'SHOW TABLES LIKE "template_categories"'
    );
    
    if (tables.length === 0) {
      console.log('❌ Tabela template_categories NÃO existe');
    } else {
      console.log('✅ Tabela template_categories existe');
      
      // Verificar dados
      const [count] = await connection.execute('SELECT COUNT(*) as total FROM template_categories');
      console.log(`📊 Total de categorias: ${count[0].total}`);
      
      if (count[0].total > 0) {
        const [samples] = await connection.execute('SELECT id, name FROM template_categories LIMIT 3');
        console.log('📄 Exemplos de categorias:');
        samples.forEach(cat => {
          console.log(`  - ID: ${cat.id}, Nome: ${cat.name}`);
        });
      }
    }
    
    await connection.end();
  } catch (error) {
    console.error('❌ Erro ao verificar tabela de categorias:', error.message);
  }
}

checkTemplateCategoriesTable();