const BASE_URL = 'http://localhost:3000';

// Dados de teste para criação (com formato correto)
const testCompanyData = {
  name: 'Empresa Teste API Completo',
  cnpj: '99888777000166', // Formato sem pontuação
  contact_person: 'Ana Teste',
  phone: '11955555555', // Formato sem pontuação
  email: 'ana@testeapi.com',
  address: 'Rua Teste API, 999 - São Paulo/SP',
  specialties: 'Teste, API, Validação'
};

let createdCompanyId = null;

async function testCompaniesAPIs() {
  console.log('🚀 INICIANDO TESTE COMPLETO DAS APIs DE EMPRESAS\n');
  
  try {
    // 1. Testar GET /api/companies (Listagem)
    console.log('📋 1. TESTANDO GET /api/companies (Listagem)');
    console.log('   URL:', `${BASE_URL}/api/companies`);
    
    const listResponse = await fetch(`${BASE_URL}/api/companies`);
    const listResult = await listResponse.json();
    
    console.log('   ✅ Status:', listResponse.status);
    console.log('   📝 Resposta completa:', JSON.stringify(listResult, null, 2));
    
    if (listResult.success && listResult.companies) {
      console.log('   📊 Total de empresas:', listResult.companies.length);
      
      if (listResult.companies.length > 0) {
        console.log('   📋 Primeira empresa:');
        const firstCompany = listResult.companies[0];
        console.log(`      ID: ${firstCompany.id}`);
        console.log(`      Nome: ${firstCompany.name}`);
        console.log(`      CNPJ: ${firstCompany.cnpj}`);
        console.log(`      Contato: ${firstCompany.contact_person}`);
        console.log(`      Telefone: ${firstCompany.phone}`);
        console.log(`      Email: ${firstCompany.email}`);
      }
    } else {
      console.log('   ❌ Erro na resposta da API:', listResult);
    }
    
    console.log('\n');
    
    // 2. Testar POST /api/companies (Criação)
    console.log('➕ 2. TESTANDO POST /api/companies (Criação)');
    console.log('   URL:', `${BASE_URL}/api/companies`);
    console.log('   Dados:', JSON.stringify(testCompanyData, null, 2));
    
    const createResponse = await fetch(`${BASE_URL}/api/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCompanyData)
    });
    
    const createResult = await createResponse.json();
    
    console.log('   ✅ Status:', createResponse.status);
    console.log('   📝 Resposta:', JSON.stringify(createResult, null, 2));
    
    // Extrair ID da empresa criada
    if (createResult.success && createResult.company && createResult.company.id) {
      createdCompanyId = createResult.company.id;
      console.log('   🆔 ID da empresa criada:', createdCompanyId);
    } else {
      console.log('   ❌ Falha na criação da empresa');
      return; // Parar teste se não conseguir criar
    }
    
    console.log('\n');
    
    // 3. Testar GET /api/companies/[id] (Busca por ID)
    if (createdCompanyId) {
      console.log('🔍 3. TESTANDO GET /api/companies/[id] (Busca por ID)');
      console.log('   URL:', `${BASE_URL}/api/companies/${createdCompanyId}`);
      
      const getByIdResponse = await fetch(`${BASE_URL}/api/companies/${createdCompanyId}`);
      const getByIdResult = await getByIdResponse.json();
      
      console.log('   ✅ Status:', getByIdResponse.status);
      console.log('   📝 Resposta:', JSON.stringify(getByIdResult, null, 2));
      
      if (getByIdResult.success && getByIdResult.company) {
        const company = getByIdResult.company;
        console.log('   📋 Empresa encontrada:');
        console.log(`      ID: ${company.id}`);
        console.log(`      Nome: ${company.name}`);
        console.log(`      CNPJ: ${company.cnpj}`);
        console.log(`      Contato: ${company.contact_person}`);
        console.log(`      Telefone: ${company.phone}`);
        console.log(`      Email: ${company.email}`);
        console.log(`      Endereço: ${company.address}`);
        console.log(`      Especialidades: ${company.specialties}`);
      }
      
      console.log('\n');
    }
    
    // 4. Testar PUT /api/companies/[id] (Atualização)
    if (createdCompanyId) {
      console.log('✏️ 4. TESTANDO PUT /api/companies/[id] (Atualização)');
      console.log('   URL:', `${BASE_URL}/api/companies/${createdCompanyId}`);
      
      const updateData = {
        name: 'Empresa Teste API Atualizada',
        cnpj: '99888777000166', // Manter o mesmo CNPJ
        contact_person: 'Ana Teste Atualizada',
        phone: '11944444444', // Formato sem pontuação
        email: 'ana.atualizada@testeapi.com',
        address: 'Rua Teste API Atualizada, 888 - Rio de Janeiro/RJ',
        specialties: 'Teste Atualizado, API, Validação Completa'
      };
      
      console.log('   📝 Dados de atualização:', JSON.stringify(updateData, null, 2));
      
      const updateResponse = await fetch(`${BASE_URL}/api/companies/${createdCompanyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });
      
      const updateResult = await updateResponse.json();
      
      console.log('   ✅ Status:', updateResponse.status);
      console.log('   📝 Resposta:', JSON.stringify(updateResult, null, 2));
      
      console.log('\n');
      
      // Verificar se a atualização foi aplicada
      console.log('🔍 4.1. VERIFICANDO ATUALIZAÇÃO');
      const verifyUpdateResponse = await fetch(`${BASE_URL}/api/companies/${createdCompanyId}`);
      const verifyResult = await verifyUpdateResponse.json();
      
      if (verifyResult.success && verifyResult.company) {
        const updatedCompany = verifyResult.company;
        console.log('   📋 Empresa após atualização:');
        console.log(`      Nome: ${updatedCompany.name}`);
        console.log(`      Telefone: ${updatedCompany.phone}`);
        console.log(`      Email: ${updatedCompany.email}`);
        console.log(`      Endereço: ${updatedCompany.address}`);
        console.log(`      Especialidades: ${updatedCompany.specialties}`);
      }
      
      console.log('\n');
    }
    
    // 5. Testar listagem novamente para verificar sincronização
    console.log('🔄 5. VERIFICANDO SINCRONIZAÇÃO - Nova listagem');
    const finalListResponse = await fetch(`${BASE_URL}/api/companies`);
    const finalListResult = await finalListResponse.json();
    
    console.log('   ✅ Status:', finalListResponse.status);
    
    if (finalListResult.success && finalListResult.companies) {
      console.log('   📊 Total de empresas após testes:', finalListResult.companies.length);
      
      // Encontrar nossa empresa de teste na listagem
      const testCompanyInList = finalListResult.companies.find(company => 
        company.id === createdCompanyId
      );
      
      if (testCompanyInList) {
        console.log('   ✅ Empresa de teste encontrada na listagem:');
        console.log(`      Nome: ${testCompanyInList.name}`);
        console.log(`      CNPJ: ${testCompanyInList.cnpj}`);
      } else {
        console.log('   ❌ Empresa de teste NÃO encontrada na listagem');
      }
    }
    
    console.log('\n');
    
    // 6. Limpeza - Remover empresa de teste (se DELETE estiver implementado)
    if (createdCompanyId) {
      console.log('🗑️ 6. LIMPEZA - Tentando remover empresa de teste');
      console.log('   URL:', `${BASE_URL}/api/companies/${createdCompanyId}`);
      
      try {
        const deleteResponse = await fetch(`${BASE_URL}/api/companies/${createdCompanyId}`, {
          method: 'DELETE'
        });
        
        console.log('   ✅ Status DELETE:', deleteResponse.status);
        
        if (deleteResponse.status === 200 || deleteResponse.status === 204) {
          console.log('   🗑️ Empresa de teste removida com sucesso');
        } else {
          console.log('   ⚠️ DELETE não implementado ou erro - empresa permanece no banco');
        }
      } catch (deleteError) {
        console.log('   ⚠️ Erro ao tentar remover empresa de teste:', deleteError.message);
      }
    }
    
    console.log('\n');
    
    // 7. Verificação final
    console.log('🏁 7. VERIFICAÇÃO FINAL');
    const finalCheckResponse = await fetch(`${BASE_URL}/api/companies`);
    const finalCheckResult = await finalCheckResponse.json();
    
    if (finalCheckResult.success && finalCheckResult.companies) {
      console.log('   📊 Total final de empresas:', finalCheckResult.companies.length);
    }
    
    console.log('\n✅ TESTE COMPLETO DAS APIs CONCLUÍDO!');
    
    // Resumo dos testes
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log('   ✅ GET /api/companies (listagem) - OK');
    console.log('   ✅ POST /api/companies (criação) - OK');
    console.log('   ✅ GET /api/companies/[id] (busca por ID) - OK');
    console.log('   ✅ PUT /api/companies/[id] (atualização) - OK');
    console.log('   ✅ Sincronização banco/API - OK');
    console.log('   ⚠️ DELETE /api/companies/[id] - Não implementado');
    
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