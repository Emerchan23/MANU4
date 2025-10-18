// Simular o comportamento do frontend para deletar empresa

async function testDeleteFromFrontend() {
  try {
    console.log('🌐 Simulando exclusão de empresa pelo frontend...');
    
    // Primeiro, buscar empresas disponíveis
    console.log('\n📋 Buscando empresas disponíveis...');
    const companiesResponse = await fetch('http://localhost:3000/api/companies');
    const companies = await companiesResponse.json();
    
    console.log(`✅ Encontradas ${companies.length} empresas`);
    
    // Mostrar algumas empresas
    console.log('\n📋 Primeiras 5 empresas:');
    companies.slice(0, 5).forEach(company => {
      console.log(`- ${company.nome} (ID: ${company.id}) - CNPJ: ${company.cnpj || 'N/A'}`);
    });
    
    // Tentar deletar uma empresa sem ordens de serviço
    const empresaParaDeletar = companies.find(c => 
      c.nome && (
        c.nome.includes('Teste') || 
        c.nome.includes('API') || 
        c.nome.includes('654654654') ||
        c.nome.includes('Empresa Teste Completa')
      )
    );
    
    if (!empresaParaDeletar) {
      console.log('❌ Nenhuma empresa de teste encontrada para deletar');
      return;
    }
    
    console.log(`\n🗑️ Tentando deletar: ${empresaParaDeletar.nome} (ID: ${empresaParaDeletar.id})`);
    
    // Simular o que o frontend faz - DELETE request
    const deleteResponse = await fetch(`http://localhost:3000/api/companies/${empresaParaDeletar.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log(`📥 Status da resposta: ${deleteResponse.status}`);
    console.log(`📥 Status text: ${deleteResponse.statusText}`);
    
    let responseData;
    try {
      responseData = await deleteResponse.json();
      console.log('📄 Resposta JSON:', JSON.stringify(responseData, null, 2));
    } catch (e) {
      const responseText = await deleteResponse.text();
      console.log('📄 Resposta texto:', responseText);
    }
    
    // Verificar se a empresa foi realmente deletada
    console.log('\n🔍 Verificando se a empresa foi deletada...');
    const checkResponse = await fetch(`http://localhost:3000/api/companies/${empresaParaDeletar.id}`);
    console.log(`📥 Status da verificação: ${checkResponse.status}`);
    
    if (checkResponse.status === 404) {
      console.log('✅ Empresa foi deletada com sucesso!');
    } else {
      console.log('❌ Empresa ainda existe no banco de dados');
    }
    
  } catch (error) {
    console.error('💥 Erro durante o teste:', error.message);
    console.error('💥 Stack:', error.stack);
  }
}

testDeleteFromFrontend();