const mysql = require('mysql2/promise');

async function fixSectorCompanyRelationship() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao banco de dados...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('✅ Conectado ao banco com sucesso!');

    // 1. Adicionar company_id à tabela setores
    console.log('\n🔧 Adicionando company_id à tabela setores...');
    
    try {
      await connection.execute(`
        ALTER TABLE setores 
        ADD COLUMN company_id INT NULL AFTER nome,
        ADD INDEX idx_company_id (company_id)
      `);
      console.log('✅ Campo company_id adicionado à tabela setores');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('⚠️  Campo company_id já existe na tabela setores');
      } else {
        throw error;
      }
    }

    // 2. Verificar estrutura atualizada
    console.log('\n📋 Estrutura atualizada da tabela setores:');
    const [setoresStructure] = await connection.execute('DESCRIBE setores');
    console.table(setoresStructure);

    // 3. Atualizar setores existentes com company_id
    console.log('\n🔧 Atualizando setores existentes...');
    
    // Primeiro, vamos ver quantas empresas temos
    const [companies] = await connection.execute('SELECT id, name FROM companies LIMIT 5');
    console.log('📊 Empresas disponíveis:');
    console.table(companies);
    
    if (companies.length > 0) {
      // Atualizar todos os setores para a primeira empresa (como exemplo)
      const firstCompanyId = companies[0].id;
      
      await connection.execute(`
        UPDATE setores 
        SET company_id = ? 
        WHERE company_id IS NULL
      `, [firstCompanyId]);
      
      console.log(`✅ Setores atualizados com company_id = ${firstCompanyId}`);
    }

    // 4. Verificar resultado
    console.log('\n📊 Setores após atualização:');
    const [updatedSetores] = await connection.execute(`
      SELECT 
        s.id,
        s.nome as sector_name,
        s.company_id,
        c.nome as company_name
      FROM setores s
      LEFT JOIN companies c ON s.company_id = c.id
      LIMIT 5
    `);
    console.table(updatedSetores);

    // 5. Testar relacionamento completo
    console.log('\n🔗 Testando relacionamento completo: Company → Sector → Equipment');
    const [fullTest] = await connection.execute(`
      SELECT 
        c.id as company_id,
        c.name as company_name,
        s.id as sector_id,
        s.nome as sector_name,
        e.id as equipment_id,
        e.name as equipment_name
      FROM companies c
      LEFT JOIN setores s ON c.id = s.company_id
      LEFT JOIN equipment e ON s.id = e.sector_id
      WHERE e.id IS NOT NULL
      LIMIT 5
    `);
    
    console.log('✅ Relacionamento completo funcionando:');
    console.table(fullTest);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada');
    }
  }
}

fixSectorCompanyRelationship();