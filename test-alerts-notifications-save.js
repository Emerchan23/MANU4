import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Carregar variáveis de ambiente
dotenv.config();

async function testAlertsNotificationsSave() {
  console.log('🔔 Testando salvamento de alertas e notificações...');
  
  // Configuração do banco
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_maintenance'
  };
  
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco MariaDB');
    
    // Verificar estrutura da tabela notifications
    console.log('\n🔍 Verificando estrutura da tabela notifications...');
    const [notificationStructure] = await connection.execute('DESCRIBE notifications');
    
    console.log('📋 Estrutura da tabela notifications:');
    notificationStructure.forEach(column => {
      console.log(`   ${column.Field}: ${column.Type} ${column.Null === 'NO' ? '(NOT NULL)' : '(NULL)'} ${column.Key ? `[${column.Key}]` : ''}`);
    });
    
    // Buscar usuário existente
    console.log('\n🔍 Buscando usuário existente...');
    const [userResult] = await connection.execute('SELECT id FROM users LIMIT 1');
    
    if (userResult.length === 0) {
      throw new Error('Nenhum usuário encontrado no banco');
    }
    
    const userId = userResult[0].id;
    console.log(`✅ Usuário encontrado com ID: ${userId}`);
    
    // TESTE 1: NOTIFICAÇÕES
    console.log('\n=== TESTANDO NOTIFICAÇÕES ===');
    
    // Dados de teste para notificação
    const testNotification = {
      user_id: userId,
      title: 'Notificação de Teste',
      message: 'Esta é uma notificação de teste para verificar o sistema de salvamento',
      type: 'system',
      priority: 'medium',
      reference_type: 'system',
      reference_id: 1,
      is_read: false
    };
    
    console.log('\n📝 Dados da notificação de teste:');
    console.log(`   Usuário ID: ${testNotification.user_id}`);
    console.log(`   Título: ${testNotification.title}`);
    console.log(`   Tipo: ${testNotification.type}`);
    console.log(`   Prioridade: ${testNotification.priority}`);
    
    // 1. Testar inserção de notificação
    console.log('\n1. Testando inserção de notificação...');
    const insertNotificationQuery = `
      INSERT INTO notifications (
        user_id, title, message, type, priority, reference_type, reference_id, is_read
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [insertNotificationResult] = await connection.execute(insertNotificationQuery, [
      testNotification.user_id,
      testNotification.title,
      testNotification.message,
      testNotification.type,
      testNotification.priority,
      testNotification.reference_type,
      testNotification.reference_id,
      testNotification.is_read
    ]);
    
    const notificationId = insertNotificationResult.insertId;
    console.log(`✅ Notificação inserida com ID: ${notificationId}`);
    
    // 2. Verificar inserção de notificação
    console.log('\n2. Verificando inserção de notificação...');
    const [selectNotificationResult] = await connection.execute(
      'SELECT * FROM notifications WHERE id = ?',
      [notificationId]
    );
    
    if (selectNotificationResult.length === 0) {
      throw new Error('Notificação não foi inserida corretamente');
    }
    
    console.log('✅ Notificação inserida com sucesso!');
    console.log(`   ID: ${selectNotificationResult[0].id}`);
    console.log(`   Título: ${selectNotificationResult[0].title}`);
    console.log(`   Lida: ${selectNotificationResult[0].is_read}`);
    
    // 3. Testar atualização de notificação (marcar como lida)
    console.log('\n3. Testando atualização de notificação (marcar como lida)...');
    const updateNotificationQuery = `
      UPDATE notifications 
      SET is_read = 1, read_at = NOW(), title = ?
      WHERE id = ?
    `;
    
    await connection.execute(updateNotificationQuery, [
      'Notificação de Teste LIDA',
      notificationId
    ]);
    
    // 4. Verificar atualização de notificação
    console.log('\n4. Verificando atualização de notificação...');
    const [updateNotificationResult] = await connection.execute(
      'SELECT is_read, read_at, title FROM notifications WHERE id = ?',
      [notificationId]
    );
    
    if (!updateNotificationResult[0].is_read) {
      throw new Error('Notificação não foi marcada como lida');
    }
    
    console.log('✅ Notificação atualizada com sucesso!');
    console.log(`   Lida: ${updateNotificationResult[0].is_read}`);
    console.log(`   Lida em: ${updateNotificationResult[0].read_at}`);
    console.log(`   Título: ${updateNotificationResult[0].title}`);
    
    // TESTE 2: ALERTAS
    console.log('\n=== TESTANDO ALERTAS ===');
    
    // Dados de teste para alerta (usando notifications como alertas)
    const testAlert = {
      user_id: userId,
      type: 'alert',
      title: 'Alerta de Teste - Manutenção Vencida',
      message: 'Este é um alerta de teste para verificar o sistema de salvamento',
      priority: 'high',
      reference_type: 'maintenance',
      reference_id: 1,
      is_read: false
    };
    
    console.log('\n📝 Dados do alerta de teste:');
    console.log(`   Título: ${testAlert.title}`);
    console.log(`   Tipo: ${testAlert.type}`);
    console.log(`   Prioridade: ${testAlert.priority}`);
    console.log(`   Referência: ${testAlert.reference_type}`);
    
    // 5. Testar inserção de alerta
    console.log('\n5. Testando inserção de alerta...');
    const insertAlertQuery = `
      INSERT INTO notifications (
        user_id, type, title, message, priority, reference_type, reference_id, is_read
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [insertAlertResult] = await connection.execute(insertAlertQuery, [
      testAlert.user_id,
      testAlert.type,
      testAlert.title,
      testAlert.message,
      testAlert.priority,
      testAlert.reference_type,
      testAlert.reference_id,
      testAlert.is_read
    ]);
    
    const alertId = insertAlertResult.insertId;
    console.log(`✅ Alerta inserido com ID: ${alertId}`);
    
    // 6. Verificar inserção de alerta
    console.log('\n6. Verificando inserção de alerta...');
    const [selectAlertResult] = await connection.execute(
      'SELECT * FROM notifications WHERE id = ?',
      [alertId]
    );
    
    if (selectAlertResult.length === 0) {
      throw new Error('Alerta não foi inserido corretamente');
    }
    
    console.log('✅ Alerta inserido com sucesso!');
    console.log(`   ID: ${selectAlertResult[0].id}`);
    console.log(`   Título: ${selectAlertResult[0].title}`);
    console.log(`   Status: ${selectAlertResult[0].status}`);
    
    // 7. Testar atualização de alerta (marcar como lido)
    console.log('\n7. Testando atualização de alerta (marcar como lido)...');
    const updateAlertQuery = `
      UPDATE notifications 
      SET is_read = 1, read_at = NOW(), priority = 'low'
      WHERE id = ?
    `;
    
    await connection.execute(updateAlertQuery, [alertId]);
    
    // 8. Verificar atualização de alerta
    console.log('\n8. Verificando atualização de alerta...');
    const [updateAlertResult] = await connection.execute(
      'SELECT is_read, read_at, priority FROM notifications WHERE id = ?',
      [alertId]
    );
    
    if (!updateAlertResult[0].is_read) {
      throw new Error('Alerta não foi marcado como lido corretamente');
    }
    
    console.log('✅ Alerta atualizado com sucesso!');
    console.log(`   Lido: ${updateAlertResult[0].is_read}`);
    console.log(`   Lido em: ${updateAlertResult[0].read_at}`);
    console.log(`   Prioridade: ${updateAlertResult[0].priority}`);
    
    // 9. Contar totais
    console.log('\n9. Contando totais...');
    const [notificationCount] = await connection.execute('SELECT COUNT(*) as total FROM notifications WHERE type IN ("system", "service_order", "request")');
    const [alertCount] = await connection.execute('SELECT COUNT(*) as total FROM notifications WHERE type = "alert"');
    
    console.log(`✅ Total de notificações no banco: ${notificationCount[0].total}`);
    console.log(`✅ Total de alertas no banco: ${alertCount[0].total}`);
    
    // 10. Testar relacionamentos
    console.log('\n10. Testando relacionamentos...');
    
    // Relacionamento notificação-usuário
    const [notificationRelation] = await connection.execute(`
      SELECT u.nick as user_nick, n.title as notification_title, n.reference_type
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      WHERE n.id = ?
    `, [notificationId]);
    
    if (notificationRelation.length > 0) {
      const rel = notificationRelation[0];
      console.log(`✅ Relacionamento notificação confirmado:`);
      console.log(`   Usuário: ${rel.user_nick}`);
      console.log(`   Notificação: ${rel.notification_title}`);
      console.log(`   Referência: ${rel.reference_type}`);
    }
    
    // Relacionamento alerta-usuário
    const [alertRelation] = await connection.execute(`
      SELECT u.nick as user_nick, n.title as alert_title, n.reference_type
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      WHERE n.id = ? AND n.type = 'alert'
    `, [alertId]);
    
    if (alertRelation.length > 0) {
      const rel = alertRelation[0];
      console.log(`✅ Relacionamento alerta confirmado:`);
      console.log(`   Usuário: ${rel.user_nick}`);
      console.log(`   Alerta: ${rel.alert_title}`);
      console.log(`   Referência: ${rel.reference_type}`);
    }
    
    // 11. Limpar dados de teste
    console.log('\n11. Limpando dados de teste...');
    await connection.execute('DELETE FROM notifications WHERE id = ?', [notificationId]);
    await connection.execute('DELETE FROM notifications WHERE id = ?', [alertId]);
    console.log('✅ Dados de teste removidos');
    
    console.log('\n🎉 Teste de salvamento de alertas e notificações CONCLUÍDO COM SUCESSO!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro no teste de alertas e notificações:', error.message);
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
testAlertsNotificationsSave()
  .then(success => {
    console.log(`\n📊 Resultado do teste de alertas e notificações: ${success ? 'SUCESSO' : 'FALHA'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });