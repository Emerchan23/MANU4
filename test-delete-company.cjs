const mysql = require('mysql2/promise');

async function testDeleteCompany() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('🔗 Conectado ao banco de dados');
    
    // 1. Criar uma empresa de teste para deletar
    console.log('\n📝 Criando empresa de teste...');
    const testCompany = {
      name: 'Empresa Teste DELETE',
      cnpj: '99.999.999/0001-99',
      contact_person: 'Teste Delete',
      phone: '(99) 99999-9999',
      email: 'delete@teste.com',
      address: 'Rua Delete, 999',
      specialties: 'Teste'
    };

    const [result] = await connection.execute(
      'INSERT INTO companies (name, cnpj, contact_person, phone, email, address, specialties) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [testCompany.name, testCompany.cnpj, testCompany.contact_person, testCompany.phone, testCompany.email, testCompany.address, testCompany.specialties]
    );

    const companyId = result.insertId;
    console.log('✅ Empresa criada com ID:', companyId);

    // 2. Verificar se a empresa foi criada
    const [companies] = await connection.execute('SELECT * FROM companies WHERE id = ?', [companyId]);
    console.log('📋 Empresa encontrada:', companies[0] ? companies[0].name : 'Não encontrada');

    // 3. Verificar se há ordens de serviço vinculadas
    const [serviceOrders] = await connection.execute('SELECT COUNT(*) as count FROM service_orders WHERE company_id = ?', [companyId]);
    console.log('📊 Ordens de serviço vinculadas:', serviceOrders[0].count);

    // 4. Deletar a empresa
    console.log('\n🗑️ Deletando empresa...');
    const [deleteResult] = await connection.execute('DELETE FROM companies WHERE id = ?', [companyId]);
    console.log('✅ Resultado da exclusão - Linhas afetadas:', deleteResult.affectedRows);

    // 5. Verificar se a empresa foi realmente deletada
    const [verifyDelete] = await connection.execute('SELECT * FROM companies WHERE id = ?', [companyId]);
    console.log('🔍 Verificação pós-exclusão:', verifyDelete.length === 0 ? 'Empresa deletada com sucesso' : 'Empresa ainda existe');

    // 6. Testar a API DELETE via fetch
    console.log('\n🌐 Testando API DELETE...');
    
    // Primeiro, criar outra empresa para testar via API
    const [result2] = await connection.execute(
      'INSERT INTO companies (name, cnpj, contact_person, phone, email, address, specialties) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Empresa API Test', '88.888.888/0001-88', 'API Test', '(88) 88888-8888', 'api@test.com', 'Rua API, 888', 'API Test']
    );

    const apiTestId = result2.insertId;
    console.log('✅ Empresa para teste API criada com ID:', apiTestId);

    // Simular chamada da API
    try {
      const response = await fetch(`http://localhost:3000/api/companies?id=${apiTestId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ API DELETE funcionou:', data.message);
        
        // Verificar se foi realmente deletada
        const [verifyApiDelete] = await connection.execute('SELECT * FROM companies WHERE id = ?', [apiTestId]);
        console.log('🔍 Verificação API pós-exclusão:', verifyApiDelete.length === 0 ? 'Empresa deletada via API com sucesso' : 'Empresa ainda existe após API');
      } else {
        const errorData = await response.json();
        console.log('❌ Erro na API DELETE:', errorData);
      }
    } catch (apiError) {
      console.log('❌ Erro ao chamar API:', apiError.message);
    }

    await connection.end();
    console.log('\n✅ Teste de DELETE concluído!');
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testDeleteCompany();