const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function debugApiResponse() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');
    
    // 1. Verificar uma ordem específica (ID 50 que sabemos que existe)
    console.log('\n🔍 1. Verificando dados da ordem ID 50...');
    const [orders] = await connection.execute(`
      SELECT 
        so.*,
        e.name as equipment_name,
        e.model as equipment_model,
        e.serial_number as equipment_serial,
        c.name as company_name,
        c.phone as company_phone,
        mt.id as maintenance_type_id_from_join,
        mt.name as maintenance_type_name,
        u1.name as created_by_name,
        u2.name as assigned_to_name
      FROM service_orders so
      LEFT JOIN equipment e ON so.equipment_id = e.id
      LEFT JOIN companies c ON so.company_id = c.id
      LEFT JOIN maintenance_types mt ON so.maintenance_type_id = mt.id
      LEFT JOIN users u1 ON so.created_by = u1.id
      LEFT JOIN users u2 ON so.assigned_to = u2.id
      WHERE so.id = 50
    `);

    if (orders.length === 0) {
      console.log('❌ Ordem ID 50 não encontrada');
      return;
    }

    const order = orders[0];
    console.log('📋 Dados da ordem encontrada:');
    console.log(`   ID: ${order.id}`);
    console.log(`   Número: ${order.order_number}`);
    console.log(`   Equipment ID: ${order.equipment_id}`);
    console.log(`   Company ID: ${order.company_id}`);
    console.log(`   Maintenance Type ID: ${order.maintenance_type_id} (tipo: ${typeof order.maintenance_type_id})`);
    console.log(`   Maintenance Type ID do JOIN: ${order.maintenance_type_id_from_join}`);
    console.log(`   Maintenance Type Name: ${order.maintenance_type_name}`);
    console.log(`   Scheduled Date: ${order.scheduled_date} (tipo: ${typeof order.scheduled_date})`);
    console.log(`   Completion Date: ${order.completion_date} (tipo: ${typeof order.completion_date})`);
    console.log(`   Priority: ${order.priority}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Cost: ${order.cost} (tipo: ${typeof order.cost})`);
    console.log(`   Assigned To: ${order.assigned_to}`);

    // 2. Verificar se maintenance_types está carregando
    console.log('\n🔍 2. Verificando tipos de manutenção disponíveis...');
    const [maintenanceTypes] = await connection.execute(`
      SELECT * FROM maintenance_types WHERE isActive = 1 ORDER BY name
    `);
    
    console.log(`📋 ${maintenanceTypes.length} tipos de manutenção ativos encontrados:`);
    maintenanceTypes.forEach(type => {
      console.log(`   - ID: ${type.id}, Nome: ${type.name}, Ativo: ${type.isActive}`);
    });

    // 3. Simular resposta da API como seria enviada para o frontend
    console.log('\n🔍 3. Simulando resposta da API /api/service-orders...');
    const apiResponse = {
      success: true,
      data: [order],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 1
      }
    };

    console.log('📤 Resposta simulada da API:');
    console.log(JSON.stringify(apiResponse, null, 2));

    // 4. Verificar campos específicos que estão problemáticos
    console.log('\n🔍 4. Análise dos campos problemáticos:');
    console.log('MAINTENANCE_TYPE_ID:');
    console.log(`   - Valor: ${order.maintenance_type_id}`);
    console.log(`   - Tipo: ${typeof order.maintenance_type_id}`);
    console.log(`   - É null?: ${order.maintenance_type_id === null}`);
    console.log(`   - É undefined?: ${order.maintenance_type_id === undefined}`);
    console.log(`   - É string vazia?: ${order.maintenance_type_id === ''}`);
    
    console.log('SCHEDULED_DATE:');
    console.log(`   - Valor: ${order.scheduled_date}`);
    console.log(`   - Tipo: ${typeof order.scheduled_date}`);
    console.log(`   - É null?: ${order.scheduled_date === null}`);
    console.log(`   - É undefined?: ${order.scheduled_date === undefined}`);
    console.log(`   - É string vazia?: ${order.scheduled_date === ''}`);
    
    console.log('COMPLETION_DATE:');
    console.log(`   - Valor: ${order.completion_date}`);
    console.log(`   - Tipo: ${typeof order.completion_date}`);
    console.log(`   - É null?: ${order.completion_date === null}`);
    console.log(`   - É undefined?: ${order.completion_date === undefined}`);
    console.log(`   - É string vazia?: ${order.completion_date === ''}`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão encerrada');
    }
  }
}

debugApiResponse();