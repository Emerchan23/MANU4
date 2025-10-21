const mysql = require('mysql2/promise');
require('dotenv').config();

async function createSampleSchedules() {
  let connection;
  
  try {
    console.log('🔄 Conectando ao banco de dados...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'maintenance_system',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Conectado ao banco MariaDB');

    // Buscar dados existentes
    const [equipment] = await connection.execute('SELECT id FROM equipment LIMIT 1');
    const [users] = await connection.execute('SELECT id FROM users LIMIT 1');
    const [companies] = await connection.execute('SELECT id FROM companies LIMIT 1');
    
    if (equipment.length === 0 || users.length === 0 || companies.length === 0) {
      console.log('❌ Dados necessários não encontrados (equipment, users, companies)');
      return;
    }

    const equipmentId = equipment[0].id;
    const userId = users[0].id;
    const companyId = companies[0].id;

    console.log(`📊 Usando: Equipment ID: ${equipmentId}, User ID: ${userId}, Company ID: ${companyId}`);

    // Limpar agendamentos existentes para evitar duplicatas
    console.log('\n🧹 Limpando agendamentos existentes...');
    await connection.execute('DELETE FROM maintenance_schedules WHERE description LIKE "%Dashboard Test%"');

    // Criar agendamentos de exemplo
    const now = new Date();
    const schedules = [
      // Agendamentos pendentes (futuros)
      {
        equipment_id: equipmentId,
        company_id: companyId,
        assigned_to: userId,
        maintenance_type: 'PREVENTIVA',
        scheduled_date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +2 dias
        status: 'AGENDADA',
        priority: 'ALTA',
        description: 'Dashboard Test - Manutenção preventiva pendente 1',
        estimated_cost: 500.00,
        created_by: userId
      },
      {
        equipment_id: equipmentId,
        company_id: companyId,
        assigned_to: userId,
        maintenance_type: 'CORRETIVA',
        scheduled_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +5 dias
        status: 'AGENDADA',
        priority: 'MEDIA',
        description: 'Dashboard Test - Manutenção corretiva pendente 2',
        estimated_cost: 300.00,
        created_by: userId
      },
      // Agendamentos atrasados (passados com status AGENDADA)
      {
        equipment_id: equipmentId,
        company_id: companyId,
        assigned_to: userId,
        maintenance_type: 'PREVENTIVA',
        scheduled_date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // -3 dias
        status: 'AGENDADA',
        priority: 'ALTA',
        description: 'Dashboard Test - Manutenção atrasada 1',
        estimated_cost: 400.00,
        created_by: userId
      },
      {
        equipment_id: equipmentId,
        company_id: companyId,
        assigned_to: userId,
        maintenance_type: 'CORRETIVA',
        scheduled_date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // -1 dia
        status: 'AGENDADA',
        priority: 'CRITICA',
        description: 'Dashboard Test - Manutenção atrasada 2',
        estimated_cost: 600.00,
        created_by: userId
      },
      // Agendamentos concluídos este mês
      {
        equipment_id: equipmentId,
        company_id: companyId,
        assigned_to: userId,
        maintenance_type: 'PREVENTIVA',
        scheduled_date: new Date(now.getFullYear(), now.getMonth(), 5).toISOString().split('T')[0],
        status: 'CONCLUIDA',
        priority: 'MEDIA',
        description: 'Dashboard Test - Manutenção concluída 1',
        estimated_cost: 250.00,
        created_by: userId
      },
      {
        equipment_id: equipmentId,
        company_id: companyId,
        assigned_to: userId,
        maintenance_type: 'CORRETIVA',
        scheduled_date: new Date(now.getFullYear(), now.getMonth(), 10).toISOString().split('T')[0],
        status: 'CONCLUIDA',
        priority: 'BAIXA',
        description: 'Dashboard Test - Manutenção concluída 2',
        estimated_cost: 150.00,
        created_by: userId
      },
      // Agendamentos do mês passado para estatísticas
      {
        equipment_id: equipmentId,
        company_id: companyId,
        assigned_to: userId,
        maintenance_type: 'PREVENTIVA',
        scheduled_date: new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString().split('T')[0],
        status: 'CONCLUIDA',
        priority: 'MEDIA',
        description: 'Dashboard Test - Manutenção mês anterior',
        estimated_cost: 300.00,
        created_by: userId
      }
    ];

    console.log('\n📊 Criando agendamentos de exemplo...');
    
    for (const schedule of schedules) {
      try {
        await connection.execute(`
          INSERT INTO maintenance_schedules (
            equipment_id, company_id, assigned_to, maintenance_type,
            scheduled_date, status, priority, description,
            estimated_cost, created_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          schedule.equipment_id,
          schedule.company_id,
          schedule.assigned_to,
          schedule.maintenance_type,
          schedule.scheduled_date,
          schedule.status,
          schedule.priority,
          schedule.description,
          schedule.estimated_cost,
          schedule.created_by
        ]);
        
        console.log(`✅ Criado: ${schedule.description}`);
      } catch (error) {
        console.log(`❌ Erro ao criar: ${schedule.description} - ${error.message}`);
      }
    }

    // Verificar dados criados
    console.log('\n📊 Verificando dados criados...');
    
    const [pendingCount] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM maintenance_schedules 
      WHERE status = 'AGENDADA'
    `);
    
    const [overdueCount] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM maintenance_schedules 
      WHERE status = 'AGENDADA' AND DATE(scheduled_date) < CURDATE()
    `);
    
    const [completedCount] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM maintenance_schedules 
      WHERE status = 'CONCLUIDA' 
      AND MONTH(updated_at) = MONTH(NOW())
      AND YEAR(updated_at) = YEAR(NOW())
    `);

    console.log(`📈 Total agendamentos pendentes: ${pendingCount[0].count}`);
    console.log(`⏰ Total agendamentos atrasados: ${overdueCount[0].count}`);
    console.log(`✅ Total concluídos este mês: ${completedCount[0].count}`);

    // Verificar custos
    const [costData] = await connection.execute(`
      SELECT 
        SUM(estimated_cost) as total_estimated
      FROM maintenance_schedules 
      WHERE status = 'CONCLUIDA'
      AND MONTH(updated_at) = MONTH(NOW())
      AND YEAR(updated_at) = YEAR(NOW())
    `);

    const estimated = parseFloat(costData[0].total_estimated) || 0;

    console.log(`💰 Custo estimado total: R$ ${estimated.toFixed(2)}`);

    console.log('\n✅ Agendamentos de exemplo criados com sucesso!');
    console.log('🎯 A página de Agendamentos agora deve mostrar dados reais.');

  } catch (error) {
    console.error('❌ Erro ao criar agendamentos:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

createSampleSchedules();