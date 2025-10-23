import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function insertMaintenanceData() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao banco de dados...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance',
      port: process.env.DB_PORT || 3306
    });
    
    console.log('✅ Conectado ao banco de dados');
    
    // Verificar se o equipamento ID 14 existe
    console.log('\n🔍 Verificando equipamento ID 14...');
    const [equipment] = await connection.execute('SELECT id, name, code FROM equipment WHERE id = 14');
    
    if (equipment.length === 0) {
      console.log('❌ Equipamento ID 14 não encontrado. Listando equipamentos disponíveis:');
      const [allEquipment] = await connection.execute('SELECT id, name, code FROM equipment LIMIT 10');
      allEquipment.forEach(eq => {
        console.log(`  - ID: ${eq.id}, Nome: ${eq.name}, Código: ${eq.code}`);
      });
      return;
    }
    
    console.log(`✅ Equipamento encontrado: ${equipment[0].name} (${equipment[0].code})`);
    
    // Verificar se já existem ordens de serviço para este equipamento
    console.log('\n🔍 Verificando ordens de serviço existentes para equipamento ID 14...');
    const [existingOrders] = await connection.execute('SELECT COUNT(*) as count FROM service_orders WHERE equipment_id = 14');
    console.log(`📊 Ordens existentes: ${existingOrders[0].count}`);
    
    // Inserir dados reais de manutenção
    console.log('\n📝 Inserindo registros de manutenção...');
    
    const maintenanceRecords = [
      {
        order_number: 'OS-2024-001',
        equipment_id: 14,
        company_id: 1,
        maintenance_type_id: 1,
        description: 'Manutenção preventiva - Limpeza geral e calibração do equipamento',
        priority: 'MEDIA',
        status: 'CONCLUIDA',
        estimated_cost: 150.00,
        actual_cost: 145.50,
        cost: 145.50,
        scheduled_date: '2024-01-15',
        completion_date: '2024-01-15',
        requested_date: '2024-01-10',
        observations: 'Manutenção realizada conforme cronograma. Equipamento funcionando perfeitamente.',
        created_by: 1,
        assigned_to: 2,
        warranty_days: 90
      },
      {
        order_number: 'OS-2024-002',
        equipment_id: 14,
        company_id: 1,
        maintenance_type_id: 2,
        description: 'Troca de filtros e verificação do sistema elétrico',
        priority: 'ALTA',
        status: 'CONCLUIDA',
        estimated_cost: 200.00,
        actual_cost: 185.75,
        cost: 185.75,
        scheduled_date: '2024-02-20',
        completion_date: '2024-02-20',
        requested_date: '2024-02-15',
        observations: 'Substituídos filtros principais. Sistema elétrico verificado e aprovado.',
        created_by: 1,
        assigned_to: 3,
        warranty_days: 60
      },
      {
        order_number: 'OS-2024-003',
        equipment_id: 14,
        company_id: 1,
        maintenance_type_id: 3,
        description: 'Reparo no sistema de ventilação - Substituição de motor',
        priority: 'CRITICA',
        status: 'CONCLUIDA',
        estimated_cost: 350.00,
        actual_cost: 375.20,
        cost: 375.20,
        scheduled_date: '2024-03-10',
        completion_date: '2024-03-12',
        requested_date: '2024-03-08',
        observations: 'Motor do sistema de ventilação substituído. Teste de funcionamento aprovado.',
        created_by: 1,
        assigned_to: 2,
        warranty_days: 180
      },
      {
        order_number: 'OS-2024-004',
        equipment_id: 14,
        company_id: 1,
        maintenance_type_id: 2,
        description: 'Manutenção corretiva - Substituição de peças desgastadas',
        priority: 'ALTA',
        status: 'CONCLUIDA',
        estimated_cost: 450.00,
        actual_cost: 425.80,
        cost: 425.80,
        scheduled_date: '2024-04-05',
        completion_date: '2024-04-06',
        requested_date: '2024-04-01',
        observations: 'Peças desgastadas substituídas. Equipamento retornou ao funcionamento normal.',
        created_by: 1,
        assigned_to: 4,
        warranty_days: 120
      },
      {
        order_number: 'OS-2024-005',
        equipment_id: 14,
        company_id: 1,
        maintenance_type_id: 1,
        description: 'Inspeção geral e ajustes de precisão',
        priority: 'MEDIA',
        status: 'CONCLUIDA',
        estimated_cost: 100.00,
        actual_cost: 95.00,
        cost: 95.00,
        scheduled_date: '2024-05-12',
        completion_date: '2024-05-12',
        requested_date: '2024-05-08',
        observations: 'Inspeção completa realizada. Ajustes de precisão efetuados conforme especificação.',
        created_by: 1,
        assigned_to: 3,
        warranty_days: 90
      },
      {
        order_number: 'OS-2024-006',
        equipment_id: 14,
        company_id: 1,
        maintenance_type_id: 4,
        description: 'Calibração de precisão e certificação',
        priority: 'ALTA',
        status: 'CONCLUIDA',
        estimated_cost: 280.00,
        actual_cost: 275.50,
        cost: 275.50,
        scheduled_date: '2024-06-18',
        completion_date: '2024-06-18',
        requested_date: '2024-06-10',
        observations: 'Calibração realizada com sucesso. Certificado de calibração emitido.',
        created_by: 1,
        assigned_to: 2,
        warranty_days: 365
      }
    ];
    
    for (let i = 0; i < maintenanceRecords.length; i++) {
      const record = maintenanceRecords[i];
      
      try {
        await connection.execute(`
          INSERT INTO service_orders (
            order_number, equipment_id, company_id, maintenance_type_id, description,
            priority, status, estimated_cost, actual_cost, cost, scheduled_date,
            completion_date, requested_date, observations, created_by, assigned_to,
            warranty_days, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          record.order_number, record.equipment_id, record.company_id, record.maintenance_type_id,
          record.description, record.priority, record.status, record.estimated_cost,
          record.actual_cost, record.cost, record.scheduled_date, record.completion_date,
          record.requested_date, record.observations, record.created_by, record.assigned_to,
          record.warranty_days
        ]);
        
        console.log(`✅ Inserido: ${record.order_number} - ${record.description.substring(0, 50)}...`);
        
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️  Já existe: ${record.order_number}`);
        } else {
          console.error(`❌ Erro ao inserir ${record.order_number}:`, error.message);
        }
      }
    }
    
    // Verificar dados inseridos
    console.log('\n📊 Verificando dados inseridos...');
    const [insertedOrders] = await connection.execute(`
      SELECT order_number, description, cost, status, completion_date
      FROM service_orders 
      WHERE equipment_id = 14 
      ORDER BY completion_date DESC
    `);
    
    console.log(`\n✅ Total de ordens para equipamento ID 14: ${insertedOrders.length}`);
    insertedOrders.forEach(order => {
      console.log(`  - ${order.order_number}: R$ ${order.cost} (${order.status}) - ${order.completion_date}`);
    });
    
    // Calcular total
    const totalCost = insertedOrders.reduce((sum, order) => sum + parseFloat(order.cost || 0), 0);
    console.log(`\n💰 Valor total das manutenções: R$ ${totalCost.toFixed(2)}`);
    
    console.log('\n✅ Dados de manutenção inseridos com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

insertMaintenanceData();