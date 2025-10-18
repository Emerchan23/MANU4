// Script para preencher automaticamente o formulário de agendamento
// Execute este script no console do navegador na página de agendamento

(function() {
    console.log('🚀 Iniciando preenchimento automático do formulário...');

    // Função para aguardar elemento aparecer
    function waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Elemento ${selector} não encontrado em ${timeout}ms`));
            }, timeout);
        });
    }

    // Função para definir valor em select
    function setSelectValue(selector, value) {
        const select = document.querySelector(selector);
        if (select) {
            select.value = value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`✅ ${selector} definido como: ${value}`);
            return true;
        }
        console.log(`❌ Select ${selector} não encontrado`);
        return false;
    }

    // Função para definir valor em input
    function setInputValue(selector, value) {
        const input = document.querySelector(selector);
        if (input) {
            input.value = value;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`✅ ${selector} definido como: ${value}`);
            return true;
        }
        console.log(`❌ Input ${selector} não encontrado`);
        return false;
    }

    // Função para definir valor em textarea
    function setTextareaValue(selector, value) {
        const textarea = document.querySelector(selector);
        if (textarea) {
            textarea.value = value;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
            console.log(`✅ ${selector} definido como: ${value}`);
            return true;
        }
        console.log(`❌ Textarea ${selector} não encontrado`);
        return false;
    }

    // Função principal para preencher o formulário
    async function fillForm() {
        try {
            console.log('📝 Preenchendo campos do formulário...');

            // Aguardar um pouco para garantir que a página carregou
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 1. Empresa (TechMed Soluções - ID 1)
            setSelectValue('select[name="company_id"]', '1');
            await new Promise(resolve => setTimeout(resolve, 500));

            // 2. Equipamento (Ventilador Pulmonar)
            // Primeiro verificar se existe um equipamento com "Ventilador" no nome
            const equipmentSelect = document.querySelector('select[name="equipment_id"]');
            if (equipmentSelect) {
                const options = Array.from(equipmentSelect.options);
                const ventiladorOption = options.find(option => 
                    option.text.toLowerCase().includes('ventilador') || 
                    option.text.toLowerCase().includes('pulmonar')
                );
                if (ventiladorOption) {
                    setSelectValue('select[name="equipment_id"]', ventiladorOption.value);
                } else {
                    // Se não encontrar, usar o primeiro equipamento disponível
                    if (options.length > 1) {
                        setSelectValue('select[name="equipment_id"]', options[1].value);
                    }
                }
            }
            await new Promise(resolve => setTimeout(resolve, 500));

            // 3. Tipo de Manutenção (Preventiva - ID 1)
            setSelectValue('select[name="maintenance_type_id"]', '1');
            await new Promise(resolve => setTimeout(resolve, 500));

            // 4. Template (se existir)
            const templateSelect = document.querySelector('select[name="template"]');
            if (templateSelect && templateSelect.options.length > 1) {
                // Procurar por "Calibração" ou usar o primeiro disponível
                const options = Array.from(templateSelect.options);
                const calibracaoOption = options.find(option => 
                    option.text.toLowerCase().includes('calibração') ||
                    option.text.toLowerCase().includes('calibracao')
                );
                if (calibracaoOption) {
                    setSelectValue('select[name="template"]', calibracaoOption.value);
                } else {
                    setSelectValue('select[name="template"]', options[1].value);
                }
            }
            await new Promise(resolve => setTimeout(resolve, 500));

            // 5. Descrição do Serviço
            setTextareaValue('textarea[name="description"]', 'Manutenção preventiva completa do ventilador pulmonar - verificação de todos os componentes, calibração de sensores e teste de funcionamento.');

            // 6. Data Agendada (15/02/2025)
            setInputValue('input[name="scheduled_date"]', '2025-02-15');

            // 7. Prioridade (Alta)
            setSelectValue('select[name="priority"]', 'ALTA');

            // 8. Valor Estimado (R$ 850,00)
            setInputValue('input[name="estimated_value"]', '850.00');

            // 9. Responsável
            setInputValue('input[name="responsible"]', 'Teste Usuario');

            // 10. Recorrência (Semanal)
            setSelectValue('select[name="recurrence_type"]', 'Semanal');
            await new Promise(resolve => setTimeout(resolve, 300));

            // 11. Intervalo (1)
            setInputValue('input[name="recurrence_interval"]', '1');

            // 12. Observações
            setTextareaValue('textarea[name="observations"]', 'Teste completo de todos os campos do formulário - agendamento criado automaticamente para validação do sistema.');

            console.log('✅ Todos os campos foram preenchidos!');
            console.log('🎯 Agora vou submeter o formulário...');

            // Aguardar um pouco antes de submeter
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 13. Submeter o formulário
            const submitButton = document.querySelector('button[type="submit"]') || 
                                document.querySelector('input[type="submit"]') ||
                                document.querySelector('button:contains("Criar")') ||
                                document.querySelector('button:contains("Salvar")') ||
                                document.querySelector('.btn-primary');

            if (submitButton) {
                console.log('🚀 Submetendo formulário...');
                submitButton.click();
                
                // Aguardar resposta
                setTimeout(() => {
                    if (window.location.href.includes('agendamentos') && !window.location.href.includes('novo')) {
                        console.log('🎉 Formulário submetido com sucesso! Redirecionado para lista de agendamentos.');
                    } else {
                        console.log('⏳ Aguardando resposta do servidor...');
                    }
                }, 2000);
            } else {
                console.log('❌ Botão de submit não encontrado');
                console.log('Botões disponíveis:', document.querySelectorAll('button'));
            }

        } catch (error) {
            console.error('❌ Erro ao preencher formulário:', error);
        }
    }

    // Executar o preenchimento
    fillForm();

})();