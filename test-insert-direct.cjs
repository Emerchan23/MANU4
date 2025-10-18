const mysql = require('mysql2/promise');

async function testDirectInsert() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('🧪 Testando inserção direta no banco...\n');

    // Dados de teste
    const testData = {
      name: 'Empresa Teste Direto',
      cnpj: '12345678000199',
      contact_person: 'João Silva',
      phone: '11999999999',
      email: 'joao@teste.com',
      address: 'Rua Teste, 123',
      is_active: true,
      specialties: 'Biomédica,Elétrica',
      contracts: JSON.stringify([{
        numero: 'CT-001',
        escopo: 'Teste direto',
        dataInicio: '2024-01-01',
        dataFim: '2024-12-31',
        valor: '25000.00',
        condicoes: 'Teste de inserção direta'
      }]),
      technicians: JSON.stringify([{
        nome: 'Técnico Teste',
        cpf: '12345678901',
        email: 'tecnico@teste.com',
        telefone: '11888888888',
        especialidades: ['Biomédica'],
        certificacoes: ['Cert Teste'],
        status: 'ATIVO'
      }]),
      comments: JSON.stringify([{
        titulo: 'Comentário Teste',
        conteudo: 'Teste de inserção direta',
        tipo: 'GERAL',
        data: new Date().toISOString()
      }]),
      evaluations: JSON.stringify([{
        serviceOrderId: 'OS-001',
        nota: 5,
        comentarios: 'Teste direto',
        criterios: {
          qualidade: 5,
          prazo: 5,
          atendimento: 5,
          custo: 5
        }
      }])
    };

    console.log('📝 Dados que serão inseridos:');
    console.log('  - Nome:', testData.name);
    console.log('  - Contratos:', testData.contracts);
    console.log('  - Técnicos:', testData.technicians);
    console.log('  - Comentários:', testData.comments);
    console.log('  - Avaliações:', testData.evaluations);

    // Inserir dados
    const [result] = await connection.execute(`
      INSERT INTO companies (
        name, cnpj, contact_person, phone, email, address, 
        is_active, specialties, contracts, technicians, comments, evaluations
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
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
    ]);

    console.log('\n✅ Inserção realizada com sucesso!');
    console.log('ID da empresa criada:', result.insertId);

    // Verificar se os dados foram salvos
    const [rows] = await connection.execute(
      'SELECT id, name, contracts, technicians, comments, evaluations FROM companies WHERE id = ?',
      [result.insertId]
    );

    if (rows.length > 0) {
      const company = rows[0];
      console.log('\n🔍 Dados salvos no banco:');
      console.log('  - Nome:', company.name);
      console.log('  - Contratos salvos:', company.contracts ? 'SIM' : 'NÃO');
      console.log('  - Técnicos salvos:', company.technicians ? 'SIM' : 'NÃO');
      console.log('  - Comentários salvos:', company.comments ? 'SIM' : 'NÃO');
      console.log('  - Avaliações salvas:', company.evaluations ? 'SIM' : 'NÃO');
      
      if (company.contracts) {
        console.log('  - Conteúdo dos contratos:', company.contracts);
      }
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Erro na inserção direta:', error.message);
    console.error('Stack:', error.stack);
  }
}