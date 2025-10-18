const mysql = require('mysql2/promise');

async function checkPdfExportsTable() {
  let connection;
  
  try {
    console.log('🔌 Conectando ao banco de dados...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco de dados');
    
    // Verificar estrutura da tabela pdf_exports
    console.log('\n📊 Verificando estrutura da tabela pdf_exports...');
    const [columns] = await connection.execute('DESCRIBE pdf_exports');
    
    console.log('Colunas encontradas:');
    columns.forEach(column => {
      console.log(`  • ${column.Field} (${column.Type}) - ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} - ${column.Key ? column.Key : 'No Key'}`);
    });
    
    // Verificar se a tabela existe
    const [tables] = await connection.execute("SHOW TABLES LIKE 'pdf_exports'");
    
    if (tables.length === 0) {
      console.log('❌ Tabela pdf_exports não existe!');
    } else {
      console.log('✅ Tabela pdf_exports existe');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão com banco fechada');
    }
  }
}

checkPdfExportsTable();