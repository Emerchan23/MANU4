const mysql = require('mysql2/promise');
const fs = require('fs');

async function executeSql() {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('📖 Lendo arquivo SQL...');
    const sql = fs.readFileSync('create-alerts-table.sql', 'utf8');
    
    // Dividir por delimitadores especiais e ponto e vírgula
    const statements = sql
      .split(/DELIMITER \$\$|DELIMITER ;|\$\$/)
      .join('')
      .split(';')
      .filter(s => s.trim() && !s.trim().startsWith('--'));

    console.log(`📝 Executando ${statements.length} comandos SQL...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          await connection.execute(statement);
          console.log(`✅ [${i+1}/${statements.length}] Executado: ${statement.substring(0, 60)}...`);
        } catch (err) {
          if (err.message.includes('already exists') || err.message.includes('Duplicate')) {
            console.log(`⚠️ [${i+1}/${statements.length}] Já existe: ${statement.substring(0, 60)}...`);
          } else {
            console.log(`❌ [${i+1}/${statements.length}] Erro: ${err.message}`);
          }
        }
      }
    }

    await connection.end();
    console.log('🎉 Processo concluído! Tabelas de alertas configuradas.');
    
  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

executeSql();