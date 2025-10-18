// Usar fetch nativo do Node.js 18+

async function testDeleteEmpresaWithConstraints() {
  try {
    console.log('🧪 Testando exclusão de empresa com restrições...');
    
    // Testar exclusão de empresa que TEM ordens de serviço (deve falhar)
    console.log('\n📋 Teste 1: Tentando deletar empresa COM ordens de serviço...');
    const empresaComOrdens = 31; // ID da empresa "4444" que tem 1 ordem
    
    console.log(`🗑️ Tentando deletar empresa ID ${empresaComOrdens}...`);
    const deleteResponse1 = await fetch(`http://localhost:3000/api/companies/${empresaComOrdens}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📥 Status da resposta:', deleteResponse1.status);
    const responseText1 = await deleteResponse1.text();
    console.log('📄 Resposta:', responseText1);
    
    if (deleteResponse1.status === 400) {
      console.log('✅ Correto: Exclusão foi bloqueada devido às ordens de serviço');
    } else {
      console.log('❌ Problema: Exclusão deveria ter sido bloqueada');
    }
    
    // Testar exclusão de empresa que NÃO TEM ordens de serviço (deve funcionar)
    console.log('\n📋 Teste 2: Tentando deletar empresa SEM ordens de serviço...');
    const empresaSemOrdens = 36; // ID da empresa "654654654" que não tem ordens
    
    console.log(`🗑️ Tentando deletar empresa ID ${empresaSemOrdens}...`);
    const deleteResponse2 = await fetch(`http://localhost:3000/api/companies/${empresaSemOrdens}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📥 Status da resposta:', deleteResponse2.status);
    const responseText2 = await deleteResponse2.text();
    console.log('📄 Resposta:', responseText2);
    
    if (deleteResponse2.status === 200) {
      console.log('✅ Correto: Exclusão foi bem-sucedida');
    } else {
      console.log('❌ Problema: Exclusão deveria ter funcionado');
    }
    
    // Testar exclusão de empresa inexistente
    console.log('\n📋 Teste 3: Tentando deletar empresa inexistente...');
    const empresaInexistente = 99999;
    
    console.log(`🗑️ Tentando deletar empresa ID ${empresaInexistente}...`);
    const deleteResponse3 = await fetch(`http://localhost:3000/api/companies/${empresaInexistente}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📥 Status da resposta:', deleteResponse3.status);
    const responseText3 = await deleteResponse3.text();
    console.log('📄 Resposta:', responseText3);
    
    if (deleteResponse3.status === 404) {
      console.log('✅ Correto: Empresa inexistente retornou 404');
    } else {
      console.log('❌ Problema: Deveria retornar 404 para empresa inexistente');
    }
    
  } catch (error) {
    console.error('💥 Erro no teste:', error.message);
    console.error('💥 Stack:', error.stack);
  }
}

testDeleteEmpresaWithConstraints();