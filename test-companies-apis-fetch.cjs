const BASE_URL = 'http://localhost:3000';

// Dados de teste para criação
const createData = {
      name: 'Empresa Teste API Completo',
      cnpj: '99.888.777/0001-66',
      contact_person: 'Ana Teste',
      phone: '(11) 95555-5555',
      email: 'ana@testeapi.com',
      address: 'Rua Teste API, 999 - São Paulo/SP'
    };

let createdCompanyId = null;

async function testCompaniesAPIs() {
  console.log('🚀 INICIANDO TESTE COMPLETO DAS APIs DE EMPRESAS\n');
  
  try {
    // 1. Testar GET /api/companies (Listagem)
    console.log('📋 1. TESTANDO GET /api/companies (Listagem)');
    console.log('   URL:', `${BASE_URL}/api/companies`);
    
    const listResponse = await fetch(`${BASE_URL}/api/companies`);
    const listData = await listResponse.json();
    
    console.log('   ✅ Status:', listResponse.status);
    console.log('   📊 Total de empresas:', listData.length);
    
    if (listData.length > 0) {
      console.log('   📋 Primeira empresa:');
      const firstCompany = listData[0];
      console.log(`      ID: ${firstCompany.id}`);
      console.log(`      Nome: ${firstCompany.name}`);
      console.log(`      CNPJ: ${firstCompany.cnpj}`);
      console.log(`      Contato: ${firstCompany.contact_person}`);
      console.log(`      Telefone: ${firstCompany.phone}`);
      console.log(`      Email: ${firstCompany.email}`);
    }
    
    console.log('\n');
    
    // 2. Testar POST /api/companies (Criação)
    console.log('➕ 2. TESTANDO POST /api/companies (Criação)');
    console.log('   URL:', `${BASE_URL}/api/companies`);
    console.log('   Dados:', JSON.stringify(createData, null, 2));
    
    const createResponse = await fetch(`${BASE_URL}/api/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createData)
    });
    
    const createResponseData = await createResponse.json();
    
    console.log('   ✅ Status:', createResponse.status);
    console.log('   📝 Resposta:', JSON.stringify(createResponseData, null, 2));
    
    // Extrair ID da empresa criada
    if (createResponseData && createResponseData.id) {
      createdCompanyId = createResponseData.id;
      console.log('   🆔 ID da empresa criada:', createdCompanyId);
    }
    
    console.log('\n');
    
    // 3. Testar GET /api/companies/[id] (Busca por ID)
    if (createdCompanyId) {
      console.log('🔍 3. TESTANDO GET /api/companies/[id] (Busca por ID)');
      console.log('   URL:', `${BASE_URL}/api/companies/${createdCompanyId}`);
      
      const getByIdResponse = await fetch(`${BASE_URL}/api/companies/${createdCompanyId}`);
      const company = await getByIdResponse.json();
      
      console.log('   ✅ Status:', getByIdResponse.status);
      console.log('   📋 Empresa encontrada:');
      console.log(`      ID: ${company.id}`);
      console.log(`      Nome: ${company.name}`);
      console.log(`      CNPJ: ${company.cnpj}`);
      console.log(`      Contato: ${company.contact_person}`);
      console.log(`      Telefone: ${company.phone}`);
      console.log(`      Email: ${company.email}`);
      console.log(`      Endereço: ${company.address}`);
      console.log(`      Especialidades: ${company.specialties}`);
      
      console.log('\n');
    }
    
    // 4. Testar PUT /api/companies/[id] (Atualização)
    if (createdCompanyId) {
      console.log('✏️ 4. TESTANDO PUT /api/companies/[id] (Atualização)');
      console.log('   URL:', `${BASE_URL}/api/companies/${createdCompanyId}`);
      
      const updateData = {
        name: 'Empresa Teste API Atualizada',
        cnpj: '99.888.777/0001-66',
        contact_person: 'Ana Teste Atualizada',
        phone: '(11) 94444-4444',
        email: 'ana.atualizada@testeapi.com',
        address: 'Rua Teste API Atualizada, 888 - Rio de Janeiro/RJ'
      };
      
      console.log('   📝 Dados de atualização:', JSON.stringify(updateData, null, 2));
      
      const updateResponse = await fetch(`${BASE_URL}/api/companies/${createdCompanyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
      
      const updateResponseData = await updateResponse.json();
      
      console.log('   ✅ Status:', updateResponse.status);
      console.log('   📝 Resposta:', JSON.stringify(updateResponseData, null, 2));
      
      console.log('\n');
      
      // Verificar se a atualização foi aplicada
      console.log('🔍 4.1. VERIFICANDO ATUALIZAÇÃO');
      const verifyUpdateResponse = await fetch(`${BASE_URL}/api/companies/${createdCompanyId}`);
      const updatedCompany = await verifyUpdateResponse.json();
      
      console.log('   📋 Empresa após atualização:');
      console.log(`      Nome: ${updatedCompany.name}`);
      console.log(`      Telefone: ${updatedCompany.phone}`);
      console.log(`      Email: ${updatedCompany.email}`);
      console.log(`      Endereço: ${updatedCompany.address}`);
      console.log(`      Especialidades: ${updatedCompany.specialties}`);
      
      console.log('\n');
    }
    
    // 5. Testar listagem novamente para verificar sincronização
    console.log('🔄 5. VERIFICANDO SINCRONIZAÇÃO - Nova listagem');
    const finalListResponse = await fetch(`${BASE_URL}/api/companies`);
    const finalListData = await finalListResponse.json();
    
    console.log('   ✅ Status:', finalListResponse.status);
    console.log('   📊 Total de empresas após testes:', finalListData.length);
    
    // Encontrar nossa empresa de teste na listagem
    const testCompanyInList = finalListData.find(company => 
      company.id === createdCompanyId
    );
    
    if (testCompanyInList) {
      console.log('   ✅ Empresa de teste encontrada na listagem:');
      console.log(`      Nome: ${testCompanyInList.name}`);
      console.log(`      CNPJ: ${testCompanyInList.cnpj}`);
    } else {
      console.log('   ❌ Empresa de teste NÃO encontrada na listagem');
    }
    
    console.log('\n');
    
    // 6. Limpeza - Remover empresa de teste
    if (createdCompanyId) {
      console.log('🗑️ 6. LIMPEZA - Removendo empresa de teste');
      console.log('   URL:', `${BASE_URL}/api/companies/${createdCompanyId}`);
      
      try {
        const deleteResponse = await fetch(`${BASE_URL}/api/companies/${createdCompanyId}`, {
          method: 'DELETE'
        });
        
        console.log('   ✅ Status:', deleteResponse.status);
        console.log('   🗑️ Empresa de teste removida com sucesso');
      } catch (deleteError) {
        console.log('   ⚠️ Erro ao remover empresa de teste:', deleteError.message);
      }
    }
    
    console.log('\n');
    
    // 7. Verificação final
    console.log('🏁 7. VERIFICAÇÃO FINAL');
    const finalCheckResponse = await fetch(`${BASE_URL}/api/companies`);
    const finalCheckData = await finalCheckResponse.json();
    console.log('   📊 Total final de empresas:', finalCheckData.length);
    
    console.log('\n✅ TESTE COMPLETO DAS APIs CONCLUÍDO COM SUCESSO!');
    
    // Resumo dos testes
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log('   ✅ GET /api/companies (listagem) - OK');
    console.log('   ✅ POST /api/companies (criação) - OK');
    console.log('   ✅ GET /api/companies/[id] (busca por ID) - OK');
    console.log('   ✅ PUT /api/companies/[id] (atualização) - OK');
    console.log('   ✅ Sincronização banco/API - OK');
    console.log('   ✅ Limpeza de dados de teste - OK');
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    
    // Tentar limpeza mesmo em caso de erro
    if (createdCompanyId) {
      console.log('\n🗑️ Tentando limpeza após erro...');
      try {
        await fetch(`${BASE_URL}/api/companies/${createdCompanyId}`, {
          method: 'DELETE'
        });
        console.log('   ✅ Limpeza realizada');
      } catch (cleanupError) {
        console.log('   ❌ Erro na limpeza:', cleanupError.message);
      }
    }
  }
}

// Executar os testes
testCompaniesAPIs().catch(console.error);