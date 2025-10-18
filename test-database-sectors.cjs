const mysql = require('mysql2/promise');

async function testDatabaseSectors() {
  let connection;
  
  try {
    // Conectar ao banco
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('✅ Conectado ao banco de dados');

    // Verificar tabelas relacionadas a setores
    console.log('\n🔍 Verificando tabelas relacionadas a setores...');
    const [tables] = await connection.execute("SHOW TABLES LIKE '%sector%'");
    console.log('Tabelas encontradas:', tables);

    // Verificar se existe tabela 'setores'
    console.log('\n🔍 Verificando tabela setores...');
    const [setoresTable] = await connection.execute("SHOW TABLES LIKE 'setores'");
    console.log('Tabela setores existe:', setoresTable.length > 0);

    if (setoresTable.length > 0) {
      // Mostrar estrutura da tabela setores
      console.log('\n📋 Estrutura da tabela setores:');
      const [structure] = await connection.execute("DESCRIBE setores");
      console.table(structure);

      // Contar registros
      const [count] = await connection.execute("SELECT COUNT(*) as total FROM setores");
      console.log(`\n📊 Total de registros em setores: ${count[0].total}`);

      // Mostrar alguns registros
      if (count[0].total > 0) {
        console.log('\n📄 Primeiros registros:');
        const [records] = await connection.execute("SELECT * FROM setores LIMIT 5");
        console.table(records);
      }
    }

    // Verificar se existe tabela 'sectors' (antiga)
    console.log('\n🔍 Verificando tabela sectors (antiga)...');
    const [sectorsTable] = await connection.execute("SHOW TABLES LIKE 'sectors'");
    console.log('Tabela sectors existe:', sectorsTable.length > 0);

    if (sectorsTable.length > 0) {
      console.log('\n⚠️  PROBLEMA: Tabela "sectors" ainda existe no banco!');
      
      // Mostrar estrutura da tabela sectors
      console.log('\n📋 Estrutura da tabela sectors:');
      const [structure] = await connection.execute("DESCRIBE sectors");
      console.table(structure);

      // Contar registros
      const [count] = await connection.execute("SELECT COUNT(*) as total FROM sectors");
      console.log(`\n📊 Total de registros em sectors: ${count[0].total}`);
    }

    // Testar inserção na tabela correta
    console.log('\n🧪 Testando inserção de setor...');
    
    try {
      const [result] = await connection.execute(`
        INSERT INTO setores (nome, descricao, responsavel, ativo) 
        VALUES (?, ?, ?, ?)
      `, ['Setor Teste DB', 'Descrição do setor de teste', 'Admin', 1]);
      
      console.log('✅ Setor inserido com sucesso! ID:', result.insertId);
      
      // Verificar se foi inserido
      const [inserted] = await connection.execute("SELECT * FROM setores WHERE id = ?", [result.insertId]);
      console.log('📄 Setor inserido:');
      console.table(inserted);
      
      // Limpar teste
      await connection.execute("DELETE FROM setores WHERE id = ?", [result.insertId]);
      console.log('🧹 Registro de teste removido');
      
    } catch (insertError) {
      console.error('❌ Erro ao inserir setor:', insertError.message);
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

testDatabaseSectors();