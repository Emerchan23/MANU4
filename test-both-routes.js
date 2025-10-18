// Teste para verificar ambas as rotas de DELETE
async function testBothRoutes() {
  console.log('🧪 Testando ambas as rotas de DELETE...\n');

  try {
    // 1. Buscar empresas
    console.log('📋 1. Buscando empresas...');
    const companiesResponse = await fetch('http://localhost:3000/api/companies');
    const companies = await companiesResponse.json();
    console.log(`✅ Encontradas ${companies.length} empresas\n`);

    // Encontrar uma empresa com ID conhecido que tem ordens
    const empresaComOrdens = companies.find(c => c.id === 31) || companies[0];
    
    if (!empresaComOrdens) {
      console.log('❌ Nenhuma empresa encontrada para teste');
      return;
    }

    console.log(`🎯 Testando com empresa: ${empresaComOrdens.name} (ID: ${empresaComOrdens.id})\n`);

    // 2. Testar rota Next.js: /api/companies/[id]
    console.log('🔄 2. Testando rota Next.js: /api/companies/[id]');
    const nextResponse = await fetch(`http://localhost:3000/api/companies/${empresaComOrdens.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📥 Next.js Response:');
    console.log('📥 Status:', nextResponse.status);
    
    const nextData = await nextResponse.json();
    console.log('📄 Dados:', JSON.stringify(nextData, null, 2));

    if (nextData.serviceOrdersCount) {
      console.log('✅ Next.js: Mensagem inclui contagem de ordens');
    } else {
      console.log('⚠️ Next.js: Mensagem não inclui contagem');
    }

    // 3. Testar rota Express: /api/companies?id=
    console.log('\n🔄 3. Testando rota Express: /api/companies?id=');
    const expressResponse = await fetch(`http://localhost:3000/api/companies?id=${empresaComOrdens.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📥 Express Response:');
    console.log('📥 Status:', expressResponse.status);
    
    const expressData = await expressResponse.json();
    console.log('📄 Dados:', JSON.stringify(expressData, null, 2));

    if (expressData.serviceOrdersCount) {
      console.log('✅ Express: Mensagem inclui contagem de ordens');
    } else {
      console.log('⚠️ Express: Mensagem não inclui contagem');
    }

    // 4. Comparar resultados
    console.log('\n📊 4. Comparação das rotas:');
    
    const nextHasCount = nextData.serviceOrdersCount !== undefined;
    const expressHasCount = expressData.serviceOrdersCount !== undefined;
    
    if (nextHasCount && expressHasCount) {
      console.log('🎉 PERFEITO: Ambas as rotas têm mensagens melhoradas!');
    } else if (nextHasCount || expressHasCount) {
      console.log('⚠️ PARCIAL: Apenas uma rota tem mensagem melhorada');
      console.log(`   Next.js: ${nextHasCount ? '✅' : '❌'}`);
      console.log(`   Express: ${expressHasCount ? '✅' : '❌'}`);
    } else {
      console.log('❌ PROBLEMA: Nenhuma rota tem mensagem melhorada');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testBothRoutes();