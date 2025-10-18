const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar ao banco de dados
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Testando funcionalidade do tema...\n');

// Função para testar a funcionalidade do tema
async function testThemeFunctionality() {
  return new Promise((resolve, reject) => {
    // 1. Verificar estrutura da tabela user_preferences
    console.log('1. Verificando estrutura da tabela user_preferences:');
    db.all("PRAGMA table_info(user_preferences)", (err, columns) => {
      if (err) {
        console.error('❌ Erro ao verificar estrutura:', err);
        reject(err);
        return;
      }
      
      console.log('Colunas encontradas:');
      columns.forEach(col => {
        console.log(`  - ${col.name} (${col.type})`);
      });
      
      // 2. Verificar preferências atuais do usuário
      console.log('\n2. Verificando preferências atuais do usuário:');
      db.get("SELECT * FROM user_preferences WHERE user_id = 1", (err, row) => {
        if (err) {
          console.error('❌ Erro ao buscar preferências:', err);
          reject(err);
          return;
        }
        
        if (row) {
          console.log('Preferências encontradas:');
          console.log(`  - theme: ${row.theme}`);
          console.log(`  - language: ${row.language}`);
          console.log(`  - items_per_page: ${row.items_per_page}`);
          console.log(`  - timezone: ${row.timezone}`);
          console.log(`  - notifications_enabled: ${row.notifications_enabled}`);
          console.log(`  - dashboard_layout: ${row.dashboard_layout}`);
        } else {
          console.log('❌ Nenhuma preferência encontrada para o usuário 1');
        }
        
        // 3. Testar salvamento de diferentes temas
        console.log('\n3. Testando salvamento de diferentes temas:');
        
        const themes = ['light', 'dark', 'system'];
        let testIndex = 0;
        
        function testNextTheme() {
          if (testIndex >= themes.length) {
            console.log('\n✅ Todos os temas foram testados com sucesso!');
            resolve();
            return;
          }
          
          const theme = themes[testIndex];
          console.log(`\n   Testando tema: ${theme}`);
          
          // Atualizar tema
          db.run(
            "UPDATE user_preferences SET theme = ? WHERE user_id = 1",
            [theme],
            function(err) {
              if (err) {
                console.error(`❌ Erro ao salvar tema ${theme}:`, err);
                reject(err);
                return;
              }
              
              // Verificar se foi salvo
              db.get("SELECT theme FROM user_preferences WHERE user_id = 1", (err, row) => {
                if (err) {
                  console.error(`❌ Erro ao verificar tema ${theme}:`, err);
                  reject(err);
                  return;
                }
                
                if (row && row.theme === theme) {
                  console.log(`   ✅ Tema ${theme} salvo com sucesso`);
                } else {
                  console.log(`   ❌ Tema ${theme} não foi salvo corretamente`);
                }
                
                testIndex++;
                testNextTheme();
              });
            }
          );
        }
        
        testNextTheme();
      });
    });
  });
}

// Executar teste
testThemeFunctionality()
  .then(() => {
    console.log('\n🎯 Teste de funcionalidade do tema concluído!');
    db.close();
  })
  .catch((error) => {
    console.error('\n❌ Erro durante o teste:', error);
    db.close();
  });