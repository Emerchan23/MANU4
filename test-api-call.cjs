const mysql = require('mysql2/promise');

async function testApiCall() {
  let connection;
  
  try {
    console.log('🔍 Testando atualização direta no banco de dados...');
    
    // Configuração do banco de dados
    const dbConfig = {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance',
      port: 3306
    };

    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');
    
    const scheduleId = 8;
    const updateData = {
      status: 'concluido',
      observations: 'Teste de observações - campos funcionando corretamente'
    };

    console.log('📊 Dados sendo atualizados:', updateData);

    // Verificar o registro antes da atualização
    console.log('\n🔍 Estado ANTES da atualização:');
    const [beforeUpdate] = await connection.execute(
      'SELECT id, status, observations FROM maintenance_schedules WHERE id = ?',
      [scheduleId]
    );
    console.log('📊 Registro atual:', beforeUpdate[0]);

    // Executar a atualização
    const updateQuery = `
      UPDATE maintenance_schedules 
      SET status = ?, observations = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    const [updateResult] = await connection.execute(updateQuery, [
      updateData.status,
      updateData.observations,
      scheduleId
    ]);

    console.log('\n📊 Resultado da atualização:', {
      affectedRows: updateResult.affectedRows,
      changedRows: updateResult.changedRows,
      info: updateResult.info
    });

    // Verificar o registro após a atualização
    console.log('\n🔍 Estado APÓS a atualização:');
    const [afterUpdate] = await connection.execute(
      'SELECT id, status, observations, updated_at FROM maintenance_schedules WHERE id = ?',
      [scheduleId]
    );
    console.log('📊 Registro atualizado:', afterUpdate[0]);

    // Testar a query completa do API
    console.log('\n🔍 Testando query completa do API:');
    const [fullQuery] = await connection.execute(`
      SELECT 
        ms.*,
        e.name as equipment_name,
        e.patrimonio as equipment_code,
        e.model as equipment_model,
        e.sector_id,
        c.name as company_name,
        u.name as assigned_user_name
      FROM maintenance_schedules ms
      LEFT JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN companies c ON ms.company_id = c.id
      LEFT JOIN users u ON ms.assigned_user_id = u.id
      WHERE ms.id = ?
    `, [scheduleId]);

    if (fullQuery.length > 0) {
      console.log('✅ Query completa executada com sucesso!');
      console.log('📊 Dados completos:', fullQuery[0]);
    } else {
      console.log('❌ Query completa não retornou resultados');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada');
    }
  }
}

testApiCall();