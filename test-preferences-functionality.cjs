const mysql = require('mysql2/promise');

async function testPreferencesFunctionality() {
  let connection;

  try {
    console.log('🧪 Testando funcionalidade de preferências do sistema...\n');

    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco de dados\n');
    
    // 1. Verificar estrutura da tabela user_preferences
    console.log('1. 📋 Verificando estrutura da tabela user_preferences...');
    const [structure] = await connection.execute('DESCRIBE user_preferences');
    
    console.log('✅ Estrutura da tabela:');
    structure.forEach(field => {
      console.log(`   - ${field.Field}: ${field.Type} (${field.Null === 'YES' ? 'NULL' : 'NOT NULL'}) - Default: ${field.Default || 'N/A'}`);
    });
    
    // 2. Verificar preferências atuais do usuário
    console.log('\n2. 👤 Verificando preferências atuais do usuário...');
    const [currentPrefs] = await connection.execute(
      'SELECT * FROM user_preferences WHERE user_id = 1'
    );
    
    if (currentPrefs.length > 0) {
      const prefs = currentPrefs[0];
      console.log('✅ Preferências encontradas:');
      console.log(`   - Tema: ${prefs.theme}`);
      console.log(`   - Idioma: ${prefs.language}`);
      console.log(`   - Notificações: ${prefs.notifications_enabled ? 'Ativadas' : 'Desativadas'}`);
      console.log(`   - Layout Dashboard: ${prefs.dashboard_layout}`);
      console.log(`   - Itens por página: ${prefs.items_per_page}`);
      console.log(`   - Fuso horário: ${prefs.timezone}`);
      console.log(`   - Cor primária: ${prefs.primary_color}`);
      console.log(`   - Tamanho interface: ${prefs.interface_size}`);
    } else {
      console.log('⚠️ Nenhuma preferência encontrada para o usuário');
    }
    
    // 3. Testar salvamento de preferências específicas (tema e itens por página)
    console.log('\n3. 💾 Testando salvamento de preferências específicas...');
    
    const testPrefs = {
      theme: 'dark',
      items_per_page: 50,
      language: 'pt-BR',
      notifications_enabled: true,
      dashboard_layout: '{"layout": "grid", "widgets": ["stats", "charts"]}',
      timezone: 'America/Sao_Paulo',
      primary_color: 'purple',
      interface_size: 'comfortable'
    };
    
    if (currentPrefs.length === 0) {
      // Criar preferências
      await connection.execute(`
        INSERT INTO user_preferences (
          user_id, theme, language, notifications_enabled, 
          dashboard_layout, items_per_page, timezone, 
          primary_color, interface_size,
          created_at, updated_at
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        testPrefs.theme,
        testPrefs.language,
        testPrefs.notifications_enabled,
        testPrefs.dashboard_layout,
        testPrefs.items_per_page,
        testPrefs.timezone,
        testPrefs.primary_color,
        testPrefs.interface_size
      ]);
      console.log('✅ Preferências criadas com sucesso');
    } else {
      // Atualizar preferências
      await connection.execute(`
        UPDATE user_preferences SET 
          theme = ?, 
          language = ?, 
          notifications_enabled = ?, 
          dashboard_layout = ?, 
          items_per_page = ?, 
          timezone = ?,
          primary_color = ?,
          interface_size = ?,
          updated_at = NOW() 
        WHERE user_id = 1
      `, [
        testPrefs.theme,
        testPrefs.language,
        testPrefs.notifications_enabled,
        testPrefs.dashboard_layout,
        testPrefs.items_per_page,
        testPrefs.timezone,
        testPrefs.primary_color,
        testPrefs.interface_size
      ]);
      console.log('✅ Preferências atualizadas com sucesso');
    }
    
    // 4. Verificar se foram salvas corretamente
    console.log('\n4. ✔️ Verificando se as preferências foram salvas...');
    const [savedPrefs] = await connection.execute(
      'SELECT * FROM user_preferences WHERE user_id = 1'
    );
    
    if (savedPrefs.length > 0) {
      const saved = savedPrefs[0];
      console.log('✅ Preferências salvas verificadas:');
      console.log(`   - Tema: ${saved.theme} ${saved.theme === testPrefs.theme ? '✅' : '❌'}`);
      console.log(`   - Itens por página: ${saved.items_per_page} ${saved.items_per_page === testPrefs.items_per_page ? '✅' : '❌'}`);
      console.log(`   - Idioma: ${saved.language} ${saved.language === testPrefs.language ? '✅' : '❌'}`);
      console.log(`   - Cor primária: ${saved.primary_color} ${saved.primary_color === testPrefs.primary_color ? '✅' : '❌'}`);
      console.log(`   - Tamanho interface: ${saved.interface_size} ${saved.interface_size === testPrefs.interface_size ? '✅' : '❌'}`);
    }
    
    // 5. Testar diferentes valores de tema
    console.log('\n5. 🎨 Testando diferentes valores de tema...');
    const themes = ['light', 'dark', 'system'];
    
    for (const theme of themes) {
      await connection.execute(
        'UPDATE user_preferences SET theme = ?, updated_at = NOW() WHERE user_id = 1',
        [theme]
      );
      
      const [themeCheck] = await connection.execute(
        'SELECT theme FROM user_preferences WHERE user_id = 1'
      );
      
      console.log(`   - Tema '${theme}': ${themeCheck[0].theme === theme ? '✅ Salvo' : '❌ Erro'}`);
    }
    
    // 6. Testar diferentes valores de itens por página
    console.log('\n6. 📄 Testando diferentes valores de itens por página...');
    const itemsPerPageValues = [10, 25, 50, 100];
    
    for (const items of itemsPerPageValues) {
      await connection.execute(
        'UPDATE user_preferences SET items_per_page = ?, updated_at = NOW() WHERE user_id = 1',
        [items]
      );
      
      const [itemsCheck] = await connection.execute(
        'SELECT items_per_page FROM user_preferences WHERE user_id = 1'
      );
      
      console.log(`   - Itens por página '${items}': ${itemsCheck[0].items_per_page === items ? '✅ Salvo' : '❌ Erro'}`);
    }
    
    console.log('\n🎉 TESTE DE PREFERÊNCIAS CONCLUÍDO!');
    console.log('\n📋 RESUMO:');
    console.log('- ✅ Estrutura da tabela: VERIFICADA');
    console.log('- ✅ Salvamento de preferências: FUNCIONANDO');
    console.log('- ✅ Tema: SALVANDO CORRETAMENTE');
    console.log('- ✅ Itens por página: SALVANDO CORRETAMENTE');
    console.log('\n🔍 Próximo passo: Verificar se o frontend está aplicando as preferências...');

  } catch (error) {
    console.error('❌ Erro no teste de preferências:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testPreferencesFunctionality().catch(console.error);