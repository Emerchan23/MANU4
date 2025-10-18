import mysql from 'mysql2/promise';

async function testDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('✅ Conectado ao banco de dados');
    
    // Primeiro, vamos verificar se a tabela companies existe e suas colunas
    console.log('\n📋 Verificando estrutura da tabela companies...');
    const [columns] = await connection.execute('DESCRIBE companies');
    console.log('Colunas disponíveis:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    // Criar uma empresa de teste com as colunas corretas (baseado na estrutura real da tabela)
    const testCompany = {
      name: 'Empresa Teste Simplificada',
      cnpj: '12.345.678/0001-90',
      contact_person: 'João Silva',
      phone: '(11) 99999-9999',
      email: 'teste@empresa.com',
      address: 'Rua Teste, 123, São Paulo - SP, CEP: 01234-567'
    };

    console.log('\n💾 Inserindo empresa de teste...');
    const [result] = await connection.execute(
      'INSERT INTO companies (name, cnpj, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?, ?)',
      [testCompany.name, testCompany.cnpj, testCompany.contact_person, testCompany.phone, testCompany.email, testCompany.address]
    );

    console.log(`✅ Empresa criada com ID: ${result.insertId}`);

    // Verificar se foi salva corretamente
    const [rows] = await connection.execute('SELECT * FROM companies WHERE id = ?', [result.insertId]);
    const company = rows[0];
    
    console.log('\n📊 Dados salvos:');
    console.log(`Nome: ${company.name}`);
    console.log(`CNPJ: ${company.cnpj}`);
    console.log(`Contato: ${company.contact_person}`);
    console.log(`Telefone: ${company.phone}`);
    console.log(`Email: ${company.email}`);
    console.log(`Endereço: ${company.address}`);
    console.log(`Ativo: ${company.is_active}`);

    // Agora vamos testar se podemos adicionar campos JSON (se existirem)
    console.log('\n🔍 Verificando se existem campos JSON para contratos, técnicos, etc...');
    
    // Verificar se as colunas JSON existem
    const hasJsonColumns = columns.some(col => 
      ['contracts', 'technicians', 'comments', 'evaluations'].includes(col.Field)
    );
    
    if (hasJsonColumns) {
      console.log('✅ Campos JSON encontrados! Testando inserção de dados JSON...');
      
      const jsonData = {
        contracts: JSON.stringify([
          { id: 1, number: 'CT-001', description: 'Contrato de Manutenção', value: 50000, startDate: '2024-01-01', endDate: '2024-12-31' }
        ]),
        technicians: JSON.stringify([
          { id: 1, name: 'Carlos Técnico', specialty: 'Eletrônica', phone: '(11) 88888-8888', email: 'carlos@empresa.com' }
        ]),
        comments: JSON.stringify([
          { id: 1, text: 'Empresa com bom histórico de atendimento', date: '2024-01-15', author: 'Admin' }
        ]),
        evaluations: JSON.stringify([
          { id: 1, criteria: 'Qualidade do Serviço', score: 9, comment: 'Excelente qualidade', date: '2024-01-20' }
        ])
      };
      
      // Construir query dinamicamente baseada nas colunas existentes
      const jsonColumns = ['contracts', 'technicians', 'comments', 'evaluations'].filter(col => 
        columns.some(dbCol => dbCol.Field === col)
      );
      
      if (jsonColumns.length > 0) {
        const updateFields = jsonColumns.map(col => `${col} = ?`).join(', ');
        const updateValues = jsonColumns.map(col => jsonData[col]);
        
        await connection.execute(
          `UPDATE companies SET ${updateFields} WHERE id = ?`,
          [...updateValues, result.insertId]
        );
        
        // Verificar os dados JSON salvos
        const [updatedRows] = await connection.execute('SELECT * FROM companies WHERE id = ?', [result.insertId]);
        const updatedCompany = updatedRows[0];
        
        console.log('\n📋 Dados JSON salvos:');
        jsonColumns.forEach(col => {
          if (updatedCompany[col]) {
            console.log(`${col}:`, JSON.parse(updatedCompany[col]));
          }
        });
      }
    } else {
      console.log('⚠️  Campos JSON não encontrados na tabela. Apenas dados básicos foram salvos.');
    }

    await connection.end();
    console.log('\n🎉 Teste concluído com sucesso! Conexão com banco funcionando corretamente.');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('Detalhes do erro:', error);
  }
}

// Executar o teste
testDatabase();