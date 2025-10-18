const BASE_URL = 'http://localhost:3000';

// Dados de teste com contratos
const testCompanyWithContracts = {
  name: 'Empresa Teste Contratos',
  cnpj: '12345678000199',
  contact_person: 'João Silva',
  phone: '11999999999',
  email: 'teste@empresa.com',
  address: 'Rua Teste, 123',
  active: true,
  specialties: ['Biomédica', 'Elétrica'],
  contracts: [
    {
      numero: 'CT-2024-001',
      escopo: 'Manutenção preventiva de equipamentos biomédicos',
      dataInicio: '2024-01-01',
      dataFim: '2024-12-31',
      valor: '50000.00',
      condicoes: 'Manutenção mensal com relatórios detalhados'
    },
    {
      numero: 'CT-2024-002',
      escopo: 'Calibração de equipamentos elétricos',
      dataInicio: '2024-02-01',
      dataFim: '2024-12-31',
      valor: '25000.00',
      condicoes: 'Calibração trimestral com certificados'
    }
  ]
};

async function testContractsAPI() {
  console.log('🧪 Testando salvamento de contratos na API de empresas...\n');
  
  try {
    console.log('📝 Dados que serão enviados:');
    console.log(JSON.stringify(testCompanyWithContracts, null, 2));
    console.log('\n');
    
    // Fazer requisição POST para criar empresa com contratos
    console.log('🚀 Enviando requisição POST para /api/companies...');
    const response = await fetch(`${BASE_URL}/api/companies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCompanyWithContracts)
    });
    
    console.log(`📊 Status da resposta: ${response.status}`);
    
    const responseData = await response.json();
    console.log('📋 Resposta da API:');
    console.log(JSON.stringify(responseData, null, 2));
    
    if (response.ok && responseData.id) {
      console.log('\n✅ Empresa criada com sucesso!');
      console.log(`🆔 ID da empresa: ${responseData.id}`);
      
      // Buscar a empresa criada para verificar se os contratos foram salvos
      console.log('\n🔍 Verificando se os contratos foram salvos...');
      const getResponse = await fetch(`${BASE_URL}/api/companies/${responseData.id}`);
      
      if (getResponse.ok) {
        const companyData = await getResponse.json();
        console.log('📋 Dados da empresa recuperados:');
        console.log(JSON.stringify(companyData, null, 2));
        
        if (companyData.contracts) {
          console.log('\n✅ Contratos encontrados no banco de dados!');
          const contracts = typeof companyData.contracts === 'string' 
            ? JSON.parse(companyData.contracts) 
            : companyData.contracts;
          console.log('📋 Contratos salvos:');
          console.log(JSON.stringify(contracts, null, 2));
        } else {
          console.log('\n❌ Contratos não foram salvos no banco de dados!');
        }
      } else {
        console.log('\n❌ Erro ao buscar empresa criada');
      }
      
    } else {
      console.log('\n❌ Erro ao criar empresa');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Executar teste
testContractsAPI();