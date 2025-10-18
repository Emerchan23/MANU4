// Testar mensagem de erro melhorada ao tentar deletar empresa com vínculos

async function testDeleteMessage() {
  try {
    console.log('🧪 Testando mensagem de erro melhorada...');
    
    // Buscar empresas
    console.log('\n📋 1. Buscando empresas...');
    const companiesResponse = await fetch('http://localhost:3000/api/companies');
    const companies = await companiesResponse.json();
    
    console.log(`✅ Encontradas ${companies.length} empresas`);
    
    // Encontrar uma empresa que tem ordens de serviço (para testar a mensagem de erro)
    const empresaComOrdens = companies.find(c => 
      c.nome && (
        c.nome.includes('Teste Atualizada') || 
        c.nome.includes('4444') ||
        c.nome.includes('Teste Simples')
      )
    );
    
    if (!empresaComOrdens) {
      console.log('❌ Nenhuma empresa com ordens encontrada para testar');
      return;
    }
    
    console.log(`\n🎯 Testando com empresa: ${empresaComOrdens.nome} (ID: ${empresaComOrdens.id})`);
    
    // Tentar deletar (deve falhar com mensagem melhorada)
    console.log('\n🗑️ 2. Tentando deletar empresa com vínculos...');
    const deleteResponse = await fetch(`http://localhost:3000/api/companies/${empresaComOrdens.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('\n📥 Resposta:');
    console.log('📥 Status:', deleteResponse.status);
    console.log('📥 OK:', deleteResponse.ok);
    
    const responseData = await deleteResponse.json();
    console.log('📄 Dados completos:', JSON.stringify(responseData, null, 2));
    
    if (!deleteResponse.ok && deleteResponse.status === 400) {
      console.log('\n✅ CORRETO: Exclusão foi bloqueada como esperado');
      console.log('📝 Mensagem de erro:', responseData.error);
      console.log('📝 Detalhes:', responseData.details);
      
      if (responseData.serviceOrdersCount) {
        console.log('📊 Quantidade de ordens vinculadas:', responseData.serviceOrdersCount);
        console.log('✅ EXCELENTE: A resposta inclui a quantidade de ordens!');
      }
      
      // Verificar se a mensagem é informativa
      if (responseData.details && responseData.details.includes('possui') && responseData.details.includes('vinculada')) {
        console.log('✅ PERFEITO: Mensagem é clara e informativa!');
      } else {
        console.log('⚠️ Mensagem poderia ser mais clara');
      }
      
    } else {
      console.log('\n❌ PROBLEMA: Resposta inesperada');
      console.log('❌ Status esperado: 400, recebido:', deleteResponse.status);
    }
    
    // Testar também com empresa sem vínculos para garantir que ainda funciona
    console.log('\n📋 3. Testando exclusão de empresa SEM vínculos...');
    const empresaSemOrdens = companies.find(c => 
      c.nome && (
        c.nome.includes('Teste Completa') || 
        c.nome.includes('Teste Contratos') ||
        c.nome.includes('Teste Corrigida')
      )
    );
    
    if (empresaSemOrdens) {
      console.log(`🎯 Testando com: ${empresaSemOrdens.nome} (ID: ${empresaSemOrdens.id})`);
      
      const deleteResponse2 = await fetch(`http://localhost:3000/api/companies/${empresaSemOrdens.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const responseData2 = await deleteResponse2.json();
      
      if (deleteResponse2.ok) {
        console.log('✅ CORRETO: Empresa sem vínculos foi deletada com sucesso');
        console.log('📝 Mensagem:', responseData2.message);
      } else {
        console.log('❌ PROBLEMA: Empresa sem vínculos não foi deletada');
        console.log('📄 Resposta:', responseData2);
      }
    } else {
      console.log('⚠️ Nenhuma empresa sem vínculos encontrada para testar');
    }
    
  } catch (error) {
    console.error('💥 Erro:', error.message);
  }
}

testDeleteMessage();