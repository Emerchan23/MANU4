// Usar fetch nativo do Node.js 18+

async function testUpdateEmpresa() {
  try {
    console.log('🧪 Testando atualização de empresa...');
    
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
    
    // Pegar a primeira empresa
    const empresa = empresas[0];
    console.log('🏢 Empresa selecionada para teste:', empresa.name || empresa.nome);
    console.log('🆔 ID:', empresa.id);
    
    // Dados para atualização (simulando o que o frontend envia)
    const updateData = {
      id: empresa.id,
      name: empresa.name || empresa.nome,
      cnpj: empresa.cnpj,
      contact_person: 'Teste Atualizado',
      phone: '(64) 99999-9999',
      email: 'teste@atualizado.com',
      address: 'Endereço Atualizado, 123',
      specialties: 'Especialidade Teste'
    };
    
    console.log('📦 Dados para atualização:', updateData);
    
    // Tentar atualizar
    console.log('🔄 Enviando requisição PUT...');
    const updateResponse = await fetch('http://localhost:3000/api/companies', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    console.log('📥 Status da resposta:', updateResponse.status);
    console.log('📥 Status text:', updateResponse.statusText);
    
    const responseText = await updateResponse.text();
    console.log('📄 Resposta completa:', responseText);
    
    if (updateResponse.ok) {
      console.log('✅ Atualização bem-sucedida!');
    } else {
      console.log('❌ Erro na atualização');
      try {
        const errorData = JSON.parse(responseText);
        console.log('📄 Dados do erro:', errorData);
      } catch (e) {
        console.log('📄 Resposta não é JSON válido');
      }
    }
    
  } catch (error) {
    console.error('💥 Erro no teste:', error.message);
  }
}

testUpdateEmpresa();