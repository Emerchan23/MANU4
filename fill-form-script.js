// Script para preencher automaticamente o formulário de agendamento
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

// Função para simular evento de mudança
function triggerChange(element) {
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('input', { bubbles: true }));
}

// Função principal de preenchimento
async function fillForm() {
  try {
    console.log('📋 Preenchendo formulário...');

    // 1. Empresa Prestadora
    console.log('1️⃣ Selecionando empresa...');
    const empresaSelect = await waitForElement('select[name="companyId"]');
    empresaSelect.value = '1'; // TechMed Soluções
    triggerChange(empresaSelect);
    console.log('✅ Empresa selecionada: TechMed Soluções');

    // Aguardar um pouco para carregar equipamentos
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Equipamento
    console.log('2️⃣ Selecionando equipamento...');
    const equipamentoSelect = await waitForElement('select[name="equipmentId"]');
    equipamentoSelect.value = '3'; // Ventilador Pulmonar
    triggerChange(equipamentoSelect);
    console.log('✅ Equipamento selecionado: Ventilador Pulmonar');

    // 3. Tipo de Manutenção
    console.log('3️⃣ Selecionando tipo de manutenção...');
    const tipoSelect = await waitForElement('select[name="maintenanceTypeId"]');
    tipoSelect.value = '1'; // Preventiva
    triggerChange(tipoSelect);
    console.log('✅ Tipo de manutenção: Preventiva');

    // 4. Descrição do Serviço
    console.log('4️⃣ Preenchendo descrição...');
    const descricaoTextarea = await waitForElement('textarea[name="description"]');
    descricaoTextarea.value = 'Manutenção preventiva completa do ventilador pulmonar incluindo verificação de filtros, calibração de sensores, teste de alarmes e limpeza geral do equipamento';
    triggerChange(descricaoTextarea);
    console.log('✅ Descrição preenchida');

    // 5. Data Agendada
    console.log('5️⃣ Definindo data...');
    const dataInput = await waitForElement('input[name="scheduledDate"]');
    dataInput.value = '2025-02-15';
    triggerChange(dataInput);
    console.log('✅ Data agendada: 15/02/2025');

    // 6. Prioridade
    console.log('6️⃣ Definindo prioridade...');
    const prioridadeSelect = await waitForElement('select[name="priority"]');
    prioridadeSelect.value = 'alta';
    triggerChange(prioridadeSelect);
    console.log('✅ Prioridade: Alta');

    // 7. Valor Estimado
    console.log('7️⃣ Definindo valor...');
    const valorInput = await waitForElement('input[name="estimatedValue"]');
    valorInput.value = '850.00';
    triggerChange(valorInput);
    console.log('✅ Valor estimado: R$ 850,00');

    // 8. Responsável
    console.log('8️⃣ Selecionando responsável...');
    const responsavelSelect = await waitForElement('select[name="assignedTo"]');
    responsavelSelect.value = '1'; // Teste Usuario
    triggerChange(responsavelSelect);
    console.log('✅ Responsável: Teste Usuario');

    // 9. Recorrência (se existir)
    try {
      console.log('9️⃣ Definindo recorrência...');
      const recorrenciaSelect = await waitForElement('select[name="recurrenceType"]', 2000);
      recorrenciaSelect.value = 'mensal';
      triggerChange(recorrenciaSelect);
      console.log('✅ Recorrência: Mensal');
    } catch (error) {
      console.log('⚠️ Campo de recorrência não encontrado');
    }

    console.log('🎉 Formulário preenchido com sucesso!');
    console.log('📤 Pronto para submeter...');

    // Aguardar um pouco antes de submeter
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 10. Submeter formulário
    console.log('🚀 Submetendo formulário...');
    const submitButton = await waitForElement('button[type="submit"]');
    submitButton.click();
    console.log('✅ Formulário submetido!');

  } catch (error) {
    console.error('❌ Erro ao preencher formulário:', error);
  }
}

// Executar após carregamento da página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', fillForm);
} else {
  fillForm();
}