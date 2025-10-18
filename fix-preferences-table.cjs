const mysql = require('mysql2/promise');

async function fixPreferencesTable() {
  let connection;

  try {
    console.log('🔧 Corrigindo tabela user_preferences...\n');

    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco de dados\n');
    
    // Adicionar campos faltantes
    try {
      await connection.execute('ALTER TABLE user_preferences ADD COLUMN items_per_page INT DEFAULT 25');
      console.log('✅ Campo items_per_page adicionado');
    } catch(e) {
      if(e.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ Campo items_per_page já existe');
      } else {
        console.log('❌ Erro items_per_page:', e.message);
      }
    }

    try {
      await connection.execute("ALTER TABLE user_preferences ADD COLUMN timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo'");
      console.log('✅ Campo timezone adicionado');
    } catch(e) {
      if(e.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ Campo timezone já existe');
      } else {
        console.log('❌ Erro timezone:', e.message);
      }
    }

    // Verificar estrutura final
    console.log('\n📋 Estrutura final da tabela user_preferences:');
    const [structure] = await connection.execute('DESCRIBE user_preferences');
    structure.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    console.log('\n🎉 Correção da tabela concluída!');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixPreferencesTable().catch(console.error);