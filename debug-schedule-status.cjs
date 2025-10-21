const mysql = require('mysql2/promise');
require('dotenv').config();

async function debugScheduleStatus() {
  console.log('🔍 Debugando problema com status do agendamento...');
  
  // Configuração do banco de dados
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
    console.log('✅ Conectado ao banco de dados');
    
    // 1. Verificar estrutura da tabela maintenance_schedules
    console.log('\n📋 Verificando estrutura da tabela maintenance_schedules...');
    const [columns] = await connection.execute('DESCRIBE maintenance_schedules');
    
    console.log('Colunas da tabela:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Default !== null ? `DEFAULT: ${col.Default}` : ''}`);
    });
    
    // 2. Criar um agendamento de teste e verificar o que acontece
    console.log('\n📋 Criando agendamento de teste...');
    
    const [insertResult] = await connection.execute(`
      INSERT INTO maintenance_schedules (
        equipment_id, 
        scheduled_date, 
        status, 
        priority, 
        description, 
        assigned_user_id,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      17, // equipment_id existente
      '2025-01-20', // scheduled_date
      'concluido', // status
      'ALTA', // priority
      'Debug - Teste de status', // description
      1 // assigned_user_id
    ]);
    
    const testScheduleId = insertResult.insertId;
    console.log(`✅ Agendamento criado com ID: ${testScheduleId}`);
    
    // 3. Verificar o que foi realmente salvo
    console.log('\n📊 Verificando dados salvos...');
    const [savedData] = await connection.execute(`
      SELECT id, status, priority, description, equipment_id, assigned_user_id
      FROM maintenance_schedules 
      WHERE id = ?
    `, [testScheduleId]);
    
    if (savedData.length > 0) {
      const schedule = savedData[0];
      console.log('Dados salvos:');
      console.log(`  ID: ${schedule.id}`);
      console.log(`  Status: "${schedule.status}" (length: ${schedule.status ? schedule.status.length : 'null'})`);
      console.log(`  Priority: "${schedule.priority}"`);
      console.log(`  Description: "${schedule.description}"`);
      console.log(`  Equipment ID: ${schedule.equipment_id}`);
      console.log(`  Assigned User ID: ${schedule.assigned_user_id}`);
      
      // Verificar se há caracteres especiais ou espaços
      if (schedule.status) {
        console.log(`  Status (hex): ${Buffer.from(schedule.status).toString('hex')}`);
        console.log(`  Status (char codes): ${Array.from(schedule.status).map(c => c.charCodeAt(0)).join(', ')}`);
      }
    }
    
    // 4. Tentar atualizar o status diretamente
    console.log('\n🔄 Tentando atualizar status diretamente...');
    const [updateResult] = await connection.execute(`
      UPDATE maintenance_schedules 
      SET status = 'concluido'
      WHERE id = ?
    `, [testScheduleId]);
    
    console.log(`📊 Linhas afetadas na atualização: ${updateResult.affectedRows}`);
    
    // 5. Verificar novamente após atualização
    const [updatedData] = await connection.execute(`
      SELECT id, status, priority, description
      FROM maintenance_schedules 
      WHERE id = ?
    `, [testScheduleId]);
    
    if (updatedData.length > 0) {
      const schedule = updatedData[0];
      console.log('\nDados após atualização:');
      console.log(`  ID: ${schedule.id}`);
      console.log(`  Status: "${schedule.status}" (length: ${schedule.status ? schedule.status.length : 'null'})`);
      console.log(`  Priority: "${schedule.priority}"`);
      console.log(`  Description: "${schedule.description}"`);
      
      // Verificar comparação de string
      console.log(`\n🔍 Testes de comparação:`);
      console.log(`  status === 'concluido': ${schedule.status === 'concluido'}`);
      console.log(`  status == 'concluido': ${schedule.status == 'concluido'}`);
      console.log(`  status.trim() === 'concluido': ${schedule.status ? schedule.status.trim() === 'concluido' : 'N/A'}`);
      console.log(`  status !== 'concluido': ${schedule.status !== 'concluido'}`);
    }
    
    // 6. Testar a conversão agora
    console.log('\n🔄 Testando conversão via API...');
    
    const fetch = (await import('node-fetch')).default;
    
    try {
      const response = await fetch('http://localhost:3000/api/maintenance-schedules/convert-to-service-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scheduleId: testScheduleId.toString(),
          userId: 1
        })
      });
      
      const responseText = await response.text();
      console.log('📊 Status da resposta:', response.status);
      
      try {
        const responseJson = JSON.parse(responseText);
        console.log('📊 Resposta da API:');
        console.log(JSON.stringify(responseJson, null, 2));
        
        if (response.ok) {
          console.log('✅ Conversão realizada com sucesso!');
        } else {
          console.log('❌ Erro na conversão');
        }
        
      } catch (parseError) {
        console.log('❌ Erro ao fazer parse da resposta JSON:');
        console.log('Resposta raw:', responseText);
      }
      
    } catch (fetchError) {
      console.log('❌ Erro na requisição:', fetchError.message);
    }
    
    // 7. Limpar dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    
    await connection.execute(`
      DELETE FROM service_orders WHERE schedule_id = ?
    `, [testScheduleId]);
    
    await connection.execute(`
      DELETE FROM maintenance_schedules WHERE id = ?
    `, [testScheduleId]);
    
    console.log('✅ Dados de teste removidos');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('❌ Stack trace:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada.');
    }
  }
}

debugScheduleStatus();