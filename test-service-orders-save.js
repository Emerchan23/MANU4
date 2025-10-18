import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Carregar variáveis de ambiente
dotenv.config();

async function testServiceOrdersSave() {
  console.log('🔧 Testando salvamento de ordens de serviço...');
  
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
    
    // Primeiro, vamos verificar a estrutura da tabela service_orders
    console.log('\n🔍 Verificando estrutura da tabela service_orders...');
    const [structure] = await connection.execute('DESCRIBE service_orders');
    
    console.log('📋 Estrutura da tabela service_orders:');
    structure.forEach(column => {
      console.log(`   ${column.Field}: ${column.Type} ${column.Null === 'NO' ? '(NOT NULL)' : '(NULL)'} ${column.Key ? `[${column.Key}]` : ''}`);
    });
    
    // Vamos buscar um equipamento existente para usar na ordem de serviço
    console.log('\n🔍 Buscando equipamento existente...');
    const [equipmentResult] = await connection.execute('SELECT id FROM equipment LIMIT 1');
    
    if (equipmentResult.length === 0) {
      throw new Error('Nenhum equipamento encontrado no banco para criar ordem de serviço');
    }
    
    const equipmentId = equipmentResult[0].id;
    console.log(`✅ Equipamento encontrado com ID: ${equipmentId}`);
    
    // Vamos buscar um usuário existente para usar como requester_id
    console.log('\n🔍 Buscando usuário existente...');
    const [userResult] = await connection.execute('SELECT id FROM users LIMIT 1');
    
    if (userResult.length === 0) {
      throw new Error('Nenhum usuário encontrado no banco para criar ordem de serviço');
    }
    
    const requesterId = userResult[0].id;
    console.log(`✅ Usuário encontrado com ID: ${requesterId}`);
    
    // Dados de teste para ordem de serviço (baseado na estrutura real)
    const testServiceOrder = {
      number: `OS${Date.now()}`,
      equipment_id: equipmentId,
      requester_id: requesterId,
      type: 'preventive',
      priority: 'medium',
      status: 'open',
      title: 'Manutenção Preventiva de Teste',
      description: 'Ordem de serviço de teste para verificação do sistema de salvamento',
      scheduled_date: new Date().toISOString().slice(0, 19).replace('T', ' '), // Formato datetime
      labor_hours: 2.5,
      cost: 150.00
    };
    
    console.log('\n📝 Dados da ordem de serviço de teste:');
    console.log(`   Número: ${testServiceOrder.number}`);
    console.log(`   Equipamento ID: ${testServiceOrder.equipment_id}`);
    console.log(`   Requester ID: ${testServiceOrder.requester_id}`);
    console.log(`   Tipo: ${testServiceOrder.type}`);
    console.log(`   Prioridade: ${testServiceOrder.priority}`);
    console.log(`   Status: ${testServiceOrder.status}`);
    
    // Teste 1: Inserir ordem de serviço
    console.log('\n1. Testando inserção de ordem de serviço...');
    
    const insertQuery = `
      INSERT INTO service_orders (
        number, equipment_id, requester_id, type, priority, status, 
        title, description, scheduled_date, labor_hours, cost
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [insertResult] = await connection.execute(insertQuery, [
      testServiceOrder.number,
      testServiceOrder.equipment_id,
      testServiceOrder.requester_id,
      testServiceOrder.type,
      testServiceOrder.priority,
      testServiceOrder.status,
      testServiceOrder.title,
      testServiceOrder.description,
      testServiceOrder.scheduled_date,
      testServiceOrder.labor_hours,
      testServiceOrder.cost
    ]);
    
    const serviceOrderId = insertResult.insertId;
    console.log(`✅ Ordem de serviço inserida com ID: ${serviceOrderId}`);
    
    // Teste 2: Verificar se foi salva corretamente
    console.log('\n2. Verificando se a ordem de serviço foi salva...');
    
    const [selectResult] = await connection.execute(
      'SELECT * FROM service_orders WHERE id = ?',
      [serviceOrderId]
    );
    
    if (selectResult.length > 0) {
      const savedOrder = selectResult[0];
      console.log('✅ Ordem de serviço encontrada no banco:');
      console.log(`   ID: ${savedOrder.id}`);
      console.log(`   Número: ${savedOrder.number}`);
      console.log(`   Equipamento ID: ${savedOrder.equipment_id}`);
      console.log(`   Tipo: ${savedOrder.type}`);
      console.log(`   Status: ${savedOrder.status}`);
      console.log(`   Data criação: ${savedOrder.created_at}`);
    } else {
      throw new Error('Ordem de serviço não encontrada após inserção!');
    }
    
    // Teste 3: Atualizar ordem de serviço
    console.log('\n3. Testando atualização de ordem de serviço...');
    
    const updateQuery = `
      UPDATE service_orders 
      SET status = ?, priority = ?, title = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    await connection.execute(updateQuery, [
      'in_progress',
      'high',
      'Manutenção Preventiva ATUALIZADA',
      serviceOrderId
    ]);
    
    console.log('✅ Ordem de serviço atualizada com sucesso');
    
    // Teste 4: Verificar atualização
    console.log('\n4. Verificando atualização...');
    
    const [updatedResult] = await connection.execute(
      'SELECT status, priority, title, updated_at FROM service_orders WHERE id = ?',
      [serviceOrderId]
    );
    
    if (updatedResult.length > 0) {
      const updated = updatedResult[0];
      console.log('✅ Dados atualizados confirmados:');
      console.log(`   Status: ${updated.status}`);
      console.log(`   Prioridade: ${updated.priority}`);
      console.log(`   Título: ${updated.title}`);
      console.log(`   Atualizado em: ${updated.updated_at}`);
    }
    
    // Teste 5: Contar total de ordens de serviço
    console.log('\n5. Contando total de ordens de serviço...');
    
    const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM service_orders');
    console.log(`✅ Total de ordens de serviço no banco: ${countResult[0].total}`);
    
    // Teste 6: Testar relacionamento com equipamento
    console.log('\n6. Testando relacionamento com equipamento...');
    
    const [equipmentRelationResult] = await connection.execute(`
      SELECT e.name as equipment_name, so.number as order_number
      FROM service_orders so
      JOIN equipment e ON so.equipment_id = e.id
      WHERE so.id = ?
    `, [serviceOrderId]);
    
    if (equipmentRelationResult.length > 0) {
      const relation = equipmentRelationResult[0];
      console.log(`✅ Relacionamento confirmado:`);
      console.log(`   Equipamento: ${relation.equipment_name}`);
      console.log(`   Ordem: ${relation.order_number}`);
    }
    
    // Teste 7: Limpar dados de teste
    console.log('\n7. Limpando dados de teste...');
    
    await connection.execute('DELETE FROM service_orders WHERE id = ?', [serviceOrderId]);
    console.log('✅ Dados de teste removidos');
    
    console.log('\n🎉 Teste de salvamento de ordens de serviço CONCLUÍDO COM SUCESSO!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro no teste de ordens de serviço:', error.message);
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
testServiceOrdersSave()
  .then(success => {
    console.log(`\n📊 Resultado do teste de ordens de serviço: ${success ? 'SUCESSO' : 'FALHA'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });