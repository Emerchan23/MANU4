import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Carregar variáveis de ambiente
dotenv.config();

async function testSectorsSave() {
  console.log('🏢 Testando salvamento de setores...');
  
  // Configuração do banco
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_maintenance',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',
    timezone: '+00:00'
  };
  
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco MariaDB');
    
    // Primeiro, vamos verificar a estrutura da tabela sectors
    console.log('\n🔍 Verificando estrutura da tabela sectors...');
    const [structure] = await connection.execute('DESCRIBE sectors');
    
    console.log('📋 Estrutura da tabela sectors:');
    structure.forEach(column => {
      console.log(`   ${column.Field}: ${column.Type} ${column.Null === 'NO' ? '(NOT NULL)' : '(NULL)'} ${column.Key ? `[${column.Key}]` : ''}`);
    });
    
    // Dados de teste para setor (baseado na estrutura real)
    const testSector = {
      name: `Setor de Teste ${Date.now()}`,
      description: 'Descrição do setor de teste',
      manager_id: 1, // Assumindo que existe um manager com ID 1
      is_active: 1
    };
    
    console.log('\n📝 Dados do setor de teste:');
    console.log(`   Nome: ${testSector.name}`);
    console.log(`   Descrição: ${testSector.description}`);
    console.log(`   Manager ID: ${testSector.manager_id}`);
    console.log(`   Ativo: ${testSector.is_active}`);
    
    // Teste 1: Inserir setor
    console.log('\n1. Testando inserção de setor...');
    
    const insertQuery = `
      INSERT INTO sectors (
        name, description, manager_id, is_active
      ) VALUES (?, ?, ?, ?)
    `;
    
    const [insertResult] = await connection.execute(insertQuery, [
      testSector.name,
      testSector.description,
      testSector.manager_id,
      testSector.is_active
    ]);
    
    const sectorId = insertResult.insertId;
    console.log(`✅ Setor inserido com ID: ${sectorId}`);
    
    // Teste 2: Verificar se foi salvo corretamente
    console.log('\n2. Verificando se o setor foi salvo...');
    
    const [selectResult] = await connection.execute(
      'SELECT * FROM sectors WHERE id = ?',
      [sectorId]
    );
    
    if (selectResult.length > 0) {
      const savedSector = selectResult[0];
      console.log('✅ Setor encontrado no banco:');
      console.log(`   ID: ${savedSector.id}`);
      console.log(`   Nome: ${savedSector.name}`);
      console.log(`   Descrição: ${savedSector.description}`);
      console.log(`   Manager ID: ${savedSector.manager_id}`);
      console.log(`   Ativo: ${savedSector.is_active}`);
      console.log(`   Data criação: ${savedSector.created_at}`);
    } else {
      throw new Error('Setor não encontrado após inserção!');
    }
    
    // Teste 3: Atualizar setor
    console.log('\n3. Testando atualização de setor...');
    
    const updateQuery = `
      UPDATE sectors 
      SET name = ?, description = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    await connection.execute(updateQuery, [
      'Setor de Teste ATUALIZADO',
      'Descrição atualizada do setor de teste',
      sectorId
    ]);
    
    console.log('✅ Setor atualizado com sucesso');
    
    // Teste 4: Verificar atualização
    console.log('\n4. Verificando atualização...');
    
    const [updatedResult] = await connection.execute(
      'SELECT name, description, updated_at FROM sectors WHERE id = ?',
      [sectorId]
    );
    
    if (updatedResult.length > 0) {
      const updated = updatedResult[0];
      console.log('✅ Dados atualizados confirmados:');
      console.log(`   Nome: ${updated.name}`);
      console.log(`   Descrição: ${updated.description}`);
      console.log(`   Atualizado em: ${updated.updated_at}`);
    }
    
    // Teste 5: Contar total de setores
    console.log('\n5. Contando total de setores...');
    
    const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM sectors');
    console.log(`✅ Total de setores no banco: ${countResult[0].total}`);
    
    // Teste 6: Testar relacionamento com equipamentos
    console.log('\n6. Testando relacionamento com equipamentos...');
    
    const [equipmentResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM equipment WHERE sector_id = ?',
      [sectorId]
    );
    
    console.log(`✅ Equipamentos vinculados ao setor: ${equipmentResult[0].total}`);
    
    // Teste 7: Limpar dados de teste
    console.log('\n7. Limpando dados de teste...');
    
    await connection.execute('DELETE FROM sectors WHERE id = ?', [sectorId]);
    console.log('✅ Dados de teste removidos');
    
    console.log('\n🎉 Teste de salvamento de setores CONCLUÍDO COM SUCESSO!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro no teste de setores:', error.message);
    console.error('📋 Código do erro:', error.code);
    return false;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada.');
    }
  }
}

// Executar teste
testSectorsSave()
  .then(success => {
    console.log(`\n📊 Resultado do teste de setores: ${success ? 'SUCESSO' : 'FALHA'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });