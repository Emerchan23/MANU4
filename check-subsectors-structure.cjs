const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSubsectorsStructure() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao banco MariaDB...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance',
      port: parseInt(process.env.DB_PORT || '3306')
    });

    console.log('✅ Conectado ao banco com sucesso!');

    // Verificar estrutura da tabela subsectors
    console.log('\n🏗️ Estrutura da tabela SUBSECTORS:');
    const [subsectorsStructure] = await connection.execute('DESCRIBE subsectors');
    console.table(subsectorsStructure);
    
    console.log('\n📊 Dados na tabela SUBSECTORS:');
    const [subsectorsData] = await connection.execute('SELECT * FROM subsectors LIMIT 5');
    console.table(subsectorsData);

  } catch (error) {
    console.error('❌ Erro ao verificar estrutura da tabela subsectors:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

checkSubsectorsStructure();