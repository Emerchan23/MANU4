console.log('🧪 TESTE COMPLETO DE SALVAMENTO - Técnicos e Contratos');
console.log('='.repeat(60));

// Simular dados que seriam enviados pelo frontend
const testData = {
  name: 'Empresa Teste Completa',
  cnpj: '12.345.678/0001-90',
  contact_person: 'João Silva',
  phone: '(11) 99999-9999',
  email: 'teste@empresa.com',
  address: 'Rua Teste, 123',
  specialties: 'Manutenção, Instalação',
  contract_start_date: '2024-01-01',
  contract_end_date: '2024-12-31',
  technicians: JSON.stringify([
    {
      name: 'Carlos Técnico',
      specialty: 'Eletrônica',
      phone: '(11) 88888-8888',
      email: 'carlos@empresa.com'
    },
    {
      name: 'Maria Técnica',
      specialty: 'Mecânica',
      phone: '(11) 77777-7777',
      email: 'maria@empresa.com'
    }
  ])
};

console.log('📦 Dados que serão testados:');
console.log(JSON.stringify(testData, null, 2));

// Fazer requisição para a API
fetch('http://localhost:3000/api/companies', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log('\n📥 Resposta da API:');
  console.log('Status:', response.status);
  console.log('OK:', response.ok);
  return response.json();
})
.then(data => {
  console.log('\n📄 Dados da resposta:');
  console.log(JSON.stringify(data, null, 2));
  
  if (data.id) {
    console.log('\n✅ Empresa criada com ID:', data.id);
    console.log('\n🔍 Agora vamos verificar se os dados foram salvos no banco...');
    
    // Verificar no banco de dados
    const mysql = require('mysql2/promise');
    
    mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    })
    .then(connection => {
      return connection.execute('SELECT * FROM companies WHERE id = ?', [data.id]);
    })
    .then(([rows]) => {
      if (rows.length > 0) {
        const company = rows[0];
        console.log('\n📋 DADOS SALVOS NO BANCO:');
        console.log('ID:', company.id);
        console.log('Nome:', company.name);
        console.log('CNPJ:', company.cnpj);
        console.log('Contato:', company.contact_person);
        console.log('Especialidades:', company.specialties);
        console.log('\n📅 DATAS DE CONTRATO:');
        console.log('Data Início:', company.contract_start_date);
        console.log('Data Fim:', company.contract_end_date);
        console.log('\n👥 TÉCNICOS:');
        console.log('Técnicos (raw):', company.technicians);
        
        if (company.technicians) {
          try {
            const technicians = JSON.parse(company.technicians);
            console.log('Técnicos (parsed):');
            technicians.forEach((tech, index) => {
              console.log(`  ${index + 1}. ${tech.name} - ${tech.specialty} - ${tech.phone}`);
            });
          } catch (e) {
            console.log('❌ Erro ao fazer parse dos técnicos:', e.message);
          }
        }
        
        console.log('\n🎉 RESULTADO DO TESTE:');
        console.log('✅ Empresa salva:', company.name ? 'SIM' : 'NÃO');
        console.log('✅ Datas de contrato salvas:', (company.contract_start_date && company.contract_end_date) ? 'SIM' : 'NÃO');
        console.log('✅ Técnicos salvos:', company.technicians ? 'SIM' : 'NÃO');
        
        if (company.name && company.contract_start_date && company.contract_end_date && company.technicians) {
          console.log('\n🎊 SUCESSO TOTAL! Todos os dados foram salvos corretamente!');
        } else {
          console.log('\n❌ FALHA! Alguns dados não foram salvos.');
        }
      } else {
        console.log('❌ Empresa não encontrada no banco!');
      }
    })
    .catch(error => {
      console.error('❌ Erro ao verificar banco:', error);
    });
  } else {
    console.log('❌ Falha ao criar empresa');
  }
})
.catch(error => {
  console.error('❌ Erro na requisição:', error);
});