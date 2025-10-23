const mysql = require('mysql2/promise');

async function createTestSchedules() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  try {
    console.log('🔄 Criando agendamentos de teste para os próximos 30 dias...');
    
    // Buscar IDs existentes
    const [equipmentRows] = await connection.execute('SELECT id FROM equipment LIMIT 1');
    const [companyRows] = await connection.execute('SELECT id FROM companies LIMIT 1');
    const [userRows] = await connection.execute('SELECT id FROM users LIMIT 1');
    
    if (!equipmentRows.length || !companyRows.length || !userRows.length) {
      console.log('❌ Dados necessários não encontrados');
      return;
    }
    
    const equipmentId = equipmentRows[0].id;
    const companyId = companyRows[0].id;
    const userId = userRows[0].id;
    
    const now = new Date();
    
    // Criar agendamentos para os próximos 30 dias
    const schedules = [
      // Próximos 7 dias
      {
        equipment_id: equipmentId,
        company_id: companyId,
        assigned_user_id: userId,
        maintenance_type: 'preventiva',
        scheduled_date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // +2 dias
        status: 'AGENDADA',
        priority: 'ALTA',
        description: 'Manutenção preventiva - próximos 7 dias',
        estimated_cost: 300.00
      },
      {
        equipment_id: equipmentId,
        company_id: companyId,
        assigned_user_id: userId,
        maintenance_type: 'corretiva',
        scheduled_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // +5 dias
        status: 'PENDENTE',
        priority: 'MEDIA',
        description: 'Manutenção corretiva - próximos 7 dias',
        estimated_cost: 450.00
      },
      // Próximos 15 dias
      {
        equipment_id: equipmentId,
        company_id: companyId,
        assigned_user_id: userId,
        maintenance_type: 'preventiva',
        scheduled_date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // +10 dias
        status: 'SCHEDULED',
        priority: 'BAIXA',
        description: 'Manutenção preventiva - próximos 15 dias',
        estimated_cost: 200.00
      },
      {
        equipment_id: equipmentId,
        company_id: companyId,
        assigned_user_id: userId,
        maintenance_type: 'calibracao',
        scheduled_date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // +14 dias
        status: 'AGENDADA',
        priority: 'ALTA',
        description: 'Calibração de equipamento - próximos 15 dias',
        estimated_cost: 350.00
      },
      // Próximos 30 dias
      {
        equipment_id: equipmentId,
        company_id: companyId,
        assigned_user_id: userId,
        maintenance_type: 'preventiva',
        scheduled_date: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000), // +20 dias
        status: 'PENDING',
        priority: 'MEDIA',
        description: 'Manutenção preventiva - próximos 30 dias',
        estimated_cost: 280.00
      },
      {
        equipment_id: equipmentId,
        company_id: companyId,
        assigned_user_id: userId,
        maintenance_type: 'corretiva',
        scheduled_date: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000), // +25 dias
        status: 'AGENDADA',
        priority: 'ALTA',
        description: 'Manutenção corretiva - próximos 30 dias',
        estimated_cost: 500.00
      },
      {
        equipment_id: equipmentId,
        company_id: companyId,
        assigned_user_id: userId,
        maintenance_type: 'calibracao',
        scheduled_date: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000), // +28 dias
        status: 'SCHEDULED',
        priority: 'MEDIA',
        description: 'Calibração final - próximos 30 dias',
        estimated_cost: 400.00
      }
    ];

    for (const schedule of schedules) {
      try {
        await connection.execute(`
          INSERT INTO maintenance_schedules (
            equipment_id, company_id, assigned_user_id, maintenance_type,
            scheduled_date, status, priority, description,
            estimated_cost, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          schedule.equipment_id,
          schedule.company_id,
          schedule.assigned_user_id,
          schedule.maintenance_type,
          schedule.scheduled_date,
          schedule.status,
          schedule.priority,
          schedule.description,
          schedule.estimated_cost
        ]);
        
        console.log(`✅ Agendamento criado: ${schedule.description} - ${schedule.scheduled_date.toLocaleDateString('pt-BR')}`);
      } catch (error) {
        console.log(`⚠️ Erro ao criar agendamento: ${schedule.description} - ${error.message}`);
      }
    }
    
    // Verificar quantos foram criados
    const [countRows] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM maintenance_schedules 
      WHERE scheduled_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY)
      AND status IN ('AGENDADA', 'SCHEDULED', 'PENDENTE', 'PENDING')
    `);
    
    console.log(`\n📊 Total de agendamentos nos próximos 30 dias: ${countRows[0].count}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await connection.end();
  }
}

createTestSchedules();