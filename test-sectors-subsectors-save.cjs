const mysql = require('mysql2/promise');
require('dotenv').config();

async function testSectorsSubsectorsSave() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao banco MariaDB...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance',
      port: parseInt(process.env.DB_PORT || '3306')
    });

    console.log('✅ Conectado ao banco com sucesso!');

    // Teste 1: Inserir um novo setor
    console.log('\n🏢 Teste 1: Inserindo novo setor...');
    
    const sectorName = `Setor Teste ${Date.now()}`;
    const sectorDescription = 'Setor criado para teste de salvamento';
    const sectorResponsible = 'Responsável Teste';
    
    const [sectorResult] = await connection.execute(`
      INSERT INTO setores (nome, descricao, responsavel, ativo) 
      VALUES (?, ?, ?, 1)
    `, [sectorName, sectorDescription, sectorResponsible]);
    
    const sectorId = sectorResult.insertId;
    console.log('✅ Setor criado com ID:', sectorId);
    
    // Verificar se o setor foi salvo
    const [sectorCheck] = await connection.execute(
      'SELECT * FROM setores WHERE id = ?', 
      [sectorId]
    );
    console.log('📊 Dados do setor salvo:', sectorCheck[0]);

    // Teste 2: Inserir um novo subsetor
    console.log('\n🏗️ Teste 2: Inserindo novo subsetor...');
    
    const subsectorName = `Subsetor Teste ${Date.now()}`;
    const subsectorDescription = 'Subsetor criado para teste de salvamento';
    
    const [subsectorResult] = await connection.execute(`
      INSERT INTO subsectors (nome, description, sector_id) 
      VALUES (?, ?, ?)
    `, [subsectorName, subsectorDescription, sectorId]);
    
    const subsectorId = subsectorResult.insertId;
    console.log('✅ Subsetor criado com ID:', subsectorId);
    
    // Verificar se o subsetor foi salvo
    const [subsectorCheck] = await connection.execute(
      'SELECT * FROM subsectors WHERE id = ?', 
      [subsectorId]
    );
    console.log('📊 Dados do subsetor salvo:', subsectorCheck[0]);

    // Teste 3: Verificar relacionamento
    console.log('\n🔗 Teste 3: Verificando relacionamento setor-subsetor...');
    
    const [relationshipCheck] = await connection.execute(`
      SELECT 
        s.id as sector_id,
        s.nome as sector_name,
        ss.id as subsector_id,
        ss.nome as subsector_name
      FROM setores s
      LEFT JOIN subsectors ss ON s.id = ss.sector_id
      WHERE s.id = ?
    `, [sectorId]);
    
    console.log('📊 Relacionamento encontrado:', relationshipCheck);

    // Teste 4: Atualizar setor
    console.log('\n🔄 Teste 4: Atualizando setor...');
    
    const updatedSectorName = `${sectorName} - Atualizado`;
    const [updateSectorResult] = await connection.execute(`
      UPDATE setores 
      SET nome = ?, descricao = ?, atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [updatedSectorName, `${sectorDescription} - Atualizado`, sectorId]);
    
    console.log('✅ Setor atualizado, linhas afetadas:', updateSectorResult.affectedRows);

    // Teste 5: Atualizar subsetor
    console.log('\n🔄 Teste 5: Atualizando subsetor...');
    
    const updatedSubsectorName = `${subsectorName} - Atualizado`;
    const [updateSubsectorResult] = await connection.execute(`
      UPDATE subsectors 
      SET nome = ?, description = ?
      WHERE id = ?
    `, [updatedSubsectorName, `${subsectorDescription} - Atualizado`, subsectorId]);
    
    console.log('✅ Subsetor atualizado, linhas afetadas:', updateSubsectorResult.affectedRows);

    // Limpeza: Remover dados de teste
    console.log('\n🧹 Limpeza: Removendo dados de teste...');
    
    await connection.execute('DELETE FROM subsectors WHERE id = ?', [subsectorId]);
    await connection.execute('DELETE FROM setores WHERE id = ?', [sectorId]);
    
    console.log('✅ Dados de teste removidos com sucesso!');
    
    console.log('\n🎉 Todos os testes de salvamento foram executados com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

testSectorsSubsectorsSave();