import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Carregar variáveis de ambiente
dotenv.config();

async function testDirectDBInsert() {
  console.log('🧪 Testando inserção direta no banco MariaDB...');
  
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
    
    // Buscar um equipamento existente
    console.log('\n🔍 Buscando equipamento existente...');
    const [equipmentResult] = await connection.execute('SELECT id FROM equipment LIMIT 1');
    
    if (equipmentResult.length === 0) {
      throw new Error('Nenhum equipamento encontrado no banco');
    }
    
    const equipmentId = equipmentResult[0].id;
    console.log(`✅ Equipamento encontrado: ID ${equipmentId}`);
    
    // Buscar uma empresa existente
    console.log('\n🔍 Buscando empresa existente...');
    const [companyResult] = await connection.execute('SELECT id FROM companies LIMIT 1');
    
    if (companyResult.length === 0) {
      throw new Error('Nenhuma empresa encontrada no banco');
    }
    
    const companyId = companyResult[0].id;
    console.log(`✅ Empresa encontrada: ID ${companyId}`);
    
    // Gerar número da ordem
    const orderNumber = `TEST-${Date.now()}`;
    
    // Dados de teste
    const testData = {
      order_number: orderNumber,
      equipment_id: equipmentId,
      company_id: companyId,
      description: 'Teste de inserção direta - Manutenção preventiva',
      priority: 'media',
      status: 'aberta',
      requested_date: new Date().toISOString().split('T')[0],
      scheduled_date: null,
      cost: 150.75,
      observations: 'Observações de teste - Campo funcionando corretamente',
      created_by: 1,
      assigned_to: null,
      type: 'preventiva'
    };
    
    console.log('\n📝 Dados para inserção:');
    console.log('   Order Number:', testData.order_number);
    console.log('   Equipment ID:', testData.equipment_id);
    console.log('   Company ID:', testData.company_id);
    console.log('   Description:', testData.description);
    console.log('   Cost:', testData.cost);
    console.log('   Observations:', testData.observations);
    
    // Inserção direta no banco
    console.log('\n💾 Executando inserção direta...');
    const [insertResult] = await connection.execute(
      `INSERT INTO service_orders (
        order_number, equipment_id, company_id, description, priority, status,
        requested_date, scheduled_date, cost, observations, created_by, assigned_to, type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        testData.order_number,
        testData.equipment_id,
        testData.company_id,
        testData.description,
        testData.priority,
        testData.status,
        testData.requested_date,
        testData.scheduled_date,
        testData.cost,
        testData.observations,
        testData.created_by,
        testData.assigned_to,
        testData.type
      ]
    );
    
    console.log('✅ Inserção realizada com sucesso!');
    console.log(`   ID da nova ordem: ${insertResult.insertId}`);
    
    // Verificar se os dados foram salvos corretamente
    console.log('\n🔍 Verificando dados salvos...');
    const [verifyResult] = await connection.execute(
      'SELECT * FROM service_orders WHERE id = ?',
      [insertResult.insertId]
    );
    
    if (verifyResult.length > 0) {
      const savedOrder = verifyResult[0];
      console.log('✅ Dados verificados no banco:');
      console.log(`   ID: ${savedOrder.id}`);
      console.log(`   Order Number: ${savedOrder.order_number}`);
      console.log(`   Cost: ${savedOrder.cost}`);
      console.log(`   Observations: ${savedOrder.observations}`);
      console.log(`   Description: ${savedOrder.description}`);
      console.log(`   Status: ${savedOrder.status}`);
      console.log(`   Priority: ${savedOrder.priority}`);
      
      // Verificar especificamente os campos problemáticos
      if (savedOrder.cost !== null && savedOrder.cost == testData.cost) {
        console.log('✅ Campo COST salvo corretamente!');
      } else {
        console.log('❌ Campo COST não foi salvo corretamente!');
        console.log(`   Esperado: ${testData.cost}, Salvo: ${savedOrder.cost}`);
      }
      
      if (savedOrder.observations !== null && savedOrder.observations === testData.observations) {
        console.log('✅ Campo OBSERVATIONS salvo corretamente!');
      } else {
        console.log('❌ Campo OBSERVATIONS não foi salvo corretamente!');
        console.log(`   Esperado: ${testData.observations}, Salvo: ${savedOrder.observations}`);
      }
    } else {
      console.log('❌ Erro: Registro não encontrado após inserção!');
    }
    
    // Limpar dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    await connection.execute('DELETE FROM service_orders WHERE id = ?', [insertResult.insertId]);
    console.log('✅ Dados de teste removidos');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Código do erro:', error.code);
    if (error.sql) {
      console.error('SQL:', error.sql);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada');
    }
  }
}

testDirectDBInsert();