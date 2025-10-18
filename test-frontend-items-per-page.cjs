const puppeteer = require('puppeteer');

async function testFrontendItemsPerPage() {
    console.log('🧪 Testando campo "Itens por página" no frontend...\n');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    
    try {
        const page = await browser.newPage();
        
        // Interceptar requisições para monitorar chamadas à API
        const apiCalls = [];
        page.on('request', request => {
            if (request.url().includes('/api/profile')) {
                apiCalls.push({
                    method: request.method(),
                    url: request.url(),
                    postData: request.postData()
                });
            }
        });
        
        // Interceptar respostas para verificar dados retornados
        const apiResponses = [];
        page.on('response', async response => {
            if (response.url().includes('/api/profile')) {
                try {
                    const responseData = await response.json();
                    apiResponses.push({
                        status: response.status(),
                        data: responseData
                    });
                } catch (e) {
                    // Ignorar erros de parsing JSON
                }
            }
        });
        
        console.log('1. 🌐 Navegando para http://localhost:3000/perfil...');
        await page.goto('http://localhost:3000/perfil', { waitUntil: 'networkidle2' });
        
        // Aguardar carregamento
        await page.waitForTimeout(3000);
        
        console.log('2. 🔍 Procurando pela aba "Preferências"...');
        
        // Tentar clicar na aba Preferências
        const preferencesTab = await page.$('button[value="preferences"], [data-value="preferences"], button:contains("Preferências")');
        if (preferencesTab) {
            console.log('✅ Aba "Preferências" encontrada, clicando...');
            await preferencesTab.click();
            await page.waitForTimeout(2000);
        } else {
            console.log('⚠️ Tentando encontrar aba por texto...');
            const tabs = await page.$$('button');
            for (const tab of tabs) {
                const text = await tab.evaluate(el => el.textContent);
                if (text && text.includes('Preferências')) {
                    console.log('✅ Aba "Preferências" encontrada por texto, clicando...');
                    await tab.click();
                    await page.waitForTimeout(2000);
                    break;
                }
            }
        }
        
        console.log('3. 🔍 Procurando pelo campo "Itens por página"...');
        
        // Procurar pelo select de itens por página
        const itemsPerPageSelectors = [
            'select[name*="itemsPerPage"]',
            'select[name*="items"]',
            'select:has(option[value="25"])',
            'select:has(option[value="50"])',
            '[data-testid="items-per-page"]'
        ];
        
        let itemsPerPageSelect = null;
        for (const selector of itemsPerPageSelectors) {
            try {
                itemsPerPageSelect = await page.$(selector);
                if (itemsPerPageSelect) {
                    console.log(`✅ Campo "Itens por página" encontrado: ${selector}`);
                    break;
                }
            } catch (e) {
                // Continuar procurando
            }
        }
        
        if (!itemsPerPageSelect) {
            console.log('⚠️ Procurando por qualquer select na página...');
            const allSelects = await page.$$('select');
            console.log(`Encontrados ${allSelects.length} elementos select na página`);
            
            for (let i = 0; i < allSelects.length; i++) {
                const select = allSelects[i];
                const options = await select.$$('option');
                const optionValues = [];
                
                for (const option of options) {
                    const value = await option.evaluate(el => el.value);
                    optionValues.push(value);
                }
                
                console.log(`Select ${i + 1}: opções [${optionValues.join(', ')}]`);
                
                // Se encontrar um select com valores típicos de itens por página
                if (optionValues.some(val => ['10', '25', '50', '100'].includes(val))) {
                    itemsPerPageSelect = select;
                    console.log(`✅ Campo "Itens por página" identificado pelo conteúdo (Select ${i + 1})`);
                    break;
                }
            }
        }
        
        if (itemsPerPageSelect) {
            console.log('4. 📊 Verificando valor atual...');
            const currentValue = await itemsPerPageSelect.evaluate(el => el.value);
            console.log(`   Valor atual: ${currentValue}`);
            
            console.log('5. 🔄 Testando alteração para 50...');
            await page.select(itemsPerPageSelect, '50');
            await page.waitForTimeout(1000);
            
            const newValue = await itemsPerPageSelect.evaluate(el => el.value);
            console.log(`   Novo valor: ${newValue}`);
            
            console.log('6. 💾 Procurando botão "Salvar Preferências"...');
            
            const saveButtonSelectors = [
                'button:contains("Salvar Preferências")',
                'button:contains("Salvar")',
                'button[type="submit"]',
                '[data-testid="save-preferences"]'
            ];
            
            let saveButton = null;
            for (const selector of saveButtonSelectors) {
                try {
                    if (selector.includes(':contains')) {
                        // Para seletores com :contains, usar evaluate
                        const buttons = await page.$$('button');
                        for (const button of buttons) {
                            const text = await button.evaluate(el => el.textContent);
                            if (text && text.includes('Salvar')) {
                                saveButton = button;
                                console.log(`✅ Botão "Salvar" encontrado por texto: "${text}"`);
                                break;
                            }
                        }
                        if (saveButton) break;
                    } else {
                        saveButton = await page.$(selector);
                        if (saveButton) {
                            console.log(`✅ Botão "Salvar" encontrado: ${selector}`);
                            break;
                        }
                    }
                } catch (e) {
                    // Continuar procurando
                }
            }
            
            if (saveButton) {
                console.log('7. 💾 Clicando em "Salvar Preferências"...');
                
                // Limpar arrays de monitoramento
                apiCalls.length = 0;
                apiResponses.length = 0;
                
                await saveButton.click();
                await page.waitForTimeout(3000);
                
                console.log('8. 📡 Verificando chamadas à API...');
                console.log(`   Chamadas realizadas: ${apiCalls.length}`);
                
                apiCalls.forEach((call, index) => {
                    console.log(`   Chamada ${index + 1}:`);
                    console.log(`     Método: ${call.method}`);
                    console.log(`     URL: ${call.url}`);
                    if (call.postData) {
                        try {
                            const data = JSON.parse(call.postData);
                            console.log(`     Dados enviados:`, JSON.stringify(data, null, 2));
                        } catch (e) {
                            console.log(`     Dados enviados: ${call.postData}`);
                        }
                    }
                });
                
                console.log('9. 📥 Verificando respostas da API...');
                apiResponses.forEach((response, index) => {
                    console.log(`   Resposta ${index + 1}:`);
                    console.log(`     Status: ${response.status}`);
                    console.log(`     Dados:`, JSON.stringify(response.data, null, 2));
                });
                
                console.log('10. 🔄 Recarregando página para verificar persistência...');
                await page.reload({ waitUntil: 'networkidle2' });
                await page.waitForTimeout(3000);
                
                // Navegar novamente para a aba de preferências
                const preferencesTabReload = await page.$('button[value="preferences"], [data-value="preferences"]');
                if (preferencesTabReload) {
                    await preferencesTabReload.click();
                    await page.waitForTimeout(2000);
                } else {
                    const tabs = await page.$$('button');
                    for (const tab of tabs) {
                        const text = await tab.evaluate(el => el.textContent);
                        if (text && text.includes('Preferências')) {
                            await tab.click();
                            await page.waitForTimeout(2000);
                            break;
                        }
                    }
                }
                
                // Verificar se o valor foi mantido
                const itemsPerPageSelectReload = await page.$('select:has(option[value="25"])') || 
                                                 await page.$('select:has(option[value="50"])');
                
                if (itemsPerPageSelectReload) {
                    const finalValue = await itemsPerPageSelectReload.evaluate(el => el.value);
                    console.log(`11. ✅ Valor após recarregar: ${finalValue}`);
                    
                    if (finalValue === '50') {
                        console.log('🎉 SUCESSO! O campo "Itens por página" está funcionando corretamente!');
                    } else {
                        console.log('❌ PROBLEMA: O valor não foi mantido após recarregar a página');
                    }
                } else {
                    console.log('⚠️ Não foi possível verificar o valor após recarregar');
                }
                
            } else {
                console.log('❌ Botão "Salvar Preferências" não encontrado');
            }
            
        } else {
            console.log('❌ Campo "Itens por página" não encontrado');
        }
        
        console.log('\n📋 RESUMO DO TESTE:');
        console.log(`- Chamadas à API: ${apiCalls.length}`);
        console.log(`- Respostas da API: ${apiResponses.length}`);
        
        // Aguardar um pouco antes de fechar
        console.log('\n⏳ Aguardando 10 segundos antes de fechar o navegador...');
        await page.waitForTimeout(10000);
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        await browser.close();
    }
}

testFrontendItemsPerPage().catch(console.error);