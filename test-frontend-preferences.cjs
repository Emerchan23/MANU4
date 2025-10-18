const puppeteer = require('puppeteer');

async function testFrontendPreferences() {
    console.log('🚀 Iniciando teste das preferências no frontend...\n');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    
    try {
        const page = await browser.newPage();
        
        // Navegar para a aplicação
        console.log('1. 🌐 Navegando para http://localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
        
        // Aguardar um pouco para a página carregar
        await page.waitForTimeout(3000);
        
        // Verificar se existe um botão de perfil ou configurações
        console.log('2. 🔍 Procurando por elementos de navegação...');
        
        // Tentar encontrar link para perfil/configurações
        const profileSelectors = [
            'a[href*="profile"]',
            'a[href*="perfil"]',
            'a[href*="settings"]',
            'a[href*="configuracoes"]',
            '[data-testid="profile-link"]',
            'button[aria-label*="perfil"]',
            'button[aria-label*="profile"]'
        ];
        
        let profileLink = null;
        for (const selector of profileSelectors) {
            try {
                profileLink = await page.$(selector);
                if (profileLink) {
                    console.log(`✅ Encontrado link de perfil: ${selector}`);
                    break;
                }
            } catch (e) {
                // Continuar procurando
            }
        }
        
        if (profileLink) {
            console.log('3. 👤 Clicando no link do perfil...');
            await profileLink.click();
            await page.waitForTimeout(2000);
        } else {
            // Tentar navegar diretamente para a página de perfil
            console.log('3. 👤 Navegando diretamente para /profile...');
            await page.goto('http://localhost:3000/profile', { waitUntil: 'networkidle2' });
            await page.waitForTimeout(2000);
        }
        
        // Verificar se estamos na página de preferências
        console.log('4. 🎛️ Verificando elementos de preferências...');
        
        // Procurar por elementos de tema
        const themeSelectors = [
            'select[name*="theme"]',
            'select[name*="tema"]',
            '[data-testid="theme-select"]',
            'input[type="radio"][value*="dark"]',
            'input[type="radio"][value*="light"]'
        ];
        
        let themeElement = null;
        for (const selector of themeSelectors) {
            try {
                themeElement = await page.$(selector);
                if (themeElement) {
                    console.log(`✅ Encontrado elemento de tema: ${selector}`);
                    break;
                }
            } catch (e) {
                // Continuar procurando
            }
        }
        
        // Procurar por elementos de itens por página
        const itemsPerPageSelectors = [
            'select[name*="items"]',
            'select[name*="itens"]',
            '[data-testid="items-per-page-select"]',
            'input[name*="itemsPerPage"]'
        ];
        
        let itemsPerPageElement = null;
        for (const selector of itemsPerPageSelectors) {
            try {
                itemsPerPageElement = await page.$(selector);
                if (itemsPerPageElement) {
                    console.log(`✅ Encontrado elemento de itens por página: ${selector}`);
                    break;
                }
            } catch (e) {
                // Continuar procurando
            }
        }
        
        // Testar mudança de tema se encontrado
        if (themeElement) {
            console.log('5. 🎨 Testando mudança de tema...');
            
            // Se for um select
            const tagName = await themeElement.evaluate(el => el.tagName.toLowerCase());
            if (tagName === 'select') {
                await page.select(themeElement, 'dark');
                console.log('   - Tema alterado para "dark"');
                await page.waitForTimeout(1000);
                
                await page.select(themeElement, 'light');
                console.log('   - Tema alterado para "light"');
                await page.waitForTimeout(1000);
            }
        } else {
            console.log('⚠️ Elemento de tema não encontrado');
        }
        
        // Testar mudança de itens por página se encontrado
        if (itemsPerPageElement) {
            console.log('6. 📄 Testando mudança de itens por página...');
            
            const tagName = await itemsPerPageElement.evaluate(el => el.tagName.toLowerCase());
            if (tagName === 'select') {
                await page.select(itemsPerPageElement, '25');
                console.log('   - Itens por página alterado para "25"');
                await page.waitForTimeout(1000);
                
                await page.select(itemsPerPageElement, '50');
                console.log('   - Itens por página alterado para "50"');
                await page.waitForTimeout(1000);
            }
        } else {
            console.log('⚠️ Elemento de itens por página não encontrado');
        }
        
        // Procurar por botão de salvar
        console.log('7. 💾 Procurando botão de salvar...');
        const saveSelectors = [
            'button[type="submit"]',
            'button:contains("Salvar")',
            'button:contains("Save")',
            '[data-testid="save-button"]'
        ];
        
        let saveButton = null;
        for (const selector of saveSelectors) {
            try {
                saveButton = await page.$(selector);
                if (saveButton) {
                    console.log(`✅ Encontrado botão de salvar: ${selector}`);
                    await saveButton.click();
                    console.log('   - Botão de salvar clicado');
                    await page.waitForTimeout(2000);
                    break;
                }
            } catch (e) {
                // Continuar procurando
            }
        }
        
        // Verificar se há mensagens de sucesso
        console.log('8. ✅ Verificando mensagens de feedback...');
        const successSelectors = [
            '.toast',
            '.alert-success',
            '.success-message',
            '[data-testid="success-message"]'
        ];
        
        for (const selector of successSelectors) {
            try {
                const successElement = await page.$(selector);
                if (successElement) {
                    const text = await successElement.evaluate(el => el.textContent);
                    console.log(`✅ Mensagem de sucesso encontrada: "${text}"`);
                }
            } catch (e) {
                // Continuar procurando
            }
        }
        
        console.log('\n🎉 Teste do frontend concluído!');
        console.log('\n📋 RESUMO:');
        console.log(`- Elemento de tema: ${themeElement ? '✅ ENCONTRADO' : '❌ NÃO ENCONTRADO'}`);
        console.log(`- Elemento de itens por página: ${itemsPerPageElement ? '✅ ENCONTRADO' : '❌ NÃO ENCONTRADO'}`);
        console.log(`- Botão de salvar: ${saveButton ? '✅ ENCONTRADO' : '❌ NÃO ENCONTRADO'}`);
        
        // Aguardar um pouco antes de fechar
        await page.waitForTimeout(5000);
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
    } finally {
        await browser.close();
    }
}

// Executar o teste
testFrontendPreferences().catch(console.error);