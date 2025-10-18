const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🧪 Testando funcionalidade de tema e itens por página...');

const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

async function testThemeAndItemsPerPage() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      console.log('\n1. 📊 Verificando estrutura da tabela user_preferences...');
      
      db.all("PRAGMA table_info(user_preferences)", (err, columns) => {
        if (err) {
          console.error('❌ Erro ao verificar estrutura:', err);
          return reject(err);
        }
        
        console.log('✅ Colunas da tabela user_preferences:');
        columns.forEach(col => {
          console.log(`   - ${col.name}: ${col.type} ${col.notnull ? '(NOT NULL)' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
        });
        
        console.log('\n2. 🔍 Verificando preferências atuais do usuário...');
        
        db.get("SELECT * FROM user_preferences WHERE user_id = 1", (err, row) => {
          if (err) {
            console.error('❌ Erro ao buscar preferências:', err);
            return reject(err);
          }
          
          if (row) {
            console.log('✅ Preferências encontradas:');
            console.log(`   - Tema: ${row.theme}`);
            console.log(`   - Itens por página: ${row.itemsPerPage}`);
            console.log(`   - Idioma: ${row.language}`);
            console.log(`   - Notificações: ${row.notifications}`);
            console.log(`   - Timezone: ${row.timezone}`);
          } else {
            console.log('⚠️ Nenhuma preferência encontrada para o usuário 1');
          }
          
          console.log('\n3. 🧪 Testando salvamento de diferentes temas...');
          
          const themes = ['light', 'dark', 'system'];
          const itemsPerPageOptions = [10, 25, 50, 100];
          
          let testIndex = 0;
          
          function testNextCombination() {
            if (testIndex >= themes.length * itemsPerPageOptions.length) {
              console.log('\n✅ Todos os testes concluídos com sucesso!');
              console.log('\n4. 📋 Resumo dos testes:');
              console.log('   - ✅ Estrutura da tabela verificada');
              console.log('   - ✅ Salvamento de temas funcionando');
              console.log('   - ✅ Salvamento de itens por página funcionando');
              console.log('   - ✅ Todas as combinações testadas');
              
              db.close();
              resolve();
              return;
            }
            
            const themeIndex = Math.floor(testIndex / itemsPerPageOptions.length);
            const itemsIndex = testIndex % itemsPerPageOptions.length;
            const theme = themes[themeIndex];
            const itemsPerPage = itemsPerPageOptions[itemsIndex];
            
            console.log(`\n   Testando: tema="${theme}", itens="${itemsPerPage}"`);
            
            db.run(`
              INSERT OR REPLACE INTO user_preferences 
              (user_id, theme, language, notifications, itemsPerPage, timezone, dashboardLayout, created_at, updated_at)
              VALUES (1, ?, 'pt-BR', 1, ?, 'America/Sao_Paulo', 'default', datetime('now'), datetime('now'))
            `, [theme, itemsPerPage], function(err) {
              if (err) {
                console.error(`   ❌ Erro ao salvar ${theme}/${itemsPerPage}:`, err);
                return reject(err);
              }
              
              // Verificar se foi salvo corretamente
              db.get("SELECT theme, itemsPerPage FROM user_preferences WHERE user_id = 1", (err, row) => {
                if (err) {
                  console.error(`   ❌ Erro ao verificar ${theme}/${itemsPerPage}:`, err);
                  return reject(err);
                }
                
                if (row && row.theme === theme && row.itemsPerPage === itemsPerPage) {
                  console.log(`   ✅ Salvo com sucesso: tema="${row.theme}", itens="${row.itemsPerPage}"`);
                } else {
                  console.error(`   ❌ Erro na verificação: esperado tema="${theme}", itens="${itemsPerPage}", obtido tema="${row?.theme}", itens="${row?.itemsPerPage}"`);
                  return reject(new Error('Dados não salvos corretamente'));
                }
                
                testIndex++;
                setTimeout(testNextCombination, 100); // Pequeno delay entre testes
              });
            });
          }
          
          testNextCombination();
        });
      });
    });
  });
}

testThemeAndItemsPerPage()
  .then(() => {
    console.log('\n🎉 Teste de tema e itens por página concluído com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erro no teste:', error);
    process.exit(1);
  });