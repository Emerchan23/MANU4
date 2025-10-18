// SCRIPT PARA CRIAR AGENDAMENTO IMEDIATAMENTE
// Execute este script no console do navegador na página de novo agendamento

async function createAppointmentNow() {
    console.log('🚀 INICIANDO CRIAÇÃO DE AGENDAMENTO...');
    
    try {
        // Aguardar página carregar
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 1. EMPRESA PRESTADORA
        console.log('📝 Preenchendo Empresa Prestadora...');
        const empresaSelect = document.querySelector('select[name="company_id"], select[placeholder*="empresa"], select[aria-label*="empresa"]') || 
                             document.querySelector('select:has(option[value*="TechMed"]), select:has(option:contains("TechMed"))') ||
                             document.querySelector('div[role="combobox"]:has-text("empresa")') ||
                             document.querySelector('[data-testid*="company"], [data-cy*="company"]');
        
        if (empresaSelect) {
            // Se for um select normal
            if (empresaSelect.tagName === 'SELECT') {
                const techmedOption = Array.from(empresaSelect.options).find(opt => 
                    opt.text.includes('TechMed') || opt.value.includes('TechMed')
                );
                if (techmedOption) {
                    empresaSelect.value = techmedOption.value;
                    empresaSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('✅ Empresa selecionada:', techmedOption.text);
                }
            } else {
                // Se for um componente customizado (React Select, etc)
                empresaSelect.click();
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const techmedOption = document.querySelector('div[role="option"]:has-text("TechMed"), li:has-text("TechMed"), [data-value*="TechMed"]');
                if (techmedOption) {
                    techmedOption.click();
                    console.log('✅ Empresa selecionada via componente customizado');
                }
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 2. EQUIPAMENTO
        console.log('📝 Preenchendo Equipamento...');
        const equipamentoSelect = document.querySelector('select[name="equipment_id"], select[placeholder*="equipamento"]') ||
                                 document.querySelector('div[role="combobox"]:has-text("equipamento")');
        
        if (equipamentoSelect) {
            if (equipamentoSelect.tagName === 'SELECT') {
                const ventiladorOption = Array.from(equipamentoSelect.options).find(opt => 
                    opt.text.toLowerCase().includes('ventilador') || opt.text.toLowerCase().includes('pulmonar')
                );
                if (ventiladorOption) {
                    equipamentoSelect.value = ventiladorOption.value;
                    equipamentoSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('✅ Equipamento selecionado:', ventiladorOption.text);
                } else {
                    // Selecionar primeiro equipamento disponível
                    if (equipamentoSelect.options.length > 1) {
                        equipamentoSelect.selectedIndex = 1;
                        equipamentoSelect.dispatchEvent(new Event('change', { bubbles: true }));
                        console.log('✅ Primeiro equipamento selecionado');
                    }
                }
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 3. TIPO DE MANUTENÇÃO
        console.log('📝 Preenchendo Tipo de Manutenção...');
        const tipoSelect = document.querySelector('select[name="maintenance_type"], select[placeholder*="tipo"]') ||
                          document.querySelector('div[role="combobox"]:has-text("tipo")');
        
        if (tipoSelect) {
            if (tipoSelect.tagName === 'SELECT') {
                const preventivaOption = Array.from(tipoSelect.options).find(opt => 
                    opt.text.toLowerCase().includes('preventiva')
                );
                if (preventivaOption) {
                    tipoSelect.value = preventivaOption.value;
                    tipoSelect.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log('✅ Tipo Preventiva selecionado');
                }
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 4. TEMPLATE
        console.log('📝 Preenchendo Template...');
        const templateSelect = document.querySelector('select[name="template"], select[placeholder*="template"]');
        if (templateSelect && templateSelect.options.length > 1) {
            const calibracaoOption = Array.from(templateSelect.options).find(opt => 
                opt.text.toLowerCase().includes('calibração') || opt.text.toLowerCase().includes('instrumentos')
            );
            if (calibracaoOption) {
                templateSelect.value = calibracaoOption.value;
                templateSelect.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('✅ Template Calibração selecionado');
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 5. DESCRIÇÃO DO SERVIÇO
        console.log('📝 Preenchendo Descrição...');
        const descricaoField = document.querySelector('textarea[name="description"], textarea[placeholder*="descrição"], textarea[placeholder*="serviço"]');
        if (descricaoField) {
            descricaoField.value = 'Manutenção preventiva completa do ventilador pulmonar';
            descricaoField.dispatchEvent(new Event('input', { bubbles: true }));
            descricaoField.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('✅ Descrição preenchida');
        }
        
        // 6. DATA AGENDADA
        console.log('📝 Preenchendo Data...');
        const dataField = document.querySelector('input[type="date"], input[name*="date"], input[placeholder*="data"]') ||
                         document.querySelector('input[type="datetime-local"]');
        if (dataField) {
            dataField.value = '2025-02-15';
            dataField.dispatchEvent(new Event('input', { bubbles: true }));
            dataField.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('✅ Data preenchida: 15/02/2025');
        }
        
        // 7. PRIORIDADE
        console.log('📝 Preenchendo Prioridade...');
        const prioridadeSelect = document.querySelector('select[name="priority"], select[placeholder*="prioridade"]');
        if (prioridadeSelect) {
            const altaOption = Array.from(prioridadeSelect.options).find(opt => 
                opt.text.toLowerCase().includes('alta') || opt.value.toLowerCase().includes('alta')
            );
            if (altaOption) {
                prioridadeSelect.value = altaOption.value;
                prioridadeSelect.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('✅ Prioridade Alta selecionada');
            }
        }
        
        // 8. VALOR ESTIMADO
        console.log('📝 Preenchendo Valor...');
        const valorField = document.querySelector('input[name*="cost"], input[name*="valor"], input[placeholder*="valor"]') ||
                          document.querySelector('input[type="number"]');
        if (valorField) {
            valorField.value = '850.00';
            valorField.dispatchEvent(new Event('input', { bubbles: true }));
            valorField.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('✅ Valor preenchido: R$ 850,00');
        }
        
        // 9. RESPONSÁVEL
        console.log('📝 Preenchendo Responsável...');
        const responsavelSelect = document.querySelector('select[name*="responsible"], select[name*="assigned"], select[placeholder*="responsável"]');
        if (responsavelSelect && responsavelSelect.options.length > 1) {
            responsavelSelect.selectedIndex = 1; // Primeiro usuário disponível
            responsavelSelect.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('✅ Responsável selecionado');
        }
        
        // 10. RECORRÊNCIA
        console.log('📝 Preenchendo Recorrência...');
        const recorrenciaSelect = document.querySelector('select[name*="recurrence"], select[placeholder*="recorrência"]');
        if (recorrenciaSelect) {
            const semanalOption = Array.from(recorrenciaSelect.options).find(opt => 
                opt.text.toLowerCase().includes('semanal')
            );
            if (semanalOption) {
                recorrenciaSelect.value = semanalOption.value;
                recorrenciaSelect.dispatchEvent(new Event('change', { bubbles: true }));
                console.log('✅ Recorrência Semanal selecionada');
            }
        }
        
        // 11. INTERVALO
        const intervaloField = document.querySelector('input[name*="interval"], input[placeholder*="intervalo"]');
        if (intervaloField) {
            intervaloField.value = '1';
            intervaloField.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('✅ Intervalo preenchido: 1');
        }
        
        // 12. OBSERVAÇÕES
        console.log('📝 Preenchendo Observações...');
        const observacoesField = document.querySelector('textarea[name*="observations"], textarea[placeholder*="observações"]');
        if (observacoesField) {
            observacoesField.value = 'Teste completo de todos os campos do formulário';
            observacoesField.dispatchEvent(new Event('input', { bubbles: true }));
            observacoesField.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('✅ Observações preenchidas');
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 13. SUBMETER FORMULÁRIO
        console.log('🚀 SUBMETENDO FORMULÁRIO...');
        const submitButton = document.querySelector('button[type="submit"], button:has-text("Criar"), button:has-text("Salvar"), button:has-text("Agendamento")') ||
                           document.querySelector('button[data-testid*="submit"], button[data-cy*="submit"]');
        
        if (submitButton && !submitButton.disabled) {
            submitButton.click();
            console.log('✅ FORMULÁRIO SUBMETIDO!');
            
            // Aguardar resposta
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Verificar se houve sucesso ou erro
            const successMessage = document.querySelector('.success, .alert-success, [data-testid*="success"]');
            const errorMessage = document.querySelector('.error, .alert-error, .alert-danger, [data-testid*="error"]');
            
            if (successMessage) {
                console.log('🎉 AGENDAMENTO CRIADO COM SUCESSO!');
                return { success: true, message: 'Agendamento criado com sucesso!' };
            } else if (errorMessage) {
                console.log('❌ ERRO:', errorMessage.textContent);
                return { success: false, message: errorMessage.textContent };
            } else {
                console.log('⏳ Aguardando confirmação...');
                return { success: true, message: 'Formulário submetido, aguardando confirmação' };
            }
        } else {
            console.log('❌ Botão de submit não encontrado ou desabilitado');
            return { success: false, message: 'Botão de submit não encontrado' };
        }
        
    } catch (error) {
        console.error('❌ ERRO ao criar agendamento:', error);
        return { success: false, message: error.message };
    }
}

// Executar automaticamente
createAppointmentNow().then(result => {
    console.log('📊 RESULTADO FINAL:', result);
});