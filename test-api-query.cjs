const mysql = require('mysql2/promise');

// Simular a função query da lib/database.js
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

let pool;

function createPool() {
  if (!pool) {
    pool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

async function query(sql, params = []) {
  const connection = createPool();
  try {
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

async function testApiQuery() {
  console.log('🧪 Testando função query da API...\n');

  try {
    // Simular exatamente o que a API faz
    const name = 'Empresa API Query Test';
    const cnpj = '12345678000100';
    const contact_person = 'João API';
    const phone = '11999999999';
    const email = 'joao@apitest.com';
    const address = 'Rua API Test, 123';
    const isActive = true;
    const specialtiesStr = 'Biomédica,Elétrica';
    const contractsJson = JSON.stringify([{
      numero: 'CT-API-001',
      escopo: 'Teste API Query',
      dataInicio: '2024-01-01',
      dataFim: '2024-12-31',
      valor: '30000.00',
      condicoes: 'Teste de API Query'
    }]);
    const techniciansJson = JSON.stringify([{
      nome: 'Técnico API Query',
      cpf: '99999999999',
      email: 'tecnico@apiquery.com',
      telefone: '11555555555',
      especialidades: ['Biomédica'],
      certificacoes: ['API Query Cert'],
      status: 'ATIVO'
    }]);
    const commentsJson = JSON.stringify([{
      titulo: 'Comentário API Query',
      conteudo: 'Teste via API Query',
      tipo: 'GERAL',
      data: new Date().toISOString()
    }]);
    const evaluationsJson = JSON.stringify([{
      serviceOrderId: 'OS-API-QUERY-001',
      nota: 4,
      comentarios: 'Teste API Query',
      criterios: {
        qualidade: 4,
        prazo: 4,
        atendimento: 4,
        custo: 4
      }
    }]);

    console.log('📝 Dados que serão inseridos:');
    console.log('  - name:', name);
    console.log('  - cnpj:', cnpj);
    console.log('  - contact_person:', contact_person);
    console.log('  - phone:', phone);
    console.log('  - email:', email);
    console.log('  - address:', address);
    console.log('  - is_active:', isActive);
    console.log('  - specialties:', specialtiesStr);
    console.log('  - contracts:', contractsJson);
    console.log('  - technicians:', techniciansJson);
    console.log('  - comments:', commentsJson);
    console.log('  - evaluations:', evaluationsJson);

    console.log('\n🚀 Executando query exatamente como na API...');

    const result = await query(
      `
      INSERT INTO companies (name, cnpj, contact_person, phone, email, address, is_active, specialties, contracts, technicians, comments, evaluations)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [name, cnpj, contact_person, phone, email, address, isActive, specialtiesStr, contractsJson, techniciansJson, commentsJson, evaluationsJson]
    );

    console.log('✅ Inserção realizada com sucesso!');
    console.log('ID da empresa criada:', result.insertId);

    // Verificar se os dados foram salvos
    const companies = await query("SELECT * FROM companies WHERE id = ?", [result.insertId]);

    if (companies.length > 0) {
      const company = companies[0];
      console.log('\n🔍 Dados salvos no banco:');
      console.log('  - Nome:', company.name);
      console.log('  - Contratos salvos:', company.contracts ? 'SIM' : 'NÃO');
      console.log('  - Técnicos salvos:', company.technicians ? 'SIM' : 'NÃO');
      console.log('  - Comentários salvos:', company.comments ? 'SIM' : 'NÃO');
      console.log('  - Avaliações salvas:', company.evaluations ? 'SIM' : 'NÃO');
      
      if (company.contracts) {
        console.log('  - Conteúdo dos contratos:', company.contracts);
      }
      if (company.technicians) {
        console.log('  - Conteúdo dos técnicos:', company.technicians);
      }
    }

    // Fechar pool
    if (pool) {
      await pool.end();
    }

  } catch (error) {
    console.error('❌ Erro no teste da API query:', error.message);
    console.error('Stack:', error.stack);
  }
}

testApiQuery();