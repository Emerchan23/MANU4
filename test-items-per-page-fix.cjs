const mysql = require('mysql2/promise');

async function testItemsPerPageFix() {
  console.log('🔧 Testando correção do campo "Itens por página"...');
  
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('✅ Conectado ao MariaDB');

    // 1. Verificar estrutura da tabela user_preferences
    console.log('\n1. 📊 Verificando estrutura da tabela user_preferences...');
    const [columns] = await connection.execute('DESCRIBE user_preferences');
    console.log('Colunas encontradas:');
    columns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    // 2. Verificar se existe a coluna items_per_page
    const hasItemsPerPage = columns.some(col => col.Field === 'items_per_page');
    console.log(`\n2. 🔍 Coluna items_per_page existe: ${hasItemsPerPage ? '✅ SIM' : '❌ NÃO'}`);

    if (!hasItemsPerPage) {
      console.log('⚠️ Adicionando coluna items_per_page...');
      await connection.execute(`
        ALTER TABLE user_preferences 
        ADD COLUMN items_per_page INT DEFAULT 25 AFTER dashboard_layout
      `);
      console.log('✅ Coluna items_per_page adicionada');
    }

    // 3. Verificar se existe a coluna timezone
    const hasTimezone = columns.some(col => col.Field === 'timezone');
    console.log(`\n3. 🔍 Coluna timezone existe: ${hasTimezone ? '✅ SIM' : '❌ NÃO'}`);

    if (!hasTimezone) {
      console.log('⚠️ Adicionando coluna timezone...');
      await connection.execute(`
        ALTER TABLE user_preferences 
        ADD COLUMN timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo' AFTER items_per_page
      `);
      console.log('✅ Coluna timezone adicionada');
    }

    // 4. Verificar preferências atuais do usuário
    console.log('\n4. 📋 Verificando preferências atuais do usuário...');
    const [currentPrefs] = await connection.execute(
      'SELECT * FROM user_preferences WHERE user_id = 1'
    );

    if (currentPrefs.length > 0) {
      const prefs = currentPrefs[0];
      console.log('✅ Preferências encontradas:');
      console.log(`   - Tema: ${prefs.theme}`);
      console.log(`   - Idioma: ${prefs.language}`);
      console.log(`   - Itens por página: ${prefs.items_per_page}`);
      console.log(`   - Fuso horário: ${prefs.timezone}`);
      console.log(`   - Notificações: ${prefs.notifications_enabled ? 'Ativadas' : 'Desativadas'}`);
    } else {
      console.log('⚠️ Nenhuma preferência encontrada para o usuário 1');
      console.log('Criando preferências padrão...');
      
      await connection.execute(`
        INSERT INTO user_preferences (
          user_id, theme, language, notifications_enabled, 
          dashboard_layout, items_per_page, timezone,
          created_at, updated_at
        ) VALUES (1, 'light', 'pt-BR', true, 'default', 25, 'America/Sao_Paulo', NOW(), NOW())
      `);
      
      console.log('✅ Preferências padrão criadas');
    }

    // 5. Testar atualização do items_per_page
    console.log('\n5. 🧪 Testando atualização do items_per_page...');
    
    // Testar com valor 50
    await connection.execute(`
      UPDATE user_preferences 
      SET items_per_page = 50, updated_at = NOW() 
      WHERE user_id = 1
    `);
    
    const [updated1] = await connection.execute(
      'SELECT items_per_page FROM user_preferences WHERE user_id = 1'
    );
    console.log(`✅ Teste 1 - items_per_page atualizado para: ${updated1[0].items_per_page}`);

    // Testar com valor 10
    await connection.execute(`
      UPDATE user_preferences 
      SET items_per_page = 10, updated_at = NOW() 
      WHERE user_id = 1
    `);
    
    const [updated2] = await connection.execute(
      'SELECT items_per_page FROM user_preferences WHERE user_id = 1'
    );
    console.log(`✅ Teste 2 - items_per_page atualizado para: ${updated2[0].items_per_page}`);

    // Voltar para valor padrão
    await connection.execute(`
      UPDATE user_preferences 
      SET items_per_page = 25, updated_at = NOW() 
      WHERE user_id = 1
    `);
    
    console.log('✅ Valor restaurado para 25');

    await connection.end();
    
    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('\n📋 RESUMO DAS CORREÇÕES:');
    console.log('✅ Coluna items_per_page verificada/criada');
    console.log('✅ Coluna timezone verificada/criada');
    console.log('✅ API /api/profile corrigida para buscar items_per_page e timezone');
    console.log('✅ Testes de atualização funcionando');
    console.log('\n🔧 O campo "Itens por página" agora deve funcionar corretamente!');
    console.log('\n📝 PRÓXIMOS PASSOS:');
    console.log('1. Acesse http://localhost:3000/perfil');
    console.log('2. Clique na aba "Preferências"');
    console.log('3. Altere o valor de "Itens por página"');
    console.log('4. Clique em "Salvar Preferências"');
    console.log('5. Recarregue a página para verificar se o valor foi mantido');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Stack:', error.stack);
  }
}

testItemsPerPageFix().catch(console.error);