const puppeteer = require('puppeteer');

async function automateAppointmentCreation() {
    console.log('🚀 Iniciando automação do agendamento...');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    
    try {
        const page = await browser.newPage();
        
        // Navegar para a página de novo agendamento
        console.log('📍 Navegando para http://localhost:3000/agendamentos/novo');
        await page.goto('http://localhost:3000/agendamentos/novo', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Aguardar a página carregar completamente
        await page.waitForTimeout(3000);
        
        console.log('📝 Preenchendo formulário automaticamente...');
        
        // Função auxiliar para aguardar elemento e preencher
        async function fillField(selector, value, type = 'input') {
            try {
                await page.waitForSelector(selector, { timeout: 10000 });
                
                if (type === 'select') {
                    await page.select(selector, value);
                } else {
                    await page.click(selector);
                    await page.keyboard.down('Control');
                    await page.keyboard.press('KeyA');
                    await page.keyboard.up('Control');
                    await page.type(selector, value);
                }
                
                console.log(`✅ Campo preenchido: ${selector} = ${value}`);
                await page.waitForTimeout(500);
            } catch (error) {
                console.log(`⚠️ Erro ao preencher ${selector}: ${error.message}`);
            }
        }
        
        // Preencher campos do formulário
        
        // 1. Empresa - TechMed Soluções
        try {
            const companySelectors = [
                'select[name="company"]',
                'select[name="empresa"]', 
                '#company',
                '#empresa',
                '[data-testid="company-select"]'
            ];
            
            for (const selector of companySelectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 2000 });
                    await page.select(selector, '1'); // Assumindo que TechMed tem ID 1
                    console.log('✅ Empresa selecionada: TechMed Soluções');
                    break;
                } catch (e) {
                    continue;
                }
            }
        } catch (error) {
            console.log('⚠️ Tentando método alternativo para empresa...');
        }
        
        // 2. Equipamento - Ventilador Pulmonar
        try {
            const equipmentSelectors = [
                'select[name="equipment"]',
                'select[name="equipamento"]',
                '#equipment',
                '#equipamento',
                '[data-testid="equipment-select"]'
            ];
            
            for (const selector of equipmentSelectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 2000 });
                    await page.select(selector, '1'); // Assumindo que Ventilador tem ID 1
                    console.log('✅ Equipamento selecionado: Ventilador Pulmonar');
                    break;
                } catch (e) {
                    continue;
                }
            }
        } catch (error) {
            console.log('⚠️ Tentando método alternativo para equipamento...');
        }
        
        // 3. Tipo de Manutenção - Preventiva
        await fillField('select[name="maintenanceType"], select[name="tipo"], #maintenanceType, #tipo', '1', 'select');
        
        // 4. Template - Calibração de Instrumentos
        await fillField('select[name="template"], #template', '1', 'select');
        
        // 5. Descrição do Serviço
        await fillField('textarea[name="description"], textarea[name="descricao"], #description, #descricao', 'Manutenção preventiva completa do ventilador pulmonar');
        
        // 6. Data Agendada - 15/02/2025
        await fillField('input[name="scheduledDate"], input[name="dataAgendada"], #scheduledDate, #dataAgendada', '2025-02-15');
        
        // 7. Prioridade - Alta
        await fillField('select[name="priority"], select[name="prioridade"], #priority, #prioridade', 'ALTA', 'select');
        
        // 8. Valor Estimado - R$ 850,00
        await fillField('input[name="estimatedValue"], input[name="valorEstimado"], #estimatedValue, #valorEstimado', '850.00');
        
        // 9. Responsável - Teste Usuario
        await fillField('select[name="responsible"], select[name="responsavel"], #responsible, #responsavel', '1', 'select');
        
        // 10. Recorrência - Semanal
        await fillField('select[name="recurrence"], select[name="recorrencia"], #recurrence, #recorrencia', 'SEMANAL', 'select');
        
        // 11. Intervalo - 1
        await fillField('input[name="interval"], input[name="intervalo"], #interval, #intervalo', '1');
        
        // 12. Observações
        await fillField('textarea[name="observations"], textarea[name="observacoes"], #observations, #observacoes', 'Teste completo de todos os campos do formulário');
        
        console.log('📤 Submetendo formulário...');
        
        // Submeter o formulário
        const submitSelectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:has-text("Salvar")',
            'button:has-text("Criar")',
            'button:has-text("Agendar")',
            '.btn-primary',
            '#submit-btn'
        ];
        
        for (const selector of submitSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 2000 });
                await page.click(selector);
                console.log('✅ Formulário submetido!');
                break;
            } catch (e) {
                continue;
            }
        }
        
        // Aguardar resposta/redirecionamento
        await page.waitForTimeout(3000);
        
        console.log('🎉 Automação concluída com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro durante a automação:', error);
    } finally {
        await browser.close();
    }
}

// Executar a automação
automateAppointmentCreation().catch(console.error);