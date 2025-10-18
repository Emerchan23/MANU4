const mysql = require('mysql2/promise');

async function testPreferencesRemoval() {
  let connection;
  
  try {
    console.log('🧪 Testando remoção dos campos Idioma e Fuso Horário...\n');
    
    // 1. Conectar ao banco de dados
    console.log('1. 🔌 Conectando ao banco de dados...');
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    console.log('✅ Conectado ao banco de dados');
    
    // 2. Verificar preferências atuais
    console.log('\n2. 📋 Verificando preferências atuais...');
    const [currentPrefs] = await connection.execute(
      'SELECT * FROM user_preferences WHERE user_id = 1'
    );
    
    if (currentPrefs.length > 0) {
      const prefs = currentPrefs[0];
      console.log('✅ Preferências encontradas:');
      console.log(`   - Tema: ${prefs.theme}`);
      console.log(`   - Notificações: ${prefs.notifications_enabled ? 'Ativadas' : 'Desativadas'}`);
      console.log(`   - Layout: ${prefs.dashboard_layout}`);
      console.log(`   - Itens por página: ${prefs.items_per_page}`);
      
      // Verificar se os campos removidos ainda existem
      if (prefs.language !== undefined) {
        console.log(`   ⚠️ Campo "language" ainda existe: ${prefs.language}`);
      } else {
        console.log('   ✅ Campo "language" não está sendo usado');
      }
      
      if (prefs.timezone !== undefined) {
        console.log(`   ⚠️ Campo "timezone" ainda existe: ${prefs.timezone}`);
      } else {
        console.log('   ✅ Campo "timezone" não está sendo usado');
      }
    } else {
      console.log('⚠️ Nenhuma preferência encontrada para o usuário 1');
    }
    
    // 3. Testar salvamento apenas com campos permitidos
    console.log('\n3. 💾 Testando salvamento com campos restantes...');
    
    const testPrefs = {
      theme: 'dark',
      notifications_enabled: true,
      dashboard_layout: '{"layout": "default", "widgets": ["stats"]}',
      items_per_page: 50
    };
    
    if (currentPrefs.length === 0) {
      // Criar preferências
      await connection.execute(`
        INSERT INTO user_preferences (
          user_id, theme, notifications_enabled, 
          dashboard_layout, items_per_page,
          created_at, updated_at
        ) VALUES (1, ?, ?, ?, ?, NOW(), NOW())
      `, [
        testPrefs.theme,
        testPrefs.notifications_enabled,
        testPrefs.dashboard_layout,
        testPrefs.items_per_page
      ]);
      console.log('✅ Preferências criadas');
    } else {
      // Atualizar preferências
      await connection.execute(`
        UPDATE user_preferences SET 
          theme = ?, 
          notifications_enabled = ?, 
          dashboard_layout = ?, 
          items_per_page = ?, 
          updated_at = NOW() 
        WHERE user_id = 1
      `, [
        testPrefs.theme,
        testPrefs.notifications_enabled,
        testPrefs.dashboard_layout,
        testPrefs.items_per_page
      ]);
      console.log('✅ Preferências atualizadas');
    }
    
    // 4. Verificar se foram salvas corretamente
    console.log('\n4. ✅ Verificando se as preferências foram salvas...');
    const [savedPrefs] = await connection.execute(
      'SELECT * FROM user_preferences WHERE user_id = 1'
    );
    
    if (savedPrefs.length > 0) {
      const prefs = savedPrefs[0];
      console.log('✅ Preferências salvas com sucesso:');
      console.log(`   - Tema: ${prefs.theme}`);
      console.log(`   - Notificações: ${prefs.notifications_enabled ? 'Ativadas' : 'Desativadas'}`);
      console.log(`   - Layout: ${prefs.dashboard_layout}`);
      console.log(`   - Itens por página: ${prefs.items_per_page}`);
      
      // Verificar se os valores foram salvos corretamente
      console.log('\n🔍 Comparando valores salvos:');
      console.log(`   - Tema: esperado "${testPrefs.theme}", salvo "${prefs.theme}" - ${prefs.theme === testPrefs.theme ? '✅' : '❌'}`);
      console.log(`   - Notificações: esperado ${testPrefs.notifications_enabled}, salvo ${prefs.notifications_enabled} - ${prefs.notifications_enabled === testPrefs.notifications_enabled ? '✅' : '❌'}`);
      console.log(`   - Layout: esperado "${testPrefs.dashboard_layout}", salvo "${prefs.dashboard_layout}" - ${prefs.dashboard_layout === testPrefs.dashboard_layout ? '✅' : '❌'}`);
      console.log(`   - Itens: esperado ${testPrefs.items_per_page}, salvo ${prefs.items_per_page} - ${prefs.items_per_page === testPrefs.items_per_page ? '✅' : '❌'}`);
      
      const success = 
        prefs.theme === testPrefs.theme &&
        Boolean(prefs.notifications_enabled) === testPrefs.notifications_enabled &&
        prefs.dashboard_layout === testPrefs.dashboard_layout &&
        prefs.items_per_page === testPrefs.items_per_page;
        
      if (success) {
        console.log('\n🎉 TESTE PASSOU! Preferências salvas corretamente sem os campos removidos.');
      } else {
        console.log('\n❌ TESTE FALHOU! Alguns valores não foram salvos corretamente.');
      }
    } else {
      console.log('❌ Erro: Preferências não foram encontradas após salvamento');
    }
    
    console.log('\n🎯 Teste de remoção completo!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testPreferencesRemoval().catch(console.error);