// Script para preenchimento automático do formulário de agendamento
(function() {
    console.log('🚀 Iniciando preenchimento automático do formulário...');
    
    // Aguardar um pouco para garantir que a página carregou
    setTimeout(() => {
        try {
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
                        reject(new Error(`Elemento ${selector} não encontrado`));
                    }, timeout);
                });
            }
            
            // Função para preencher select
            function fillSelect(selector, value) {
                const select = document.querySelector(selector);
                if (select) {
                    // Procurar pela opção que contém o valor
                    const options = Array.from(select.options);
                    const option = options.find(opt => 
                        opt.text.toLowerCase().includes(value.toLowerCase()) ||
                        opt.value.toLowerCase().includes(value.toLowerCase())
                    );
                    
                    if (option) {
                        select.value = option.value;
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        console.log(`✅ ${selector} preenchido com: ${option.text}`);
                        return true;
                    } else {
                        console.log(`❌ Opção não encontrada para ${selector}: ${value}`);
                        console.log('Opções disponíveis:', options.map(opt => opt.text));
                        return false;
                    }
                } else {
                    console.log(`❌ Select não encontrado: ${selector}`);
                    return false;
                }
            }
            
            // Função para preencher input
            function fillInput(selector, value) {
                const input = document.querySelector(selector);
                if (input) {
                    input.value = value;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`✅ ${selector} preenchido com: ${value}`);
                    return true;
                } else {
                    console.log(`❌ Input não encontrado: ${selector}`);
                    return false;
                }
            }
            
            // Função para preencher textarea
            function fillTextarea(selector, value) {
                const textarea = document.querySelector(selector);
                if (textarea) {
                    textarea.value = value;
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    textarea.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`✅ ${selector} preenchido com: ${value}`);
                    return true;
                } else {
                    console.log(`❌ Textarea não encontrado: ${selector}`);
                    return false;
                }
            }
            
            // Aguardar formulário carregar e preencher campos
            waitForElement('form').then(() => {
                console.log('📋 Formulário encontrado, iniciando preenchimento...');
                
                // Aguardar um pouco mais para garantir que todos os selects carregaram
                setTimeout(() => {
                    // 1. Empresa
                    fillSelect('select[name="company_id"], #company_id, select:has(option[value*="techmed"]), select:has(option:contains("TechMed"))', 'TechMed');
                    
                    // 2. Equipamento
                    setTimeout(() => {
                        fillSelect('select[name="equipment_id"], #equipment_id, select:has(option:contains("Ventilador")), select:has(option:contains("Pulmonar"))', 'Ventilador');
                    }, 500);
                    
                    // 3. Tipo de Manutenção
                    setTimeout(() => {
                        fillSelect('select[name="maintenance_type"], #maintenance_type, select:has(option:contains("Preventiva"))', 'Preventiva');
                    }, 1000);
                    
                    // 4. Template
                    setTimeout(() => {
                        fillInput('input[name="template"], #template, input[placeholder*="template"]', 'Calibração de Instrumentos');
                    }, 1500);
                    
                    // 5. Descrição do Serviço
                    setTimeout(() => {
                        fillTextarea('textarea[name="description"], #description, textarea[placeholder*="descrição"]', 'Manutenção preventiva completa do ventilador pulmonar');
                    }, 2000);
                    
                    // 6. Data Agendada
                    setTimeout(() => {
                        fillInput('input[name="scheduled_date"], #scheduled_date, input[type="date"]', '2025-02-15');
                    }, 2500);
                    
                    // 7. Prioridade
                    setTimeout(() => {
                        fillSelect('select[name="priority"], #priority, select:has(option:contains("Alta"))', 'Alta');
                    }, 3000);
                    
                    // 8. Valor Estimado
                    setTimeout(() => {
                        fillInput('input[name="estimated_cost"], #estimated_cost, input[placeholder*="valor"], input[placeholder*="custo"]', '850.00');
                    }, 3500);
                    
                    // 9. Responsável
                    setTimeout(() => {
                        fillInput('input[name="responsible"], #responsible, input[placeholder*="responsável"]', 'Teste Usuario');
                    }, 4000);
                    
                    // 10. Recorrência
                    setTimeout(() => {
                        fillSelect('select[name="recurrence_type"], #recurrence_type, select:has(option:contains("Semanal"))', 'Semanal');
                    }, 4500);
                    
                    // 11. Intervalo
                    setTimeout(() => {
                        fillInput('input[name="recurrence_interval"], #recurrence_interval, input[type="number"]', '1');
                    }, 5000);
                    
                    // 12. Observações
                    setTimeout(() => {
                        fillTextarea('textarea[name="observations"], #observations, textarea[placeholder*="observações"]', 'Teste completo de todos os campos do formulário');
                    }, 5500);
                    
                    // 13. Submeter formulário
                    setTimeout(() => {
                        console.log('📤 Tentando submeter o formulário...');
                        
                        // Procurar botão de submit
                        const submitButton = document.querySelector('button[type="submit"], input[type="submit"], button:contains("Criar"), button:contains("Salvar"), button:contains("Agendar")');
                        
                        if (submitButton) {
                            console.log('🎯 Botão de submit encontrado, clicando...');
                            submitButton.click();
                            console.log('✅ Formulário submetido!');
                        } else {
                            console.log('❌ Botão de submit não encontrado');
                            console.log('Tentando submeter o formulário diretamente...');
                            const form = document.querySelector('form');
                            if (form) {
                                form.submit();
                                console.log('✅ Formulário submetido diretamente!');
                            } else {
                                console.log('❌ Formulário não encontrado para submissão');
                            }
                        }
                    }, 6000);
                    
                }, 1000);
                
            }).catch(error => {
                console.error('❌ Erro ao aguardar formulário:', error);
            });
            
        } catch (error) {
            console.error('❌ Erro durante o preenchimento:', error);
        }
    }, 1000);
})();