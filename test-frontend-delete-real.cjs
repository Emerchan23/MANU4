// Testar exclusão exatamente como o frontend faz

async function testFrontendDeleteReal() {
  try {
    console.log('🌐 Testando exclusão EXATAMENTE como o frontend...');
    
    // Primeiro, buscar empresas como o frontend faz
    console.log('\n📋 1. Buscando empresas (GET /api/companies)...');
    const companiesResponse = await fetch('http://localhost:3000/api/companies');
    
    if (!companiesResponse.ok) {
      console.error('❌ Erro ao buscar empresas:', companiesResponse.status);
      return;
    }
    
    const companies = await companiesResponse.json();
    console.log(`✅ Encontradas ${companies.length} empresas`);
    
    // Mostrar empresas disponíveis
    console.log('\n📋 Empresas disponíveis:');
    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.nome || company.name} (ID: ${company.id}) - CNPJ: ${company.cnpj || 'N/A'}`);
    });
    
    // Encontrar uma empresa para deletar (sem ordens de serviço)
    const empresaParaDeletar = companies.find(c => 
      c.nome && (
        c.nome.includes('Teste') || 
        c.nome.includes('API') || 
        c.nome.includes('Completa')
      )
    );
    
    if (!empresaParaDeletar) {
      console.log('❌ Nenhuma empresa de teste encontrada para deletar');
      return;
    }
    
    console.log(`\n🎯 Empresa selecionada: ${empresaParaDeletar.nome} (ID: ${empresaParaDeletar.id})`);
    
    // Fazer a requisição DELETE exatamente como o frontend
    console.log('\n🗑️ 2. Enviando DELETE request...');
    console.log(`📡 URL: /api/companies/${empresaParaDeletar.id}`);
    console.log('📡 Método: DELETE');
    console.log('📡 Headers: Content-Type: application/json');
    
    const deleteResponse = await fetch(`http://localhost:3000/api/companies/${empresaParaDeletar.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('\n📥 Resposta recebida:');
    console.log('📥 Status:', deleteResponse.status);
    console.log('📥 Status Text:', deleteResponse.statusText);
    console.log('📥 OK:', deleteResponse.ok);
    console.log('📥 Headers:', Object.fromEntries(deleteResponse.headers.entries()));
    
    let responseData;
    try {
      responseData = await deleteResponse.json();
      console.log('📄 Resposta JSON:', JSON.stringify(responseData, null, 2));
    } catch (jsonError) {
      console.error('❌ Erro ao fazer parse do JSON:', jsonError);
      const textData = await deleteResponse.text();
      console.log('📄 Resposta TEXT:', textData);
    }
    
    // Verificar resultado
    if (deleteResponse.ok) {
      console.log('\n🎉 SUCESSO: Exclusão funcionou!');
      
      // Verificar se empresa foi realmente deletada
      console.log('\n🔍 3. Verificando se empresa foi deletada...');
      const verifyResponse = await fetch(`http://localhost:3000/api/companies`);
      const updatedCompanies = await verifyResponse.json();
      
      const empresaAindaExiste = updatedCompanies.find(c => c.id === empresaParaDeletar.id);
      
      if (empresaAindaExiste) {
        console.log('❌ PROBLEMA: Empresa ainda existe no banco!');
      } else {
        console.log('✅ CONFIRMADO: Empresa foi removida do banco!');
      }
      
    } else {
      console.log('\n❌ ERRO: Exclusão falhou!');
      console.log('❌ Status:', deleteResponse.status);
      console.log('❌ Dados:', responseData);
    }
    
  } catch (error) {
    console.error('💥 Erro durante o teste:', error.message);
    console.error('💥 Stack:', error.stack);
  }
}

testFrontendDeleteReal();