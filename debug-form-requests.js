// Script para interceptar e debugar requisições do formulário
// Adicione este script na página de edição de equipamentos para monitorar o que está sendo enviado

(function() {
    console.log('🔍 Debug script carregado - monitorando requisições...');
    
    // Interceptar fetch original
    const originalFetch = window.fetch;
    
    window.fetch = function(...args) {
        const [url, options] = args;
        
        // Verificar se é uma requisição para a API de equipamentos
        if (url && url.includes('/api/equipment/')) {
            console.log('🚀 Interceptando requisição para:', url);
            console.log('📤 Método:', options?.method || 'GET');
            
            if (options?.body) {
                try {
                    const bodyData = JSON.parse(options.body);
                    console.log('📊 Dados sendo enviados:');
                    console.log('   - name:', bodyData.name);
                    console.log('   - category_id:', bodyData.category_id);
                    console.log('   - sector_id:', bodyData.sector_id);
                    console.log('   - subsector_id:', bodyData.subsector_id, bodyData.subsector_id ? '✅' : '❌');
                    console.log('   - voltage:', bodyData.voltage, bodyData.voltage ? '✅' : '❌');
                    console.log('   - manufacturer:', bodyData.manufacturer);
                    console.log('   - model:', bodyData.model);
                    console.log('   - status:', bodyData.status);
                    console.log('📋 Payload completo:', bodyData);
                } catch (e) {
                    console.log('📋 Body (não JSON):', options.body);
                }
            }
        }
        
        // Chamar fetch original e interceptar resposta
        return originalFetch.apply(this, args).then(response => {
            if (url && url.includes('/api/equipment/')) {
                console.log('📥 Resposta recebida:', response.status, response.statusText);
                
                // Clonar resposta para poder ler o body sem consumir o stream
                const clonedResponse = response.clone();
                clonedResponse.json().then(data => {
                    console.log('📊 Dados da resposta:', data);
                    if (data.success && data.data) {
                        console.log('✅ Equipamento salvo com:');
                        console.log('   - subsector_id:', data.data.subsector_id);
                        console.log('   - voltage:', data.data.voltage);
                    }
                }).catch(e => {
                    console.log('❌ Erro ao parsear resposta:', e);
                });
            }
            
            return response;
        });
    };
    
    // Monitorar mudanças no formulário
    function monitorFormChanges() {
        const form = document.querySelector('form');
        if (form) {
            console.log('📝 Formulário encontrado, monitorando mudanças...');
            
            // Monitorar submissão do formulário
            form.addEventListener('submit', function(e) {
                console.log('🚀 Formulário sendo submetido!');
                
                // Capturar dados do formulário
                const formData = new FormData(form);
                const formObject = {};
                for (let [key, value] of formData.entries()) {
                    formObject[key] = value;
                }
                console.log('📋 Dados do formulário:', formObject);
            });
            
            // Monitorar mudanças nos campos específicos
            const subsectorSelect = document.querySelector('select[name="subsector_id"], #subsector_id');
            const voltageSelect = document.querySelector('select[name="voltage"], #voltage');
            
            if (subsectorSelect) {
                console.log('🎯 Campo subsector_id encontrado');
                subsectorSelect.addEventListener('change', function(e) {
                    console.log('🔄 Subsetor alterado para:', e.target.value);
                });
            } else {
                console.log('❌ Campo subsector_id NÃO encontrado');
            }
            
            if (voltageSelect) {
                console.log('🎯 Campo voltage encontrado');
                voltageSelect.addEventListener('change', function(e) {
                    console.log('🔄 Voltagem alterada para:', e.target.value);
                });
            } else {
                console.log('❌ Campo voltage NÃO encontrado');
            }
        } else {
            console.log('❌ Formulário não encontrado, tentando novamente em 1s...');
            setTimeout(monitorFormChanges, 1000);
        }
    }
    
    // Iniciar monitoramento quando a página carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', monitorFormChanges);
    } else {
        monitorFormChanges();
    }
    
    console.log('✅ Debug script ativo - verifique o console durante o uso do formulário');
})();

// Função para verificar estado atual dos campos
function checkCurrentFormState() {
    console.log('🔍 Verificando estado atual do formulário...');
    
    const categorySelect = document.querySelector('select');
    const subsectorSelect = document.querySelector('select[name="subsector_id"]');
    const voltageSelect = document.querySelector('select[name="voltage"]');
    
    console.log('📊 Estado dos campos:');
    console.log('   - Categoria selecionada:', categorySelect?.value || 'Nenhuma');
    console.log('   - Subsetor selecionado:', subsectorSelect?.value || 'Nenhum');
    console.log('   - Voltagem selecionada:', voltageSelect?.value || 'Nenhuma');
    console.log('   - Campo voltagem visível:', voltageSelect?.offsetParent !== null);
}

// Disponibilizar função globalmente
window.checkCurrentFormState = checkCurrentFormState;

console.log('💡 Use checkCurrentFormState() no console para verificar o estado atual dos campos');