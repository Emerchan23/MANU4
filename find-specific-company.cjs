const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance',
  port: 3306,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

async function findSpecificCompany() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    
    // Buscar a empresa específica por nome
    console.log('\n📋 Buscando empresa "Empresa Teste Atualizada 176090651461S"...');
    const [companyByName] = await connection.execute(`
      SELECT * FROM companies 
      WHERE name LIKE '%Empresa Teste Atualizada%' 
      OR name LIKE '%176090651461%'
    `);
    
    console.log('Empresas encontradas por nome:', companyByName.length);
    companyByName.forEach((company, index) => {
      console.log(`\n--- Empresa ${index + 1} ---`);
      console.log('ID:', company.id);
      console.log('Nome:', company.name);
      console.log('CNPJ:', company.cnpj);
      console.log('Email:', company.email);
      console.log('Telefone:', company.phone);
      console.log('Endereço:', company.address);
      console.log('Pessoa de Contato:', company.contact_person);
      console.log('Criado em:', company.created_at);
      console.log('Atualizado em:', company.updated_at);
      console.log('Ativo:', company.active);
    });
    
    // Buscar também por CNPJ
    console.log('\n📋 Buscando por CNPJ 12.345.678/0001-90...');
    const [companyByCnpj] = await connection.execute(`
      SELECT * FROM companies 
      WHERE cnpj = '12.345.678/0001-90'
    `);
    
    if (companyByCnpj.length > 0) {
      console.log('\n🎯 Empresa encontrada por CNPJ:');
      const company = companyByCnpj[0];
      console.log('ID:', company.id);
      console.log('Nome:', company.name);
      console.log('CNPJ:', company.cnpj);
      console.log('Email:', company.email);
      console.log('Telefone:', company.phone);
      console.log('Endereço:', company.address);
      console.log('Pessoa de Contato:', company.contact_person);
      console.log('Criado em:', company.created_at);
      console.log('Atualizado em:', company.updated_at);
      console.log('Ativo:', company.active);
    }
    
    // Listar todas as empresas para comparação
    console.log('\n📊 Listando todas as empresas para comparação...');
    const [allCompanies] = await connection.execute(`
      SELECT id, name, cnpj, email, active FROM companies 
      ORDER BY id
    `);
    
    console.log(`\nTotal de empresas: ${allCompanies.length}`);
    allCompanies.forEach((company, index) => {
      console.log(`${index + 1}. ID: ${company.id} | Nome: ${company.name} | CNPJ: ${company.cnpj} | Ativo: ${company.active}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

findSpecificCompany();