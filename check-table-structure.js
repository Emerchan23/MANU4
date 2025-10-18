const mysql = require('mysql2/promise');
const fs = require('fs');

async function checkTableStructure() {
  try {
    // Ler configuração do banco
    const envContent = fs.readFileSync('.env', 'utf8');
    const dbConfig = {};
    
    envContent.split('\n').forEach(line => {
      if (line.includes('DB_')) {
        const [key, value] = line.split('=');
        if (key && value) {
          dbConfig[key.trim()] = value.trim();
        }
      }
    });
    
    console.log('🔍 Conectando ao banco de dados...');
    
    const connection = await mysql.createConnection({
      host: dbConfig.DB_HOST || 'localhost',
      user: dbConfig.DB_USER || 'root',
      password: dbConfig.DB_PASSWORD || '',
      database: dbConfig.DB_NAME || 'sistema_manutencao'
    });
    
    console.log('✅ Conectado ao banco!');
    
    // Verificar estrutura da tabela empresas
    console.log('\n📋 Estrutura da tabela empresas:');
    const [columns] = await connection.execute('DESCRIBE empresas');
    
    columns.forEach(col => {
      console.log(`- ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}${col.Key ? ` - ${col.Key}` : ''}`);
    });
    
    // Verificar se existe tabela companies também
    console.log('\n🔍 Verificando se existe tabela companies...');
    try {
      const [companiesColumns] = await connection.execute('DESCRIBE companies');
      console.log('\n📋 Estrutura da tabela companies:');
      companiesColumns.forEach(col => {
        console.log(`- ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}${col.Key ? ` - ${col.Key}` : ''}`);
      });
    } catch (err) {
      console.log('❌ Tabela companies não existe');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkTableStructure();