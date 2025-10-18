async function testTemplatesAPI() {
  try {
    console.log('🧪 [TEST] Testando API /api/service-templates...');
    
    const response = await fetch('http://localhost:3000/api/service-templates');
    
    console.log('📊 [TEST] Status da resposta:', response.status);
    console.log('📊 [TEST] Status text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ [TEST] API funcionando! Dados recebidos:');
      console.log('📄 [TEST] Estrutura da resposta:', JSON.stringify(data, null, 2));
      
      if (data.success && data.data) {
        console.log('📋 [TEST] Número de templates:', data.data.length);
        
        if (data.data.length > 0) {
          console.log('📋 [TEST] Primeiro template:', JSON.stringify(data.data[0], null, 2));
        } else {
          console.log('⚠️ [TEST] Nenhum template encontrado no retorno da API');
        }
      } else {
        console.log('⚠️ [TEST] Formato de resposta inesperado');
      }
    } else {
      console.error('❌ [TEST] Erro na API:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ [TEST] Detalhes do erro:', errorText);
    }
  } catch (error) {
    console.error('💥 [TEST] Erro ao testar API:', error.message);
    console.error('💥 [TEST] Stack trace:', error.stack);
  }
}

testTemplatesAPI();