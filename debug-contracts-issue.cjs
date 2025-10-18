const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugContractsIssue() {
  let connection;
  
  try {
    // Conectar ao banco
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Conectado ao MySQL');

    // 1. Verificar estrutura da tabela companies
    console.log('\n📋 1. Verificando estrutura da tabela companies:');
    const [tableStructure] = await connection.execute('DESCRIBE companies');
    console.table(tableStructure);

    // 2. Testar inserção direta no banco
    console.log('\n💾 2. Testando inserção direta no banco de dados:');
    
    const testData = {
      name: 'Empresa Teste Debug',
      cnpj: '12.345.678/0001-90',
      contact_person: 'João Silva',
      phone: '(11) 99999-9999',
      email: 'joao@empresateste.com',
      address: 'Rua Teste, 123',
      is_active: true,
      specialties: 'Manutenção,Instalação',
      contracts: JSON.stringify([
        {
          contractNumber: 'CT-2024-DEBUG',
          value: 15000,
          scope: 'Manutenção preventiva de equipamentos',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          specialConditions: 'Atendimento 24h'
        }
      ])
    };

    console.log('Dados a serem inseridos:', testData);

    const [insertResult] = await connection.execute(`
      INSERT INTO companies (name, cnpj, contact_person, phone, email, address, is_active, specialties, contracts)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      testData.name,
      testData.cnpj,
      testData.contact_person,
      testData.phone,
      testData.email,
      testData.address,
      testData.is_active,
      testData.specialties,
      testData.contracts
    ]);

    console.log('✅ Inserção direta bem-sucedida! ID:', insertResult.insertId);

    // 3. Verificar se os dados foram salvos corretamente
    console.log('\n🔍 3. Verificando dados salvos:');
    const [savedData] = await connection.execute(
      'SELECT * FROM companies WHERE id = ?',
      [insertResult.insertId]
    );

    if (savedData.length > 0) {
      const company = savedData[0];
      console.log('Empresa salva:');
      console.log('- ID:', company.id);
      console.log('- Nome:', company.name);
      console.log('- Especialidades:', company.specialties);
      console.log('- Contratos (raw):', company.contracts);
      
      if (company.contracts) {
        try {
          const parsedContracts = JSON.parse(company.contracts);
          console.log('- Contratos (parsed):', parsedContracts);
        } catch (e) {
          console.log('❌ Erro ao fazer parse dos contratos:', e.message);
        }
      } else {
        console.log('❌ Contratos estão NULL/vazios!');
      }
    }

    // 4. Testar via API
    console.log('\n🌐 4. Testando via API:');
    
    const apiTestData = {
      name: 'Empresa Teste API Debug',
      cnpj: '98.765.432/0001-10',
      contact_person: 'Maria Santos',
      phone: '(11) 88888-8888',
      email: 'maria@empresatesteapi.com',
      address: 'Av. API, 456',
      active: true,
      specialties: ['Manutenção', 'Instalação', 'Consultoria'],
      contracts: [
        {
          contractNumber: 'CT-2024-API-DEBUG',
          value: 25000,
          scope: 'Manutenção corretiva e preventiva',
          startDate: '2024-02-01',
          endDate: '2024-12-31',
          specialConditions: 'Garantia estendida'
        }
      ]
    };

    console.log('Dados para API:', JSON.stringify(apiTestData, null, 2));

    const response = await fetch('http://localhost:3000/api/companies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiTestData)
    });

    const apiResult = await response.json();
    console.log('Resposta da API:', apiResult);

    if (response.ok && apiResult.id) {
      // Verificar dados salvos via API
      console.log('\n🔍 5. Verificando dados salvos via API:');
      const [apiSavedData] = await connection.execute(
        'SELECT * FROM companies WHERE id = ?',
        [apiResult.id]
      );

      if (apiSavedData.length > 0) {
        const apiCompany = apiSavedData[0];
        console.log('Empresa salva via API:');
        console.log('- ID:', apiCompany.id);
        console.log('- Nome:', apiCompany.name);
        console.log('- Especialidades:', apiCompany.specialties);
        console.log('- Contratos (raw):', apiCompany.contracts);
        
        if (apiCompany.contracts) {
          try {
            const parsedContracts = JSON.parse(apiCompany.contracts);
            console.log('- Contratos (parsed):', parsedContracts);
          } catch (e) {
            console.log('❌ Erro ao fazer parse dos contratos via API:', e.message);
          }
        } else {
          console.log('❌ Contratos via API estão NULL/vazios!');
        }
      }
    } else {
      console.log('❌ Erro na API:', apiResult);
    }

    // 6. Limpar dados de teste
    console.log('\n🧹 6. Limpando dados de teste:');
    await connection.execute('DELETE FROM companies WHERE name LIKE "%Teste%Debug%"');
    console.log('✅ Dados de teste removidos');

  } catch (error) {
    console.error('❌ Erro durante debug:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada');
    }
  }
}

debugContractsIssue();