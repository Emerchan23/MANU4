// Script simplificado para preenchimento do formulário
console.log('🚀 Iniciando preenchimento automático...');

// Aguardar 2 segundos e então preencher
setTimeout(() => {
    // Função para preencher campo por vários seletores possíveis
    function fillField(selectors, value, type = 'input') {
        for (let selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                if (type === 'select') {
                    // Para selects, procurar a opção correta
                    const options = Array.from(element.options);
                    const option = options.find(opt => 
                        opt.text.toLowerCase().includes(value.toLowerCase()) ||
                        opt.value.toLowerCase().includes(value.toLowerCase())
                    );
                    if (option) {
                        element.value = option.value;
                        element.dispatchEvent(new Event('change', { bubbles: true }));
                        console.log(`✅ ${selector} preenchido: ${option.text}`);
                        return true;
                    }
                } else {
                    // Para inputs e textareas
                    element.value = value;
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`✅ ${selector} preenchido: ${value}`);
                    return true;
                }
            }
        }
        console.log(`❌ Campo não encontrado para: ${value}`);
        return false;
    }

    // Preencher campos do formulário
    console.log('📝 Preenchendo campos...');

    // 1. Empresa (TechMed Soluções)
    fillField([
        'select[name="company_id"]',
        '#company_id',
        'select:has(option:contains("TechMed"))'
    ], 'TechMed', 'select');

    setTimeout(() => {
        // 2. Equipamento (Ventilador Pulmonar)
        fillField([
            'select[name="equipment_id"]',
            '#equipment_id',
            'select:has(option:contains("Ventilador"))'
        ], 'Ventilador', 'select');
    }, 500);

    setTimeout(() => {
        // 3. Tipo de Manutenção (Preventiva)
        fillField([
            'select[name="maintenance_type"]',
            '#maintenance_type',
            'select:has(option:contains("Preventiva"))'
        ], 'Preventiva', 'select');
    }, 1000);

    setTimeout(() => {
        // 4. Template
        fillField([
            'input[name="template"]',
            '#template',
            'input[placeholder*="template"]'
        ], 'Calibração de Instrumentos');
    }, 1500);

    setTimeout(() => {
        // 5. Descrição do Serviço
        fillField([
            'textarea[name="description"]',
            '#description',
            'textarea[placeholder*="descrição"]'
        ], 'Manutenção preventiva completa do ventilador pulmonar');
    }, 2000);

    setTimeout(() => {
        // 6. Data Agendada
        fillField([
            'input[name="scheduled_date"]',
            '#scheduled_date',
            'input[type="date"]'
        ], '2025-02-15');
    }, 2500);

    setTimeout(() => {
        // 7. Prioridade (Alta)
        fillField([
            'select[name="priority"]',
            '#priority',
            'select:has(option:contains("Alta"))'
        ], 'Alta', 'select');
    }, 3000);

    setTimeout(() => {
        // 8. Valor Estimado
        fillField([
            'input[name="estimated_cost"]',
            '#estimated_cost',
            'input[placeholder*="valor"]',
            'input[placeholder*="custo"]'
        ], '850.00');
    }, 3500);

    setTimeout(() => {
        // 9. Responsável
        fillField([
            'input[name="responsible"]',
            '#responsible',
            'input[placeholder*="responsável"]'
        ], 'Teste Usuario');
    }, 4000);

    setTimeout(() => {
        // 10. Recorrência (Semanal)
        fillField([
            'select[name="recurrence_type"]',
            '#recurrence_type',
            'select:has(option:contains("Semanal"))'
        ], 'Semanal', 'select');
    }, 4500);

    setTimeout(() => {
        // 11. Intervalo
        fillField([
            'input[name="recurrence_interval"]',
            '#recurrence_interval',
            'input[type="number"]'
        ], '1');
    }, 5000);

    setTimeout(() => {
        // 12. Observações
        fillField([
            'textarea[name="observations"]',
            '#observations',
            'textarea[placeholder*="observações"]'
        ], 'Teste completo de todos os campos do formulário');
    }, 5500);

    setTimeout(() => {
        // 13. Submeter formulário
        console.log('📤 Tentando submeter formulário...');
        
        const submitSelectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:contains("Criar")',
            'button:contains("Salvar")',
            'button:contains("Agendar")',
            '.btn-primary',
            '.submit-btn'
        ];
        
        let submitted = false;
        for (let selector of submitSelectors) {
            const button = document.querySelector(selector);
            if (button && !submitted) {
                console.log(`🎯 Clicando no botão: ${selector}`);
                button.click();
                submitted = true;
                console.log('✅ Formulário submetido!');
                break;
            }
        }
        
        if (!submitted) {
            console.log('❌ Botão de submit não encontrado, tentando submeter form diretamente...');
            const form = document.querySelector('form');
            if (form) {
                form.submit();
                console.log('✅ Formulário submetido diretamente!');
            } else {
                console.log('❌ Formulário não encontrado');
            }
        }
    }, 6000);

}, 2000);