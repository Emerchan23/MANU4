const mysql = require('mysql2/promise');

async function alterCodeColumn() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('✅ Conectado ao banco de dados');

    // Alterar a coluna code para permitir NULL
    console.log('🔧 Alterando coluna code para permitir NULL...');
    await connection.execute('ALTER TABLE equipment MODIFY COLUMN code VARCHAR(50) NULL');
    
    console.log('✅ Coluna code alterada com sucesso!');

    // Verificar a alteração
    const [structure] = await connection.execute('DESCRIBE equipment');
    const codeColumn = structure.find(col => col.Field === 'code');
    
    console.log('📊 Nova configuração da coluna code:');
    console.log(`  - Permite NULL: ${codeColumn.Null === 'YES' ? 'SIM' : 'NÃO'}`);
    console.log(`  - Default: ${codeColumn.Default || 'NULL'}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

alterCodeColumn();