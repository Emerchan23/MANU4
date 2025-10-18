const mysql = require('mysql2/promise');

async function removeTestCompanies() {
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
    
    // Primeiro, vamos identificar as empresas de teste
    console.log('\n🔍 Identificando empresas de teste...');
    
    const [testCompanies] = await connection.execute(`
      SELECT id, name, cnpj, contact_person 
      FROM companies 
      WHERE LOWER(name) LIKE '%teste%' 
         OR LOWER(name) LIKE '%test%' 
         OR LOWER(name) LIKE '%api%' 
         OR LOWER(name) LIKE '%debug%' 
         OR LOWER(name) LIKE '%exemplo%' 
         OR LOWER(name) LIKE '%sample%' 
         OR LOWER(name) LIKE '%demo%'
    `);
    
    if (testCompanies.length === 0) {
      console.log('✅ Nenhuma empresa de teste encontrada!');
      return;
    }
    
    console.log(`\n🚨 Encontradas ${testCompanies.length} empresa(s) de teste:`);
    testCompanies.forEach((company, index) => {
      console.log(`   ${index + 1}. ID: ${company.id} | Nome: ${company.name} | CNPJ: ${company.cnpj}`);
    });
    
    // Remover as empresas de teste
    console.log('\n🗑️ Removendo empresas de teste...');
    
    for (const company of testCompanies) {
      console.log(`   Removendo: ${company.name} (ID: ${company.id})`);
      
      const [result] = await connection.execute(
        'DELETE FROM companies WHERE id = ?',
        [company.id]
      );
      
      if (result.affectedRows > 0) {
        console.log(`   ✅ Empresa "${company.name}" removida com sucesso!`);
      } else {
        console.log(`   ❌ Erro ao remover empresa "${company.name}"`);
      }
    }
    
    // Verificar o resultado final
    console.log('\n📊 Verificando resultado final...');
    
    const [finalCount] = await connection.execute('SELECT COUNT(*) as total FROM companies');
    console.log(`Total de empresas restantes: ${finalCount[0].total}`);
    
    const [remainingCompanies] = await connection.execute('SELECT id, name, cnpj FROM companies ORDER BY id');
    
    if (remainingCompanies.length > 0) {
      console.log('\n📋 Empresas restantes (apenas dados reais):');
      remainingCompanies.forEach((company, index) => {
        console.log(`   ${index + 1}. ID: ${company.id} | Nome: ${company.name} | CNPJ: ${company.cnpj}`);
      });
    } else {
      console.log('\n⚠️ Nenhuma empresa restante no banco de dados');
    }
    
    console.log('\n✅ Limpeza concluída! Apenas dados reais permanecem no banco.');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão com o banco de dados fechada');
    }
  }
}

// Executar a limpeza
removeTestCompanies().catch(console.error);