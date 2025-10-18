require('dotenv').config();
const { createConnection } = require('mysql2/promise');

async function testCompanyCreation() {
  let connection;
  
  try {
    console.log('🧪 Testando criação de empresa com todos os campos...');
    
    connection = await createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    
    console.log('✅ Conectado ao banco hospital_maintenance');
    
    // Dados de teste
    const testData = {
      name: "Empresa Teste Completa",
      cnpj: "98765432000188",
      contact_person: "Maria Silva",
      phone: "11888888888",
      email: "maria@empresa.com",
      address: "Av. Teste, 456",
      is_active: true,
      specialties: "Biomédica,Elétrica,Mecânica",
      contracts: JSON.stringify([
        {
          numero: "CT-2024-003",
          escopo: "Manutenção completa",
          dataInicio: "2024-01-01",
          dataFim: "2024-12-31",
          valor: "75000.00",
          condicoes: "Manutenção mensal"
        }
      ]),
      technicians: JSON.stringify([
        {
          nome: "João Técnico",
          cpf: "12345678901",
          email: "joao@empresa.com",
          telefone: "11777777777",
          especialidades: ["Biomédica"],
          certificacoes: ["Cert1"],
          status: "ATIVO"
        }
      ]),
      comments: JSON.stringify([
        {
          titulo: "Comentário Teste",
          conteudo: "Este é um comentário de teste",
          tipo: "GERAL",
          data: new Date().toISOString()
        }
      ]),
      evaluations: JSON.stringify([
        {
          serviceOrderId: "OS-001",
          nota: 5,
          comentarios: "Excelente serviço",
          criterios: {
            qualidade: 5,
            prazo: 5,
            atendimento: 5,
            custo: 5
          }
        }
      ])
    };
    
    console.log('\n📝 Inserindo empresa diretamente no banco...');
    
    const [result] = await connection.query(
      `INSERT INTO companies (name, cnpj, contact_person, phone, email, address, is_active, specialties, contracts, technicians, comments, evaluations)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        testData.name,
        testData.cnpj,
        testData.contact_person,
        testData.phone,
        testData.email,
        testData.address,
        testData.is_active,
        testData.specialties,
        testData.contracts,
        testData.technicians,
        testData.comments,
        testData.evaluations
      ]
    );
    
    console.log('✅ Empresa inserida com ID:', result.insertId);
    
    // Verificar se foi salva corretamente
    console.log('\n🔍 Verificando dados salvos...');
    const [companies] = await connection.query(
      'SELECT * FROM companies WHERE id = ?',
      [result.insertId]
    );
    
    if (companies.length > 0) {
      const company = companies[0];
      console.log('\n📋 Dados recuperados:');
      console.log('Nome:', company.name);
      console.log('CNPJ:', company.cnpj);
      console.log('Especialidades:', company.specialties);
      
      if (company.contracts) {
        console.log('\n✅ Contratos salvos:');
        const contracts = JSON.parse(company.contracts);
        console.log(JSON.stringify(contracts, null, 2));
      } else {
        console.log('\n❌ Contratos não foram salvos!');
      }
      
      if (company.technicians) {
        console.log('\n✅ Técnicos salvos:');
        const technicians = JSON.parse(company.technicians);
        console.log(JSON.stringify(technicians, null, 2));
      } else {
        console.log('\n❌ Técnicos não foram salvos!');
      }
      
      if (company.comments) {
        console.log('\n✅ Comentários salvos:');
        const comments = JSON.parse(company.comments);
        console.log(JSON.stringify(comments, null, 2));
      } else {
        console.log('\n❌ Comentários não foram salvos!');
      }
      
      if (company.evaluations) {
        console.log('\n✅ Avaliações salvas:');
        const evaluations = JSON.parse(company.evaluations);
        console.log(JSON.stringify(evaluations, null, 2));
      } else {
        console.log('\n❌ Avaliações não foram salvas!');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testCompanyCreation();