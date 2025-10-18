import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  port: process.env.DB_PORT || 3306
};

async function checkSectorsTable() {
  console.log('🔍 Verificando estrutura da tabela sectors...');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Verificar estrutura da tabela
    const [columns] = await connection.execute('DESCRIBE sectors');
    
    console.log('\n📊 Estrutura da tabela sectors:');
    console.table(columns);
    
    // Verificar dados existentes
    const [data] = await connection.execute('SELECT * FROM sectors LIMIT 5');
    
    console.log('\n📋 Dados existentes na tabela sectors:');
    console.table(data);
    
    await connection.end();
    
  } catch (error) {
    console.error('💥 Erro ao verificar tabela sectors:', error.message);
  }
  
  console.log('\n🏁 Verificação finalizada.');
}

checkSectorsTable();