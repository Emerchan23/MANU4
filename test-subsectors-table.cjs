const mysql = require('mysql2/promise');

async function testSubsectorsTable() {
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

    // Verificar tabelas relacionadas a subsetores
    console.log('\n🔍 Verificando tabelas relacionadas a subsetores...');
    const [tables] = await connection.execute("SHOW TABLES LIKE '%subsector%'");
    console.log('Tabelas encontradas:', tables);

    // Verificar se existe tabela 'subsetores'
    console.log('\n🔍 Verificando tabela subsetores...');
    const [subsetoresTable] = await connection.execute("SHOW TABLES LIKE 'subsetores'");
    console.log('Tabela subsetores existe:', subsetoresTable.length > 0);

    if (subsetoresTable.length > 0) {
      // Mostrar estrutura da tabela subsetores
      console.log('\n📋 Estrutura da tabela subsetores:');
      const [structure] = await connection.execute("DESCRIBE subsetores");
      console.table(structure);

      // Contar registros
      const [count] = await connection.execute("SELECT COUNT(*) as total FROM subsetores");
      console.log(`\n📊 Total de registros em subsetores: ${count[0].total}`);

      // Mostrar alguns registros
      if (count[0].total > 0) {
        console.log('\n📄 Primeiros registros:');
        const [records] = await connection.execute("SELECT * FROM subsetores LIMIT 5");
        console.table(records);
      }
    }

    // Verificar se existe tabela 'subsectors' (antiga)
    console.log('\n🔍 Verificando tabela subsectors (antiga)...');
    const [subsectorsTable] = await connection.execute("SHOW TABLES LIKE 'subsectors'");
    console.log('Tabela subsectors existe:', subsectorsTable.length > 0);

    if (subsectorsTable.length > 0) {
      console.log('\n⚠️  PROBLEMA: Tabela "subsectors" ainda existe no banco!');
      
      // Mostrar estrutura da tabela subsectors
      console.log('\n📋 Estrutura da tabela subsectors:');
      const [structure] = await connection.execute("DESCRIBE subsectors");
      console.table(structure);

      // Contar registros
      const [count] = await connection.execute("SELECT COUNT(*) as total FROM subsectors");
      console.log(`\n📊 Total de registros em subsectors: ${count[0].total}`);

      // Mostrar alguns registros
      if (count[0].total > 0) {
        console.log('\n📄 Registros na tabela subsectors:');
        const [records] = await connection.execute("SELECT * FROM subsectors LIMIT 5");
        console.table(records);
      }

      // Migrar dados se necessário
      console.log('\n🔄 Verificando se precisa migrar dados...');
      
      // Verificar se tabela subsetores existe para migração
      if (subsetoresTable.length === 0) {
        console.log('\n⚠️  Criando tabela subsetores...');
        
        await connection.execute(`
          CREATE TABLE subsetores (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            descricao TEXT,
            setor_id INT NOT NULL,
            ativo TINYINT(1) DEFAULT 1,
            criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_setor (setor_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        console.log('✅ Tabela subsetores criada');
        
        // Migrar dados
        console.log('\n🔄 Migrando dados de subsectors para subsetores...');
        await connection.execute(`
          INSERT INTO subsetores (id, nome, descricao, setor_id, ativo, criado_em, atualizado_em)
          SELECT id, name, description, sector_id, is_active, created_at, updated_at
          FROM subsectors
        `);
        
        console.log('✅ Dados migrados com sucesso');
        
        // Verificar migração
        const [migratedCount] = await connection.execute("SELECT COUNT(*) as total FROM subsetores");
        console.log(`📊 Total de registros migrados: ${migratedCount[0].total}`);
      }
    }

    // Testar inserção na tabela correta
    if (subsetoresTable.length > 0) {
      console.log('\n🧪 Testando inserção de subsetor...');
      
      try {
        // Pegar um setor existente
        const [setores] = await connection.execute("SELECT id FROM setores LIMIT 1");
        
        if (setores.length > 0) {
          const setorId = setores[0].id;
          
          const [result] = await connection.execute(`
            INSERT INTO subsetores (nome, descricao, setor_id, ativo) 
            VALUES (?, ?, ?, ?)
          `, ['Subsetor Teste DB', 'Descrição do subsetor de teste', setorId, 1]);
          
          console.log('✅ Subsetor inserido com sucesso! ID:', result.insertId);
          
          // Verificar se foi inserido
          const [inserted] = await connection.execute("SELECT * FROM subsetores WHERE id = ?", [result.insertId]);
          console.log('📄 Subsetor inserido:');
          console.table(inserted);
          
          // Limpar teste
          await connection.execute("DELETE FROM subsetores WHERE id = ?", [result.insertId]);
          console.log('🧹 Registro de teste removido');
        } else {
          console.log('⚠️  Nenhum setor encontrado para teste');
        }
        
      } catch (insertError) {
        console.error('❌ Erro ao inserir subsetor:', insertError.message);
      }
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

testSubsectorsTable();