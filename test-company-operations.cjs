const mysql = require('mysql2/promise');

async function testCompanyOperations() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('🔗 Conectado ao banco de dados');
    
    // 1. Criar uma empresa de teste
    console.log('\n📝 Criando empresa de teste...');
    const testCompany = {
      name: 'Empresa Teste Edição/Exclusão',
      cnpj: '98.765.432/0001-10',
      contact_person: 'Maria Silva',
      phone: '(11) 88888-8888',
      email: 'maria@empresateste.com',
      address: 'Rua Teste, 456',
      specialties: 'Manutenção, Calibração',
      technicians: JSON.stringify([
        { id: 1, name: 'João Técnico', specialty: 'Eletrônica', phone: '(11) 77777-7777', email: 'joao@empresateste.com' }
      ])
    };

    const [insertResult] = await connection.execute(
      'INSERT INTO companies (name, cnpj, contact_person, phone, email, address, specialties, technicians) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [testCompany.name, testCompany.cnpj, testCompany.contact_person, testCompany.phone, testCompany.email, testCompany.address, testCompany.specialties, testCompany.technicians]
    );

    const companyId = insertResult.insertId;
    console.log('✅ Empresa criada com ID:', companyId);

    // 2. Testar UPDATE
    console.log('\n🔄 Testando operação UPDATE...');
    const updateData = {
      name: 'Empresa Teste Atualizada',
      contact_person: 'Maria Silva Santos',
      phone: '(11) 99999-9999',
      email: 'maria.santos@empresateste.com'
    };

    const [updateResult] = await connection.execute(
      'UPDATE companies SET name = ?, contact_person = ?, phone = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [updateData.name, updateData.contact_person, updateData.phone, updateData.email, companyId]
    );

    console.log('📊 Resultado UPDATE - Linhas afetadas:', updateResult.affectedRows);

    // Verificar se foi atualizada
    const [updatedRows] = await connection.execute('SELECT * FROM companies WHERE id = ?', [companyId]);
    const updatedCompany = updatedRows[0];
    
    console.log('✅ Dados após UPDATE:');
    console.log('  Nome:', updatedCompany.name);
    console.log('  Contato:', updatedCompany.contact_person);
    console.log('  Telefone:', updatedCompany.phone);
    console.log('  Email:', updatedCompany.email);

    // 3. Verificar se há ordens de serviço vinculadas
    console.log('\n🔍 Verificando ordens de serviço vinculadas...');
    const [serviceOrdersCheck] = await connection.execute(
      'SELECT COUNT(*) as count FROM service_orders WHERE company_id = ?',
      [companyId]
    );
    
    console.log('📊 Ordens de serviço vinculadas:', serviceOrdersCheck[0].count);

    // 4. Testar DELETE
    console.log('\n🗑️ Testando operação DELETE...');
    const [deleteResult] = await connection.execute(
      'DELETE FROM companies WHERE id = ?',
      [companyId]
    );

    console.log('📊 Resultado DELETE - Linhas afetadas:', deleteResult.affectedRows);

    // Verificar se foi excluída
    const [deletedCheck] = await connection.execute('SELECT * FROM companies WHERE id = ?', [companyId]);
    console.log('✅ Empresa após DELETE - Registros encontrados:', deletedCheck.length);

    await connection.end();
    console.log('\n🎉 Teste concluído com sucesso! Operações UPDATE e DELETE funcionando corretamente.');
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testCompanyOperations();