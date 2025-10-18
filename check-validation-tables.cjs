const mysql = require('mysql2/promise');

async function checkValidationTables() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root', 
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco');
    
    // Verificar se as tabelas de validação existem
    const tables = ['entity_relationships', 'validation_logs', 'validation_rules', 'dependency_cache'];
    
    for (const table of tables) {
      try {
        const [result] = await connection.execute(`SHOW TABLES LIKE '${table}'`);
        if (result.length > 0) {
          console.log(`✅ Tabela ${table} existe`);
          const [count] = await connection.execute(`SELECT COUNT(*) as total FROM ${table}`);
          console.log(`   📊 Registros: ${count[0].total}`);
        } else {
          console.log(`❌ Tabela ${table} NÃO existe`);
        }
      } catch (err) {
        console.log(`❌ Erro ao verificar ${table}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkValidationTables().catch(console.error);