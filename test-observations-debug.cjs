const mysql = require('mysql2/promise');

async function testObservationsField() {
  console.log('🧪 Testando campo Observações - Debug completo...\n');
  
  try {
    // Conectar ao banco de dados
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('✅ Conectado ao banco de dados');

    // Teste 1: Verificar estrutura da tabela
    console.log('\n1. Verificando estrutura da tabela service_orders...');
    const [columns] = await connection.execute('DESCRIBE service_orders');
    
    const observationsColumn = columns.find(col => col.Field === 'observations');
    if (observationsColumn) {
      console.log('✅ Campo observations encontrado na tabela:');
      console.log('   Tipo:', observationsColumn.Type);
      console.log('   Null:', observationsColumn.Null);
      console.log('   Default:', observationsColumn.Default);
    } else {
      console.log('❌ Campo observations NÃO encontrado na tabela!');
      console.log('Colunas disponíveis:', columns.map(col => col.Field).join(', '));
      return;
    }

    // Teste 2: Criar ordem de serviço com observações
    console.log('\n2. Criando ordem de serviço com observações...');
    
    const testObservations = 'Esta é uma observação de teste para verificar se está sendo salva corretamente no banco de dados.';
    
    const [insertResult] = await connection.execute(`
      INSERT INTO service_orders (
        order_number, equipment_id, created_by, assigned_to, company_id,
        description, priority, status, requested_date, scheduled_date, cost, type, observations
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?)
    `, [
      'OS-DEBUG-001',  // order_number
      1,               // equipment_id
      1,               // created_by
      null,            // assigned_to
      1,               // company_id
      'Teste do campo observações',  // description
      'media',         // priority
      'aberta',        // status
      null,            // scheduled_date
      0,               // cost
      'PREVENTIVA',    // type
      testObservations // observations
    ]);

    const orderId = insertResult.insertId;
    console.log(`✅ Ordem criada com ID: ${orderId}`);

    // Teste 3: Verificar se foi salvo corretamente
    console.log('\n3. Verificando se as observações foram salvas...');
    
    const [selectResult] = await connection.execute(
      'SELECT id, order_number, observations FROM service_orders WHERE id = ?',
      [orderId]
    );

    if (selectResult.length > 0) {
      const order = selectResult[0];
      console.log('✅ Ordem encontrada:');
      console.log('   ID:', order.id);
      console.log('   Número:', order.order_number);
      console.log('   Observações salvas:', order.observations);
      console.log('   Tamanho das observações:', order.observations ? order.observations.length : 0);
      
      if (order.observations === testObservations) {
        console.log('✅ Observações salvas CORRETAMENTE!');
      } else {
        console.log('❌ Observações NÃO coincidem!');
        console.log('   Esperado:', testObservations);
        console.log('   Encontrado:', order.observations);
      }
    } else {
      console.log('❌ Ordem não encontrada após inserção!');
    }

    // Teste 4: Atualizar observações
    console.log('\n4. Testando atualização de observações...');
    
    const updatedObservations = 'Observações atualizadas via UPDATE - teste de edição.';
    
    await connection.execute(
      'UPDATE service_orders SET observations = ? WHERE id = ?',
      [updatedObservations, orderId]
    );

    console.log('✅ UPDATE executado');

    // Verificar atualização
    const [updatedResult] = await connection.execute(
      'SELECT observations FROM service_orders WHERE id = ?',
      [orderId]
    );

    if (updatedResult.length > 0) {
      const updatedOrder = updatedResult[0];
      console.log('✅ Observações após UPDATE:', updatedOrder.observations);
      
      if (updatedOrder.observations === updatedObservations) {
        console.log('✅ Atualização funcionou CORRETAMENTE!');
      } else {
        console.log('❌ Atualização NÃO funcionou!');
        console.log('   Esperado:', updatedObservations);
        console.log('   Encontrado:', updatedOrder.observations);
      }
    }

    // Teste 5: Verificar outras ordens com observações
    console.log('\n5. Verificando outras ordens com observações...');
    
    const [allWithObservations] = await connection.execute(`
      SELECT id, order_number, observations 
      FROM service_orders 
      WHERE observations IS NOT NULL AND observations != ''
      ORDER BY id DESC
      LIMIT 5
    `);

    console.log(`✅ Encontradas ${allWithObservations.length} ordens com observações:`);
    allWithObservations.forEach(order => {
      console.log(`   OS ${order.order_number}: "${order.observations.substring(0, 50)}${order.observations.length > 50 ? '...' : ''}"`);
    });

    // Limpeza - remover ordem de teste
    await connection.execute('DELETE FROM service_orders WHERE id = ?', [orderId]);
    console.log('\n✅ Ordem de teste removida');

    await connection.end();
    console.log('\n🎉 Teste concluído!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testObservationsField();