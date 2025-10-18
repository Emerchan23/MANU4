// Testar exclusão de empresa SEM ordens de serviço

async function testDeleteSemOrdens() {
  try {
    console.log('🌐 Testando exclusão de empresa SEM ordens de serviço...');
    
    // Buscar empresas
    console.log('\n📋 1. Buscando empresas...');
    const companiesResponse = await fetch('http://localhost:3000/api/companies');
    const companies = await companiesResponse.json();
    
    console.log(`✅ Encontradas ${companies.length} empresas`);
    
    // Encontrar uma empresa que provavelmente não tem ordens de serviço
    const empresaParaDeletar = companies.find(c => 
      c.nome && (
        c.nome.includes('Teste Completa') || 
        c.nome.includes('Teste Contratos') ||
        c.nome.includes('Teste Corrigida') ||
        c.nome.includes('Teste Datas') ||
        c.nome.includes('Teste Logs') ||
        c.nome.includes('Teste Simplificada')
      )
    );
    
    if (!empresaParaDeletar) {
      console.log('❌ Nenhuma empresa de teste encontrada');
      return;
    }
    
    console.log(`\n🎯 Tentando deletar: ${empresaParaDeletar.nome} (ID: ${empresaParaDeletar.id})`);
    
    // Fazer DELETE request
    console.log('\n🗑️ 2. Enviando DELETE request...');
    const deleteResponse = await fetch(`http://localhost:3000/api/companies/${empresaParaDeletar.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('\n📥 Resposta:');
    console.log('📥 Status:', deleteResponse.status);
    console.log('📥 OK:', deleteResponse.ok);
    
    const responseData = await deleteResponse.json();
    console.log('📄 Dados:', JSON.stringify(responseData, null, 2));
    
    if (deleteResponse.ok) {
      console.log('\n🎉 SUCESSO: Empresa deletada!');
      
      // Verificar se foi realmente deletada
      console.log('\n🔍 3. Verificando exclusão...');
      const verifyResponse = await fetch('http://localhost:3000/api/companies');
      const updatedCompanies = await verifyResponse.json();
      
      const empresaAindaExiste = updatedCompanies.find(c => c.id === empresaParaDeletar.id);
      
      if (empresaAindaExiste) {
        console.log('❌ PROBLEMA: Empresa ainda existe!');
      } else {
        console.log('✅ CONFIRMADO: Empresa foi removida!');
      }
      
    } else {
      console.log('\n❌ ERRO na exclusão:');
      console.log('❌ Status:', deleteResponse.status);
      console.log('❌ Motivo:', responseData.error);
      
      if (responseData.error && responseData.error.includes('ordens de serviço')) {
        console.log('\n💡 Esta empresa tem ordens de serviço vinculadas.');
        console.log('💡 Isso é normal - o sistema está protegendo a integridade dos dados.');
      }
    }
    
  } catch (error) {
    console.error('💥 Erro:', error.message);
  }
}

testDeleteSemOrdens();