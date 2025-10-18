const mysql = require('mysql2/promise');

async function testSimpleUpdate() {
    console.log('🧪 Teste simples de atualização de preferências...\n');
    
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
        
        // 1. Verificar dados atuais
        console.log('1. 📊 Dados atuais:');
        const [current] = await connection.execute('SELECT * FROM user_preferences WHERE user_id = 1');
        if (current.length > 0) {
            console.log(`   - Tema: ${current[0].theme}`);
            console.log(`   - Itens por página: ${current[0].items_per_page}`);
        }
        
        // 2. Testar update apenas do tema
        console.log('\n2. 🎨 Testando update apenas do tema...');
        await connection.execute(`
            UPDATE user_preferences SET 
                theme = 'dark',
                updated_at = NOW()
            WHERE user_id = 1
        `);
        console.log('✅ Tema atualizado para "dark"');
        
        // 3. Verificar se foi salvo
        const [afterTheme] = await connection.execute('SELECT theme FROM user_preferences WHERE user_id = 1');
        console.log(`   - Tema atual: ${afterTheme[0].theme}`);
        
        // 4. Testar update apenas dos itens por página
        console.log('\n3. 📄 Testando update apenas dos itens por página...');
        await connection.execute(`
            UPDATE user_preferences SET 
                items_per_page = 50,
                updated_at = NOW()
            WHERE user_id = 1
        `);
        console.log('✅ Itens por página atualizado para 50');
        
        // 5. Verificar se foi salvo
        const [afterItems] = await connection.execute('SELECT items_per_page FROM user_preferences WHERE user_id = 1');
        console.log(`   - Itens por página atual: ${afterItems[0].items_per_page}`);
        
        // 6. Testar update de ambos
        console.log('\n4. 🔄 Testando update de ambos...');
        await connection.execute(`
            UPDATE user_preferences SET 
                theme = 'light',
                items_per_page = 25,
                updated_at = NOW()
            WHERE user_id = 1
        `);
        console.log('✅ Ambos atualizados (tema: light, itens: 25)');
        
        // 7. Verificar resultado final
        console.log('\n5. ✅ Resultado final:');
        const [final] = await connection.execute('SELECT theme, items_per_page, updated_at FROM user_preferences WHERE user_id = 1');
        if (final.length > 0) {
            console.log(`   - Tema: ${final[0].theme}`);
            console.log(`   - Itens por página: ${final[0].items_per_page}`);
            console.log(`   - Última atualização: ${final[0].updated_at}`);
        }
        
        console.log('\n🎉 TESTE SIMPLES CONCLUÍDO COM SUCESSO!');
        console.log('\n📋 PRÓXIMOS PASSOS:');
        console.log('1. Verificar se a página /perfil está carregando as preferências');
        console.log('2. Testar se o botão "Salvar Preferências" está funcionando');
        console.log('3. Verificar se o tema está sendo aplicado automaticamente');
        console.log('4. Verificar se as listagens estão respeitando itemsPerPage');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

testSimpleUpdate().catch(console.error);