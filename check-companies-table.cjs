const mysql = require('mysql2/promise');

async function checkCompaniesTable() {
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
    
    // Verificar se a tabela companies existe
    console.log('\n🔍 Verificando se a tabela "companies" existe...');
    
    const [tables] = await connection.execute("SHOW TABLES LIKE 'companies'");
    
    if (tables.length > 0) {
      console.log('\n✅ TABELA "companies" ENCONTRADA!');
      
      // Verificar estrutura da tabela
      console.log('\n📊 Estrutura da tabela companies:');
      const [structure] = await connection.execute('DESCRIBE companies');
      structure.forEach(col => {
        console.log(`   ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} - Default: ${col.Default || 'NULL'}`);
      });
      
      // Verificar quantos registros existem
      const [count] = await connection.execute('SELECT COUNT(*) as total FROM companies');
      console.log(`\n📊 Total de registros na tabela companies: ${count[0].total}`);
      
      // Mostrar todos os registros se existirem
      if (count[0].total > 0) {
        console.log('\n📋 Registros na tabela companies:');
        const [records] = await connection.execute('SELECT * FROM companies ORDER BY id');
        records.forEach((record, index) => {
          console.log(`\n   ${index + 1}. ID: ${record.id}`);
          console.log(`      Nome: ${record.name || 'N/A'}`);
          console.log(`      CNPJ: ${record.cnpj || 'N/A'}`);
          console.log(`      Contato: ${record.contact_person || 'N/A'}`);
          console.log(`      Telefone: ${record.phone || 'N/A'}`);
          console.log(`      Email: ${record.email || 'N/A'}`);
          console.log(`      Endereço: ${record.address || 'N/A'}`);
          console.log(`      Especialidades: ${record.specialties || 'N/A'}`);
          console.log(`      Ativo: ${record.is_active ? 'Sim' : 'Não'}`);
          console.log(`      Criado em: ${record.created_at || 'N/A'}`);
          
          // Identificar se é dados de teste
          const isTestData = record.name && (
            record.name.toLowerCase().includes('teste') ||
            record.name.toLowerCase().includes('test') ||
            record.name.toLowerCase().includes('api') ||
            record.name.toLowerCase().includes('debug') ||
            record.name.toLowerCase().includes('exemplo') ||
            record.name.toLowerCase().includes('sample') ||
            record.name.toLowerCase().includes('demo')
          );
          
          if (isTestData) {
            console.log(`      🚨 DADOS DE TESTE IDENTIFICADOS!`);
          }
        });
        
        // Contar quantos são dados de teste
        const [testCount] = await connection.execute(`
          SELECT COUNT(*) as test_count 
          FROM companies 
          WHERE LOWER(name) LIKE '%teste%' 
             OR LOWER(name) LIKE '%test%' 
             OR LOWER(name) LIKE '%api%' 
             OR LOWER(name) LIKE '%debug%' 
             OR LOWER(name) LIKE '%exemplo%' 
             OR LOWER(name) LIKE '%sample%' 
             OR LOWER(name) LIKE '%demo%'
        `);
        
        console.log(`\n🚨 Total de empresas com dados de teste: ${testCount[0].test_count}`);
        console.log(`📊 Total de empresas com dados reais: ${count[0].total - testCount[0].test_count}`);
      }
      
    } else {
      console.log('\n❌ Tabela "companies" NÃO existe no banco de dados');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão com o banco de dados fechada');
    }
  }
}

// Executar a verificação
checkCompaniesTable().catch(console.error);