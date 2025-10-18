import mysql from 'mysql2/promise';

async function checkSubsectors() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  try {
    console.log('Conectado ao banco de dados');
    
    // Verificar se a tabela subsectors existe
    console.log('\nVerificando se a tabela subsectors existe...');
    try {
      const [tables] = await connection.execute("SHOW TABLES LIKE 'subsectors'");
      if (tables.length === 0) {
        console.log('❌ Tabela subsectors não existe');
        
        // Verificar outras tabelas similares
        console.log('\nVerificando tabelas similares...');
        const [allTables] = await connection.execute("SHOW TABLES");
        console.log('Todas as tabelas:');
        allTables.forEach(table => {
          console.log(`- ${Object.values(table)[0]}`);
        });
        
      } else {
        console.log('✅ Tabela subsectors existe');
        
        // Verificar estrutura da tabela
        const [structure] = await connection.execute('DESCRIBE subsectors');
        console.log('\nEstrutura da tabela subsectors:');
        structure.forEach(column => {
          console.log(`- ${column.Field}: ${column.Type}`);
        });
      }
    } catch (error) {
      console.error('Erro ao verificar tabela subsectors:', error.message);
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await connection.end();
  }
}

checkSubsectors();