const mysql = require('mysql2/promise');

async function createDefaultCompany() {
  let connection;
  
  try {
    // Configuração do banco de dados
    const dbConfig = {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance',
      port: 3306
    };

    console.log('🔍 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Conectado ao banco de dados');
    
    // Verificar se já existe uma empresa com ID 1
    console.log('\n🔍 Verificando se já existe empresa com ID 1...');
    
    const [existingCompany] = await connection.execute(`
      SELECT id, name FROM companies WHERE id = 1
    `);
    
    if (existingCompany.length > 0) {
      console.log('✅ Empresa padrão já existe:');
      console.log(`   ID: ${existingCompany[0].id}`);
      console.log(`   Nome: ${existingCompany[0].name}`);
      return;
    }
    
    // Criar empresa padrão
    console.log('\n📋 Criando empresa padrão...');
    
    const [insertResult] = await connection.execute(`
      INSERT INTO companies (
        id,
        name, 
        cnpj, 
        contact_person, 
        phone, 
        email, 
        address,
        is_active,
        specialties,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      1, // ID fixo
      'Empresa Padrão', // name
      '00.000.000/0001-00', // cnpj
      'Administrador', // contact_person
      '(11) 0000-0000', // phone
      'admin@empresa.com', // email
      'Endereço Padrão', // address
      1, // is_active
      'Manutenção Geral' // specialties
    ]);
    
    console.log('✅ Empresa padrão criada com sucesso!');
    console.log(`   ID: 1`);
    console.log(`   Nome: Empresa Padrão`);
    
    // Verificar se foi criada corretamente
    const [verifyCompany] = await connection.execute(`
      SELECT * FROM companies WHERE id = 1
    `);
    
    if (verifyCompany.length > 0) {
      console.log('\n📊 Verificação da empresa criada:');
      const company = verifyCompany[0];
      console.log(`   ID: ${company.id}`);
      console.log(`   Nome: ${company.name}`);
      console.log(`   CNPJ: ${company.cnpj}`);
      console.log(`   Contato: ${company.contact_person}`);
      console.log(`   Telefone: ${company.phone}`);
      console.log(`   Email: ${company.email}`);
      console.log(`   Endereço: ${company.address}`);
      console.log(`   Ativo: ${company.is_active ? 'Sim' : 'Não'}`);
      console.log(`   Especialidades: ${company.specialties}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('❌ Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão com o banco de dados fechada');
    }
  }
}

// Executar a criação
createDefaultCompany().catch(console.error);