// Script para interceptar e monitorar requisições do formulário de equipamentos
// Foco no campo subsector_id

console.log('🔍 Script de debug para subsector_id iniciado');

// Interceptar fetch original
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, options] = args;
  
  // Monitorar apenas requisições PUT para equipment
  if (url.includes('/api/equipment/') && options?.method === 'PUT') {
    console.log('🚀 [DEBUG] Interceptando requisição PUT para equipment:');
    console.log('📍 URL:', url);
    
    if (options.body) {
      try {
        const bodyData = JSON.parse(options.body);
        console.log('📦 [DEBUG] Payload completo:', bodyData);
        console.log('🎯 [DEBUG] subsector_id enviado:', bodyData.subsector_id);
        console.log('🏢 [DEBUG] sector_id enviado:', bodyData.sector_id);
        console.log('⚡ [DEBUG] voltage enviado:', bodyData.voltage);
        
        // Verificar se subsector_id está presente e válido
        if (bodyData.subsector_id) {
          console.log('✅ [DEBUG] subsector_id está presente no payload');
          console.log('🔢 [DEBUG] Tipo do subsector_id:', typeof bodyData.subsector_id);
        } else {
          console.log('❌ [DEBUG] subsector_id está ausente ou null/undefined no payload');
        }
      } catch (e) {
        console.log('❌ [DEBUG] Erro ao parsear body:', e);
      }
    }
  }
  
  // Executar fetch original e monitorar resposta
  return originalFetch.apply(this, args).then(response => {
    if (url.includes('/api/equipment/') && options?.method === 'PUT') {
      console.log('📥 [DEBUG] Resposta recebida:', response.status);
      
      // Clonar resposta para ler o body sem afetar o original
      const clonedResponse = response.clone();
      clonedResponse.json().then(data => {
        console.log('📋 [DEBUG] Dados da resposta:', data);
        if (data.data) {
          console.log('🎯 [DEBUG] subsector_id na resposta:', data.data.subsector_id);
        }
      }).catch(e => {
        console.log('❌ [DEBUG] Erro ao ler resposta:', e);
      });
    }
    
    return response;
  });
};

// Monitorar mudanças no formulário
function monitorFormChanges() {
  const subsectorSelect = document.querySelector('[name="subsector_id"]');
  const sectorSelect = document.querySelector('[name="sector_id"]');
  
  if (subsectorSelect) {
    console.log('🎯 [DEBUG] Campo subsector encontrado');
    subsectorSelect.addEventListener('change', (e) => {
      console.log('🔄 [DEBUG] Subsector alterado para:', e.target.value);
    });
  } else {
    console.log('❌ [DEBUG] Campo subsector não encontrado');
  }
  
  if (sectorSelect) {
    console.log('🏢 [DEBUG] Campo sector encontrado');
    sectorSelect.addEventListener('change', (e) => {
      console.log('🔄 [DEBUG] Sector alterado para:', e.target.value);
    });
  } else {
    console.log('❌ [DEBUG] Campo sector não encontrado');
  }
}

// Aguardar carregamento da página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', monitorFormChanges);
} else {
  monitorFormChanges();
}

// Também tentar após um delay para componentes React
setTimeout(monitorFormChanges, 2000);

console.log('✅ [DEBUG] Script de monitoramento configurado');
console.log('📝 [DEBUG] Para testar:');
console.log('1. Altere o setor no formulário');
console.log('2. Selecione um subsetor');
console.log('3. Salve o formulário');
console.log('4. Observe os logs acima');