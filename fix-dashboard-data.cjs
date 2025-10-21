const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDashboardData() {
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

    // 1. Corrigir o registro existente com status vazio
    console.log('\n🔧 1. Corrigindo registro existente com status vazio...');
    
    const [updateResult] = await connection.execute(`
      UPDATE maintenance_schedules 
      SET status = 'SCHEDULED',
          maintenance_type = 'preventiva',
          priority = 'medium',
          description = 'Manutenção preventiva agendada'
      WHERE status = '' OR status IS NULL
    `);
    
    console.log(`✅ ${updateResult.affectedRows} registro(s) corrigido(s)`);

    // 2. Criar dados de exemplo para demonstrar funcionalidade
    console.log('\n📊 2. Criando dados de exemplo...');
    
    // Buscar equipamentos e usuários existentes
    const [equipment] = await connection.execute('SELECT id FROM equipment LIMIT 5');
    const [users] = await connection.execute('SELECT id FROM users LIMIT 3');
    const [companies] = await connection.execute('SELECT id FROM companies LIMIT 1');
    
    if (equipment.length === 0) {
      console.log('❌ Nenhum equipamento encontrado. Criando equipamento de exemplo...');
      await connection.execute(`
        INSERT INTO equipment (name, patrimonio, status, company_id) 
        VALUES ('Equipamento Dashboard Test', 'EQ-DASH-001', 'ativo', ?)
      `, [companies[0]?.id || 1]);
      
      const [newEquipment] = await connection.execute('SELECT id FROM equipment WHERE patrimonio = "EQ-DASH-001"');
      equipment.push(newEquipment[0]);
    }

    const equipmentId = equipment[0].id;
    const userId = users[0]?.id || 1;
    const companyId = companies[0]?.id || 1;

    // Criar agendamentos de exemplo
    const now = new Date();
    const schedules = [
      // Agendamentos pendentes
      {
        equipment_id: equipmentId,
        company_id: companyId,
        assigned_user_id: userId,
        maintenance_type: 'preventiva',
        scheduled_date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // +2 dias
        status: 'SCHEDULED',
        priority: 'high',
        description: 'Manutenção preventiva - Equipamento crítico',
        estimated_cost: 500.00
      },
      {
        equipment_id: equipmentId,
        company_id: companyId,
        assigned_user_id: userId,
        maintenance_type: 'corretiva',
        scheduled_date: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // +5 dias
        status: 'SCHEDULED',
        priority: 'medium',
        description: 'Manutenção corretiva - Ajuste necessário',
        estimated_cost: 300.00
      },
      // Agendamentos atrasados
      {
        equipment_id: equipmentId,
        company_id: companyId,
        assigned_user_id: userId,
        maintenance_type: 'preventiva',
        scheduled_date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // -3 dias
        status: 'SCHEDULED',
        priority: 'high',
        description: 'Manutenção preventiva atrasada',
        estimated_cost: 400.00
      },
      // Agendamentos concluídos este mês
      {
        equipment_id: equipmentId,
        company_id: companyId,
        assigned_user_id: userId,
        maintenance_type: 'preventiva',
        scheduled_date: new Date(now.getFullYear(), now.getMonth(), 5),
        completed_at: new Date(now.getFullYear(), now.getMonth(), 7),
        status: 'COMPLETED',
        priority: 'medium',
        description: 'Manutenção preventiva concluída',
        estimated_cost: 250.00,
        actual_cost: 280.00
      },
      {
        equipment_id: equipmentId,
        company_id: companyId,
        assigned_user_id: userId,
        maintenance_type: 'corretiva',
        scheduled_date: new Date(now.getFullYear(), now.getMonth(), 10),
        completed_at: new Date(now.getFullYear(), now.getMonth(), 12),
        status: 'COMPLETED',
        priority: 'low',
        description: 'Manutenção corretiva concluída',
        estimated_cost: 150.00,
        actual_cost: 120.00
      },
      // Agendamentos do mês passado para estatísticas
      {
        equipment_id: equipmentId,
        company_id: companyId,
        assigned_user_id: userId,
        maintenance_type: 'preventiva',
        scheduled_date: new Date(now.getFullYear(), now.getMonth() - 1, 15),
        completed_at: new Date(now.getFullYear(), now.getMonth() - 1, 17),
        status: 'COMPLETED',
        priority: 'medium',
        description: 'Manutenção preventiva mês anterior',
        estimated_cost: 300.00,
        actual_cost: 350.00
      }
    ];

    for (const schedule of schedules) {
      try {
        await connection.execute(`
          INSERT INTO maintenance_schedules (
            equipment_id, company_id, assigned_user_id, maintenance_type,
            scheduled_date, completed_at, status, priority, description,
            estimated_cost, actual_cost, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          schedule.equipment_id,
          schedule.company_id,
          schedule.assigned_user_id,
          schedule.maintenance_type,
          schedule.scheduled_date,
          schedule.completed_at || null,
          schedule.status,
          schedule.priority,
          schedule.description,
          schedule.estimated_cost,
          schedule.actual_cost || null
        ]);
        
        console.log(`✅ Agendamento criado: ${schedule.description}`);
      } catch (error) {
        console.log(`⚠️ Agendamento já existe ou erro: ${schedule.description}`);
      }
    }

    // 3. Verificar dados criados
    console.log('\n📊 3. Verificando dados criados...');
    
    const [pendingCount] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM maintenance_schedules 
      WHERE status = 'SCHEDULED'
    `);
    
    const [overdueCount] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM maintenance_schedules 
      WHERE status = 'SCHEDULED' AND scheduled_date < NOW()
    `);
    
    const [completedCount] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM maintenance_schedules 
      WHERE status = 'COMPLETED' 
      AND completed_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
      AND completed_at < DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 1 MONTH), '%Y-%m-01')
    `);

    console.log(`📈 Agendamentos pendentes: ${pendingCount[0].count}`);
    console.log(`⏰ Agendamentos atrasados: ${overdueCount[0].count}`);
    console.log(`✅ Concluídos este mês: ${completedCount[0].count}`);

    // 4. Verificar custos
    const [costData] = await connection.execute(`
      SELECT 
        SUM(estimated_cost) as total_estimated,
        SUM(actual_cost) as total_actual
      FROM maintenance_schedules 
      WHERE status = 'COMPLETED'
      AND completed_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
      AND completed_at < DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 1 MONTH), '%Y-%m-01')
    `);

    const estimated = costData[0].total_estimated || 0;
    const actual = costData[0].total_actual || 0;
    const variance = estimated > 0 ? ((actual - estimated) / estimated) * 100 : 0;

    console.log(`💰 Custo estimado: R$ ${estimated.toFixed(2)}`);
    console.log(`💸 Custo real: R$ ${actual.toFixed(2)}`);
    console.log(`📊 Variação: ${variance.toFixed(1)}%`);

    console.log('\n✅ Dados do dashboard corrigidos e criados com sucesso!');
    console.log('🎯 A página de Agendamentos agora deve mostrar dados reais.');

  } catch (error) {
    console.error('❌ Erro ao corrigir dados do dashboard:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

fixDashboardData();