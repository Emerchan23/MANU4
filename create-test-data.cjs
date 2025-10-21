const mysql = require('mysql2/promise');

async function createTestData() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('🔧 Criando dados de teste para company_id = 1...');
    
    // Criar alguns agendamentos de teste
    const testSchedules = [
      {
        equipment_id: 1,
        company_id: 1,
        scheduled_date: '2025-01-25',
        status: 'AGENDADA',
        maintenance_type: 'PREVENTIVA',
        description: 'Manutenção preventiva mensal',
        estimated_cost: 500.00,
        priority: 'MEDIA',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        equipment_id: 2,
        company_id: 1,
        scheduled_date: '2025-01-20',
        status: 'AGENDADA',
        maintenance_type: 'CORRETIVA',
        description: 'Reparo urgente - ATRASADO',
        estimated_cost: 800.00,
        priority: 'ALTA',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        equipment_id: 3,
        company_id: 1,
        scheduled_date: '2025-01-15',
        status: 'CONCLUIDA',
        maintenance_type: 'PREVENTIVA',
        description: 'Manutenção concluída',
        estimated_cost: 300.00,
        priority: 'MEDIA',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        equipment_id: 4,
        company_id: 1,
        scheduled_date: '2025-01-10',
        status: 'CONCLUIDA',
        maintenance_type: 'CORRETIVA',
        description: 'Reparo concluído',
        estimated_cost: 600.00,
        priority: 'ALTA',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    for (const schedule of testSchedules) {
      await connection.execute(`
        INSERT INTO maintenance_schedules 
        (equipment_id, company_id, scheduled_date, status, maintenance_type, description, estimated_cost, priority, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        schedule.equipment_id,
        schedule.company_id,
        schedule.scheduled_date,
        schedule.status,
        schedule.maintenance_type,
        schedule.description,
        schedule.estimated_cost,
        schedule.priority,
        schedule.created_at,
        schedule.updated_at
      ]);
    }

    console.log('✅ Dados de teste criados com sucesso!');
    
    // Criar algumas ordens de serviço de teste
    console.log('📝 Criando ordens de serviço de teste...');
    
    const serviceOrders = [
      {
        order_number: 'OS-TEST-002',
        equipment_id: 1,
        company_id: 1,
        maintenance_type_id: 1,
        description: 'Manutenção preventiva mensal - Verificação geral do equipamento',
        priority: 'MEDIA',
        status: 'CONCLUIDA',
        scheduled_date: '2024-01-15',
        completion_date: '2024-01-15',
        estimated_cost: 150.00,
        cost: 145.50,
        created_by: 1,
        assigned_to: 1,
        type: 'PREVENTIVA'
      },
      {
        order_number: 'OS-TEST-003',
        equipment_id: 2,
        company_id: 1,
        maintenance_type_id: 2,
        description: 'Correção de falha no sistema de refrigeração',
        priority: 'ALTA',
        status: 'CONCLUIDA',
        scheduled_date: '2024-02-10',
        completion_date: '2024-02-12',
        estimated_cost: 300.00,
        cost: 285.00,
        created_by: 1,
        assigned_to: 1,
        type: 'CORRETIVA'
      },
      {
        order_number: 'OS-TEST-004',
        equipment_id: 3,
        company_id: 1,
        maintenance_type_id: 1,
        description: 'Limpeza e calibração dos sensores',
        priority: 'MEDIA',
        status: 'CONCLUIDA',
        scheduled_date: '2024-03-20',
        completion_date: '2024-03-20',
        estimated_cost: 200.00,
        cost: 195.75,
        created_by: 1,
        assigned_to: 1,
        type: 'PREVENTIVA'
      }
    ];

    for (const order of serviceOrders) {
      const [result] = await connection.execute(`
        INSERT INTO service_orders (
          order_number, equipment_id, company_id, maintenance_type_id, description,
          priority, status, scheduled_date, completion_date, estimated_cost, cost,
          created_by, assigned_to, type, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        order.order_number, order.equipment_id, order.company_id, order.maintenance_type_id,
        order.description, order.priority, order.status, order.scheduled_date, 
        order.completion_date, order.estimated_cost, order.cost, order.created_by, 
        order.assigned_to, order.type
      ]);
      
      console.log(`✅ Ordem de serviço criada com ID: ${result.insertId}`);
    }
    
    // Verificar os dados criados
    const [rows] = await connection.execute('SELECT COUNT(*) as total FROM maintenance_schedules WHERE company_id = ?', [1]);
    console.log('📊 Total de registros para company_id = 1:', rows[0].total);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

createTestData();