// Usar fetch nativo do Node.js 18+

async function testDeleteEmpresa() {
  try {
    console.log('🧪 Testando exclusão de empresa...');
    
    // Primeiro, vamos buscar uma empresa existente
    console.log('📋 Buscando empresas existentes...');
    const getResponse = await fetch('http://localhost:3000/api/companies');
    
    if (!getResponse.ok) {
      console.error('❌ Erro ao buscar empresas:', getResponse.status, getResponse.statusText);
      return;
    }
    
    const empresas = await getResponse.json();
    console.log('✅ Empresas encontradas:', empresas.length);
    
    if (empresas.length === 0) {
      console.log('❌ Nenhuma empresa encontrada para testar');
      return;
    }
    
    // Pegar uma empresa para teste (vamos usar a última para não afetar dados importantes)
    const empresa = empresas[empresas.length - 1];
    console.log('🏢 Empresa selecionada para teste de exclusão:', empresa.name || empresa.nome);
    console.log('🆔 ID:', empresa.id);
    
    // Tentar deletar
    console.log('🗑️ Enviando requisição DELETE...');
    const deleteResponse = await fetch(`http://localhost:3000/api/companies/${empresa.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📥 Status da resposta:', deleteResponse.status);
    console.log('📥 Status text:', deleteResponse.statusText);
    
    const responseText = await deleteResponse.text();
    console.log('📄 Resposta completa:', responseText);
    
    if (deleteResponse.ok) {
      console.log('✅ Exclusão bem-sucedida!');
      
      // Verificar se realmente foi deletada
      console.log('🔍 Verificando se empresa foi realmente deletada...');
      const checkResponse = await fetch(`http://localhost:3000/api/companies/${empresa.id}`);
      if (checkResponse.status === 404) {
        console.log('✅ Confirmado: Empresa foi deletada com sucesso!');
      } else {
        console.log('⚠️ Empresa ainda existe no banco de dados');
      }
    } else {
      console.log('❌ Erro na exclusão');
      try {
        const errorData = JSON.parse(responseText);
        console.log('📄 Dados do erro:', errorData);
      } catch (e) {
        console.log('📄 Resposta não é JSON válido');
      }
    }
    
  } catch (error) {
    console.error('💥 Erro no teste:', error.message);
    console.error('💥 Stack:', error.stack);
  }
}

testDeleteEmpresa();