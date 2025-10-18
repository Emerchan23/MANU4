const mysql = require('mysql2/promise');

async function testPreferencesManual() {
    console.log('🧪 Teste manual das preferências do sistema...\n');
    
    let connection;
    
    try {
        // Conectar ao banco
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'hospital_maintenance'
        });
        
        console.log('✅ Conectado ao banco de dados\n');
        
        // 1. Verificar preferências atuais
        console.log('1. 📊 Verificando preferências atuais do usuário...');
        const [currentPrefs] = await connection.execute(
            'SELECT * FROM user_preferences WHERE user_id = 1'
        );
        
        if (currentPrefs.length > 0) {
            const prefs = currentPrefs[0];
            console.log('✅ Preferências encontradas:');
            console.log(`   - Tema: ${prefs.theme}`);
            console.log(`   - Idioma: ${prefs.language}`);
            console.log(`   - Itens por página: ${prefs.items_per_page}`);
            console.log(`   - Notificações: ${prefs.notifications_enabled ? 'Ativadas' : 'Desativadas'}`);
            console.log(`   - Fuso horário: ${prefs.timezone}`);
        } else {
            console.log('⚠️ Nenhuma preferência encontrada');
        }
        
        // 2. Testar mudança de tema para 'light'
        console.log('\n2. 🎨 Testando mudança de tema para "light"...');
        await connection.execute(`
            INSERT INTO user_preferences (
                user_id, theme, language, notifications_enabled, 
                dashboard_layout, items_per_page, timezone,
                created_at, updated_at
            ) VALUES (1, 'light', 'pt-BR', true, 'default', 25, 'America/Sao_Paulo', NOW(), NOW())
            ON DUPLICATE KEY UPDATE 
                theme = 'light',
                updated_at = NOW()
        `);
        console.log('✅ Tema alterado para "light"');
        
        // Aguardar um pouco
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 3. Testar mudança de tema para 'dark'
        console.log('\n3. 🌙 Testando mudança de tema para "dark"...');
        await connection.execute(`
            UPDATE user_preferences SET 
                theme = 'dark',
                updated_at = NOW()
            WHERE user_id = 1
        `);
        console.log('✅ Tema alterado para "dark"');
        
        // Aguardar um pouco
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 4. Testar mudança de itens por página para 50
        console.log('\n4. 📄 Testando mudança de itens por página para 50...');
        await connection.execute(`
            UPDATE user_preferences SET 
                items_per_page = 50,
                updated_at = NOW()
            WHERE user_id = 1
        `);
        console.log('✅ Itens por página alterado para 50');
        
        // Aguardar um pouco
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 5. Testar mudança de itens por página para 10
        console.log('\n5. 📋 Testando mudança de itens por página para 10...');
        await connection.execute(`
            UPDATE user_preferences SET 
                items_per_page = 10,
                updated_at = NOW()
            WHERE user_id = 1
        `);
        console.log('✅ Itens por página alterado para 10');
        
        // 6. Verificar preferências finais
        console.log('\n6. 🔍 Verificando preferências finais...');
        const [finalPrefs] = await connection.execute(
            'SELECT * FROM user_preferences WHERE user_id = 1'
        );
        
        if (finalPrefs.length > 0) {
            const prefs = finalPrefs[0];
            console.log('✅ Preferências finais:');
            console.log(`   - Tema: ${prefs.theme}`);
            console.log(`   - Idioma: ${prefs.language}`);
            console.log(`   - Itens por página: ${prefs.items_per_page}`);
            console.log(`   - Notificações: ${prefs.notifications_enabled ? 'Ativadas' : 'Desativadas'}`);
            console.log(`   - Fuso horário: ${prefs.timezone}`);
            console.log(`   - Última atualização: ${prefs.updated_at}`);
        }
        
        console.log('\n🎉 TESTE MANUAL CONCLUÍDO!');
        console.log('\n📋 INSTRUÇÕES PARA TESTE NO NAVEGADOR:');
        console.log('1. Abra http://localhost:3000');
        console.log('2. Clique no botão "SAIR" no canto superior direito');
        console.log('3. Navegue para http://localhost:3000/perfil');
        console.log('4. Clique na aba "Preferências"');
        console.log('5. Teste alterar o tema entre Claro/Escuro/Sistema');
        console.log('6. Teste alterar itens por página entre 10/25/50/100');
        console.log('7. Clique em "Salvar Preferências"');
        console.log('8. Verifique se as mudanças são aplicadas imediatamente');
        console.log('\n🔧 Se não funcionar, verifique:');
        console.log('- Se o contexto UserPreferencesProvider está sendo usado');
        console.log('- Se a API /api/profile está respondendo corretamente');
        console.log('- Se o useTheme está aplicando o tema');
        console.log('- Se as listagens estão usando preferences.itemsPerPage');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

testPreferencesManual().catch(console.error);