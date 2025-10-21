const mysql = require('mysql2/promise');

async function checkViews() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root', 
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('🔍 Verificando views no banco...');
    const [views] = await connection.execute('SHOW FULL TABLES WHERE Table_type = "VIEW"');
    console.log('Views encontradas:', views);
    
    console.log('\n🔍 Verificando tabelas disponíveis...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('Tabelas:', tables.map(t => Object.values(t)[0]));
    
    await connection.end();
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

checkViews