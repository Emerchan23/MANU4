require('dotenv').config();
const { query } = require('./lib/database.js');

async function checkTable() {
  try {
    console.log('🔍 Verificando se tabela notifications existe...');
    
    // Verificar se tabela existe
    const result = await query('SHOW TABLES LIKE "notifications"');
    console.log('📊 Resultado:', result);
    
    if (result.length > 0) {
      console.log('✅ Tabela notifications existe!');
      
      // Verificar estrutura da tabela
      const structure = await query('DESCRIBE notifications');
      console.log('📋 Estrutura da tabela:');
      structure.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
      });
      
      // Verificar dados existentes
      const count = await query('SELECT COUNT(*) as total FROM notifications');
      console.log(`📈 Total de notificações: ${count[0].total}`);
      
      // Mostrar algumas notificações de exemplo
      if (count[0].total > 0) {
        const samples = await query('SELECT * FROM notifications LIMIT 3');
        console.log('📝 Exemplos de notificações:');
        samples.forEach((notif, index) => {
          console.log(`  ${index + 1}. ${notif.title} - Lida: ${notif.read_status ? 'Sim' : 'Não'}`);
        });
      }
    } else {
      console.log('❌ Tabela notifications NÃO existe!');
      console.log('💡 Será necessário criar a tabela usando o schema do banco.');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar tabela:', error.message);
  }
  
  process.exit(0);
}

checkTable();