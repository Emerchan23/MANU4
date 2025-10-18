// Script para executar automação no navegador
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function executeBrowserAutomation() {
    let browser;
    
    try {
        console.log('🚀 Iniciando automação do navegador...');
        
        // Ler o script de preenchimento
        const scriptPath = path.join(__dirname, 'auto-fill-appointment-final.js');
        const fillScript = fs.readFileSync(scriptPath, 'utf8');
        
        // Iniciar o navegador
        browser = await puppeteer.launch({
            headless: false, // Mostrar o navegador
            defaultViewport: null,
            args: ['--start-maximized']
        });
        
        const page = await browser.newPage();
        
        // Navegar para a página de agendamento
        console.log('📍 Navegando para a página de agendamento...');
        await page.goto('http://localhost:3000/agendamentos/novo', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        console.log('✅ Página carregada');
        
        // Aguardar um pouco para garantir que tudo carregou
        await page.waitForTimeout(2000);
        
        // Executar o script de preenchimento
        console.log('📝 Executando script de preenchimento automático...');
        await page.evaluate(fillScript);
        
        console.log('✅ Script de preenchimento executado');
        
        // Aguardar um tempo para ver o resultado
        console.log('⏳ Aguardando conclusão do preenchimento...');
        await page.waitForTimeout(10000);
        
        console.log('🎉 Automação concluída com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro durante a automação:', error.message);
        throw error;
    } finally {
        if (browser) {
            // Manter o navegador aberto por mais tempo para verificar o resultado
            console.log('🔍 Mantendo navegador aberto para verificação...');
            setTimeout(async () => {
                await browser.close();
                console.log('🔌 Navegador fechado');
            }, 30000);
        }
    }
}

// Executar a automação
executeBrowserAutomation()
    .then(() => {
        console.log('\n✅ Automação executada com sucesso!');
    })
    .catch((error) => {
        console.error('\n❌ Erro na automação:', error);
        process.exit(1);
    });