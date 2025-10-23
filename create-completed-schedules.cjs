const mysql = require('mysql2/promise');

async function createCompletedSchedules() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  try {
    console.log('=== CRIANDO AGENDAMENTOS CONCLUÍDOS ===');
    
    // Primeiro, vamos verificar se já existem agendamentos
    const [existingSchedules] = await connection.execute(
      'SELECT COUNT(*) as count FROM maintenance_schedules'
    );
    
    console.log(`Agendamentos existentes: ${existingSchedules[0].count}`);
    
    // Criar alguns agendamentos concluídos
    const completedSchedules = [
      {
        equipment_id: 1,
        company_id: 1,
        assigned_user_id: 1,
        scheduled_date: '2025-12-01',
        status: 'CONCLUIDA',
        maintenance_type: 'preventiva',
        description: 'Manutenção preventiva concluída - Equipamento 1',
        priority: 'media',
        estimated_cost: 150.00
      },
      {
        equipment_id: 2,
        company_id: 1,
        assigned_user_id: 1,
        scheduled_date: '2025-12-05',
        status: 'COMPLETED',
        maintenance_type: 'corretiva',
        description: 'Manutenção corretiva concluída - Equipamento 2',
        priority: 'alta',
        estimated_cost: 250.00
      },
      {
        equipment_id: 3,
        company_id: 1,
        assigned_user_id: 1,
        scheduled_date: '2025-11-28',
        status: 'CONCLUIDA',
        maintenance_type: 'preventiva',
        description: 'Manutenção preventiva concluída - Equipamento 3',
        priority: 'baixa',
        estimated_cost: 100.00
      }
    ];
    
    for (const schedule of completedSchedules) {
      try {
        const [result] = await connection.execute(`
          INSERT INTO maintenance_schedules (
            equipment_id, company_id, assigned_user_id, scheduled_date,
            status, maintenance_type, description, priority, estimated_cost,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          schedule.equipment_id,
          schedule.company_id,
          schedule.assigned_user_id,
          schedule.scheduled_date,
          schedule.status,
          schedule.maintenance_type,
          schedule.description,
          schedule.priority,
          schedule.estimated_cost
        ]);
        
        console.log(`✅ Agendamento concluído criado: ${schedule.description} (ID: ${result.insertId})`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠️ Agendamento já existe: ${schedule.description}`);
        } else {
          console.error(`❌ Erro ao criar agendamento: ${schedule.description}`, error.message);
        }
      }
    }
    
    console.log('\n=== VERIFICANDO AGENDAMENTOS CONCLUÍDOS ===');
    
    // Verificar agendamentos concluídos
    const [completedResults] = await connection.execute(`
      SELECT 
        id, status, description, scheduled_date, equipment_id
      FROM maintenance_schedules 
      WHERE status IN ('CONCLUIDA', 'COMPLETED')
      ORDER BY id
    `);
    
    console.log(`Total de agendamentos concluídos: ${completedResults.length}`);
    completedResults.forEach(row => {
      console.log(`- ID ${row.id}: ${row.status} - ${row.description} (${row.scheduled_date})`);
    });
    
    console.log('\n=== TESTANDO CONSULTA DA API ===');
    
    // Testar a consulta que a API usa
    const [apiResults] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM maintenance_schedules ms 
      WHERE ms.status IN ('CONCLUIDA', 'COMPLETED')
    `);
    
    console.log(`Resultado da consulta da API: ${apiResults[0].count} agendamentos concluídos`);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await connection.end();
  }
}

createCompletedSchedules();