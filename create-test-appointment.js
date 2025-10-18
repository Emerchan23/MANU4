// Script para criar agendamento de teste preenchendo todos os campos
// Este script simula o preenchimento do formulário via JavaScript

console.log('🔄 Iniciando criação de agendamento de teste...')

// Aguardar a página carregar completamente
setTimeout(() => {
  try {
    // 1. Empresa Prestadora
    const empresaSelect = document.querySelector('select[name="companyId"]')
    if (empresaSelect) {
      empresaSelect.value = '1' // TechMed Soluções
      empresaSelect.dispatchEvent(new Event('change', { bubbles: true }))
      console.log('✅ Empresa selecionada: TechMed Soluções')
    }

    // 2. Equipamento
    setTimeout(() => {
      const equipamentoSelect = document.querySelector('select[name="equipmentId"]')
      if (equipamentoSelect) {
        equipamentoSelect.value = '3' // Ventilador Pulmonar
        equipamentoSelect.dispatchEvent(new Event('change', { bubbles: true }))
        console.log('✅ Equipamento selecionado: Ventilador Pulmonar')
      }
    }, 500)

    // 3. Tipo de Manutenção
    setTimeout(() => {
      const tipoSelect = document.querySelector('select[name="maintenanceTypeId"]')
      if (tipoSelect) {
        tipoSelect.value = '1' // Preventiva
        tipoSelect.dispatchEvent(new Event('change', { bubbles: true }))
        console.log('✅ Tipo de manutenção selecionado: Preventiva')
      }
    }, 1000)

    // 4. Descrição do Serviço
    setTimeout(() => {
      const descricaoTextarea = document.querySelector('textarea[name="description"]')
      if (descricaoTextarea) {
        descricaoTextarea.value = 'Manutenção preventiva completa do ventilador pulmonar incluindo verificação de filtros, calibração de sensores, teste de alarmes e limpeza geral do equipamento'
        descricaoTextarea.dispatchEvent(new Event('input', { bubbles: true }))
        console.log('✅ Descrição preenchida')
      }
    }, 1500)

    // 5. Data Agendada
    setTimeout(() => {
      const dataInput = document.querySelector('input[name="scheduledDate"]')
      if (dataInput) {
        dataInput.value = '2025-02-15'
        dataInput.dispatchEvent(new Event('change', { bubbles: true }))
        console.log('✅ Data agendada: 15/02/2025')
      }
    }, 2000)

    // 6. Prioridade
    setTimeout(() => {
      const prioridadeSelect = document.querySelector('select[name="priority"]')
      if (prioridadeSelect) {
        prioridadeSelect.value = 'alta'
        prioridadeSelect.dispatchEvent(new Event('change', { bubbles: true }))
        console.log('✅ Prioridade selecionada: Alta')
      }
    }, 2500)

    // 7. Valor Estimado
    setTimeout(() => {
      const valorInput = document.querySelector('input[name="estimatedValue"]')
      if (valorInput) {
        valorInput.value = '850.00'
        valorInput.dispatchEvent(new Event('input', { bubbles: true }))
        console.log('✅ Valor estimado: R$ 850,00')
      }
    }, 3000)

    // 8. Responsável
    setTimeout(() => {
      const responsavelSelect = document.querySelector('select[name="assignedTo"]')
      if (responsavelSelect) {
        responsavelSelect.value = '1' // Teste Usuario
        responsavelSelect.dispatchEvent(new Event('change', { bubbles: true }))
        console.log('✅ Responsável selecionado: Teste Usuario')
      }
    }, 3500)

    // 9. Recorrência
    setTimeout(() => {
      const recorrenciaSelect = document.querySelector('select[name="recurrenceType"]')
      if (recorrenciaSelect) {
        recorrenciaSelect.value = 'mensal'
        recorrenciaSelect.dispatchEvent(new Event('change', { bubbles: true }))
        console.log('✅ Recorrência selecionada: Mensal')
      }
    }, 4000)

    // 10. Observações
    setTimeout(() => {
      const observacoesTextarea = document.querySelector('textarea[name="observations"]')
      if (observacoesTextarea) {
        observacoesTextarea.value = 'Agendamento de teste completo para verificar salvamento de todos os campos no banco MariaDB. Este teste inclui todos os campos obrigatórios e opcionais do formulário.'
        observacoesTextarea.dispatchEvent(new Event('input', { bubbles: true }))
        console.log('✅ Observações preenchidas')
      }
    }, 4500)

    // Submeter o formulário
    setTimeout(() => {
      const submitButton = document.querySelector('button[type="submit"]')
      if (submitButton) {
        console.log('🚀 Submetendo formulário...')
        submitButton.click()
      }
    }, 5000)

  } catch (error) {
    console.error('❌ Erro ao preencher formulário:', error)
  }
}, 1000)

console.log('📋 Script de preenchimento carregado. Aguardando execução...')