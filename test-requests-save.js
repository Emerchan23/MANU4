import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Carregar variáveis de ambiente
dotenv.config();

async function testRequestsSave() {
  console.log('📋 Testando salvamento de solicitações...');
  
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
    
    // Primeiro, vamos verificar a estrutura da tabela requests
    console.log('\n🔍 Verificando estrutura da tabela requests...');
    const [structure] = await connection.execute('DESCRIBE requests');
    
    console.log('📋 Estrutura da tabela requests:');
    structure.forEach(column => {
      console.log(`   ${column.Field}: ${column.Type} ${column.Null === 'NO' ? '(NOT NULL)' : '(NULL)'} ${column.Key ? `[${column.Key}]` : ''}`);
    });
    
    // Vamos buscar um equipamento existente para usar na solicitação
    console.log('\n🔍 Buscando equipamento existente...');
    const [equipmentResult] = await connection.execute('SELECT id FROM equipment LIMIT 1');
    
    if (equipmentResult.length === 0) {
      throw new Error('Nenhum equipamento encontrado no banco para criar solicitação');
    }
    
    const equipmentId = equipmentResult[0].id;
    console.log(`✅ Equipamento encontrado com ID: ${equipmentId}`);
    
    // Vamos buscar um usuário existente para usar como requester_id
    console.log('\n🔍 Buscando usuário existente...');
    const [userResult] = await connection.execute('SELECT id FROM users LIMIT 1');
    
    if (userResult.length === 0) {
      throw new Error('Nenhum usuário encontrado no banco para criar solicitação');
    }
    
    const requesterId = userResult[0].id;
    console.log(`✅ Usuário encontrado com ID: ${requesterId}`);
    
    // Vamos buscar um setor existente para usar como sector_id (obrigatório)
    console.log('\n🔍 Buscando setor existente...');
    const [sectorResult] = await connection.execute('SELECT id FROM sectors LIMIT 1');
    
    if (sectorResult.length === 0) {
      throw new Error('Nenhum setor encontrado no banco para criar solicitação');
    }
    
    const sectorId = sectorResult[0].id;
    console.log(`✅ Setor encontrado com ID: ${sectorId}`);
    
    // Dados de teste para solicitação (baseado na estrutura real)
    const testRequest = {
      number: `REQ${Date.now()}`,
      equipment_id: equipmentId,
      requester_id: requesterId,
      sector_id: sectorId,
      type: 'maintenance',
      priority: 'medium',
      status: 'pending',
      title: 'Solicitação de Manutenção de Teste',
      description: 'Solicitação de teste para verificação do sistema de salvamento',
      justification: 'Teste do sistema de solicitações'
    };
    
    console.log('\n📝 Dados da solicitação de teste:');
    console.log(`   Número: ${testRequest.number}`);
    console.log(`   Equipamento ID: ${testRequest.equipment_id}`);
    console.log(`   Requester ID: ${testRequest.requester_id}`);
    console.log(`   Tipo: ${testRequest.type}`);
    console.log(`   Prioridade: ${testRequest.priority}`);
    console.log(`   Status: ${testRequest.status}`);
    
    // 1. Testar inserção
    console.log('\n1. Testando inserção de solicitação...');
    const insertQuery = `
      INSERT INTO requests (
        number, equipment_id, requester_id, sector_id, type, priority, status, 
        title, description, justification
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [insertResult] = await connection.execute(insertQuery, [
      testRequest.number,
      testRequest.equipment_id,
      testRequest.requester_id,
      testRequest.sector_id,
      testRequest.type,
      testRequest.priority,
      testRequest.status,
      testRequest.title,
      testRequest.description,
      testRequest.justification
    ]);
    
    const requestId = insertResult.insertId;
    console.log(`✅ Solicitação inserida com ID: ${requestId}`);
    
    // 2. Verificar inserção
    console.log('\n2. Verificando inserção...');
    const [selectResult] = await connection.execute(
      'SELECT * FROM requests WHERE number = ?',
      [testRequest.number]
    );
    
    if (selectResult.length === 0) {
      throw new Error('Solicitação não foi inserida corretamente');
    }
    
    console.log('✅ Solicitação inserida com sucesso!');
    console.log(`   ID: ${selectResult[0].id}`);
    console.log(`   Número: ${selectResult[0].number}`);
    console.log(`   Título: ${selectResult[0].title}`);
    console.log(`   Status: ${selectResult[0].status}`);
    
    // 3. Testar atualização
    console.log('\n3. Testando atualização de solicitação...');
    const updateQuery = `
      UPDATE requests 
      SET status = ?, priority = ?, title = ?
      WHERE id = ?
    `;
    
    await connection.execute(updateQuery, [
      'approved',
      'high',
      'Solicitação de Manutenção ATUALIZADA',
      requestId
    ]);
    
    // 4. Verificar atualização
    console.log('\n4. Verificando atualização...');
    const [updateResult] = await connection.execute(
      'SELECT status, priority, title FROM requests WHERE id = ?',
      [requestId]
    );
    
    if (updateResult[0].status !== 'approved' || 
        updateResult[0].priority !== 'high' ||
        updateResult[0].title !== 'Solicitação de Manutenção ATUALIZADA') {
      throw new Error('Solicitação não foi atualizada corretamente');
    }
    
    console.log('✅ Solicitação atualizada com sucesso!');
     console.log(`   Status: ${updateResult[0].status}`);
     console.log(`   Prioridade: ${updateResult[0].priority}`);
     console.log(`   Título: ${updateResult[0].title}`);
    
    // Teste 5: Contar total de solicitações
    console.log('\n5. Contando total de solicitações...');
    
    const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM requests');
    console.log(`✅ Total de solicitações no banco: ${countResult[0].total}`);
    
    // Teste 6: Testar relacionamento com equipamento
    console.log('\n6. Testando relacionamento com equipamento...');
    
    const [equipmentRelationResult] = await connection.execute(`
      SELECT e.name as equipment_name, r.number as request_number
      FROM requests r
      JOIN equipment e ON r.equipment_id = e.id
      WHERE r.id = ?
    `, [requestId]);
    
    if (equipmentRelationResult.length > 0) {
      const relation = equipmentRelationResult[0];
      console.log(`✅ Relacionamento confirmado:`);
      console.log(`   Equipamento: ${relation.equipment_name}`);
      console.log(`   Solicitação: ${relation.request_number}`);
    }
    
    // Teste 7: Limpar dados de teste
    console.log('\n7. Limpando dados de teste...');
    
    await connection.execute('DELETE FROM requests WHERE id = ?', [requestId]);
    console.log('✅ Dados de teste removidos');
    
    console.log('\n🎉 Teste de salvamento de solicitações CONCLUÍDO COM SUCESSO!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro no teste de solicitações:', error.message);
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
testRequestsSave()
  .then(success => {
    console.log(`\n📊 Resultado do teste de solicitações: ${success ? 'SUCESSO' : 'FALHA'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });