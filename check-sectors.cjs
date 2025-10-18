// Verificar setores disponíveis
const mysql = require('mysql2/promise');

async function checkSectors() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('🔍 Verificando setores disponíveis...');
    const [sectors] = await connection.execute('SELECT id, nome as name FROM setores ORDER BY id');
    
    console.log('📋 Setores disponíveis:');
    sectors.forEach(s => console.log(`  ID: ${s.id}, Nome: ${s.name}`));
    
    console.log('\n🔍 Verificando categorias disponíveis...');
    const [categories] = await connection.execute('SELECT id, name FROM categories ORDER BY id');
    
    console.log('📋 Categorias disponíveis:');
    categories.forEach(c => console.log(`  ID: ${c.id}, Nome: ${c.name}`));
    
    console.log('\n🔍 Verificando subsetores disponíveis...');
    const [subsectors] = await connection.execute('SELECT id, nome as name, setor_id as sector_id FROM subsetores ORDER BY id');
    
    console.log('📋 Subsetores disponíveis:');
    subsectors.forEach(s => console.log(`  ID: ${s.id}, Nome: ${s.name}, Setor: ${s.sector_id}`));
    
    await connection.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkSectors();