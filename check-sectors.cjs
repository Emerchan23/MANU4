require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkSectorTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('🔍 Verificando estrutura da tabela sectors...');
    const [structure] = await connection.execute('DESCRIBE sectors');
    console.log('📋 Estrutura da tabela sectors:');
    structure.forEach(field => {
      console.log(`   ${field.Field} - ${field.Type} - ${field.Null} - ${field.Key} - ${field.Default}`);
    });
    
    console.log('\n🔍 Verificando dados na tabela sectors...');
    const [sectors] = await connection.execute('SELECT * FROM sectors LIMIT 5');
    console.log('📊 Primeiros 5 setores:', sectors);
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

checkSectorTable();