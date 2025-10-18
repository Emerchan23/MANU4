const { query } = require('./lib/database.js');

async function checkTables() {
  try {
    console.log('🔍 Verificando tabelas no banco de dados...');
    
    // Verificar se as tabelas existem
    const tables = ['maintenance_schedules', 'equipment', 'maintenance_plans', 'users'];
    
    for (const table of tables) {
      try {
        const result = await query(`SHOW TABLES LIKE '${table}'`);
        if (result.length > 0) {
          console.log(`✅ Tabela '${table}' existe`);
          
          // Verificar estrutura da tabela
          const structure = await query(`DESCRIBE ${table}`);
          console.log(`📋 Estrutura da tabela '${table}':`);
          structure.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
          });
          console.log('');
        } else {
          console.log(`❌ Tabela '${table}' NÃO existe`);
        }
      } catch (error) {
        console.error(`❌ Erro ao verificar tabela '${table}':`, error.message);
      }
    }
    
    // Testar conexão básica
    const testQuery = await query('SELECT 1 as test');
    console.log('✅ Conexão com banco de dados funcionando:', testQuery);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
  process.exit(0);
}

checkTables();