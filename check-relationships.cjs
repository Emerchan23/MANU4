const mysql = require('mysql2/promise');

async function checkRelationships() {
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

    // 1. Verificar estrutura da tabela equipment
    console.log('\n📋 ESTRUTURA DA TABELA EQUIPMENT:');
    const [equipmentStructure] = await connection.execute('DESCRIBE equipment');
    console.table(equipmentStructure);
    
    // 2. Verificar se equipment tem company_id
    const hasCompanyId = equipmentStructure.some(col => 
      col.Field.toLowerCase().includes('company') || 
      col.Field.toLowerCase().includes('empresa')
    );
    
    console.log(`\n🔍 Equipment tem company_id? ${hasCompanyId ? '✅ SIM' : '❌ NÃO'}`);
    
    // 3. Verificar estrutura da tabela setores
    console.log('\n📋 ESTRUTURA DA TABELA SETORES:');
    const [setoresStructure] = await connection.execute('DESCRIBE setores');
    console.table(setoresStructure);
    
    // 4. Verificar se setores tem company_id
    const setoresHasCompanyId = setoresStructure.some(col => 
      col.Field.toLowerCase().includes('company') || 
      col.Field.toLowerCase().includes('empresa')
    );
    
    console.log(`\n🔍 Setores tem company_id? ${setoresHasCompanyId ? '✅ SIM' : '❌ NÃO'}`);
    
    // 5. Testar relacionamento atual
    console.log('\n🔗 TESTANDO RELACIONAMENTO ATUAL:');
    try {
      const [testQuery] = await connection.execute(`
        SELECT 
          e.id as equipment_id,
          e.name as equipment_name,
          e.sector_id,
          s.nome as sector_name,
          c.id as company_id,
          c.nome as company_name
        FROM equipment e
        LEFT JOIN setores s ON e.sector_id = s.id
        LEFT JOIN companies c ON e.company_id = c.id
        LIMIT 3
      `);
      
      console.log('✅ Query com company_id direto funcionou:');
      console.table(testQuery);
      
    } catch (error) {
      console.log('❌ Query com company_id direto falhou:', error.message);
      
      // Tentar sem company_id direto
      try {
        const [testQuery2] = await connection.execute(`
          SELECT 
            e.id as equipment_id,
            e.name as equipment_name,
            e.sector_id,
            s.nome as sector_name
          FROM equipment e
          LEFT JOIN setores s ON e.sector_id = s.id
          LIMIT 3
        `);
        
        console.log('✅ Query sem company_id funcionou:');
        console.table(testQuery2);
        
      } catch (error2) {
        console.log('❌ Query sem company_id também falhou:', error2.message);
      }
    }
    
    // 6. Verificar se existe relacionamento entre setores e companies
    console.log('\n🔗 VERIFICANDO RELACIONAMENTO SETORES-COMPANIES:');
    try {
      const [setorCompanyTest] = await connection.execute(`
        SELECT 
          s.id as sector_id,
          s.nome as sector_name,
          c.id as company_id,
          c.nome as company_name
        FROM setores s
        LEFT JOIN companies c ON s.company_id = c.id
        LIMIT 3
      `);
      
      console.log('✅ Relacionamento setores-companies existe:');
      console.table(setorCompanyTest);
      
    } catch (error) {
      console.log('❌ Relacionamento setores-companies não existe:', error.message);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada');
    }
  }
}

checkRelationships();