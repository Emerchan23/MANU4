// Teste para verificar mensagem de erro na UI ao tentar deletar empresa com vínculos
const fetch = require('node-fetch');

async function testUIDeleteMessage() {
  console.log('🧪 Testando mensagem de erro na UI...\n');

  try {
    // 1. Buscar empresas
    console.log('📋 1. Buscando empresas...');
    const companiesResponse = await fetch('http://localhost:3000/api/companies');
    const companies = await companiesResponse.json();
    console.log(`✅ Encontradas ${companies.length} empresas\n`);

    // 2. Encontrar uma empresa com ordens de serviço
    let empresaComOrdens = null;
    for (const empresa of companies) {
      // Verificar se tem ordens de serviço
      const ordersResponse = await fetch(`http://localhost:3000/api/service-orders?company_id=${empresa.id}`);
      if (ordersResponse.ok) {
        const orders = await ordersResponse.json();
        if (orders.length > 0) {
          empresaComOrdens = empresa;
          console.log(`🎯 Empresa com ordens encontrada: ${empresa.name} (ID: ${empresa.id}) - ${orders.length} ordens`);
          break;
        }
      }
    }

    if (!empresaComOrdens) {
      console.log('❌ Nenhuma empresa com ordens de serviço encontrada para teste');
      return;
    }

    // 3. Tentar deletar empresa com vínculos
    console.log('\n🗑️ 2. Tentando deletar empresa com vínculos...');
    const deleteResponse = await fetch(`http://localhost:3000/api/companies/${empresaComOrdens.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\n📥 Resposta da API:');
    console.log('📥 Status:', deleteResponse.status);
    console.log('📥 OK:', deleteResponse.ok);

    const responseText = await deleteResponse.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { message: responseText };
    }

    console.log('📄 Dados da resposta:', JSON.stringify(data, null, 2));

    // 4. Verificar se a mensagem está melhorada
    if (deleteResponse.status === 400) {
      console.log('\n✅ CORRETO: Exclusão foi bloqueada como esperado');
      
      if (data.serviceOrdersCount) {
        console.log('✅ EXCELENTE: Mensagem inclui contagem de ordens de serviço');
        console.log(`📊 Quantidade de ordens: ${data.serviceOrdersCount}`);
      } else {
        console.log('⚠️ Mensagem não inclui contagem de ordens de serviço');
      }

      console.log('\n📝 Mensagens recebidas:');
      console.log(`📝 Erro: ${data.error}`);
      console.log(`📝 Detalhes: ${data.details}`);

      // Verificar se a mensagem é clara e informativa
      const isDetailed = data.details && data.details.length > 50;
      const hasCount = data.serviceOrdersCount !== undefined;
      
      if (isDetailed && hasCount) {
        console.log('\n🎉 PERFEITO: Mensagem é clara, detalhada e informativa!');
      } else if (isDetailed) {
        console.log('\n👍 BOM: Mensagem é detalhada, mas poderia incluir contagem');
      } else {
        console.log('\n⚠️ ATENÇÃO: Mensagem poderia ser mais detalhada');
      }

    } else {
      console.log('\n❌ ERRO: Exclusão deveria ter sido bloqueada');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testUIDeleteMessage();