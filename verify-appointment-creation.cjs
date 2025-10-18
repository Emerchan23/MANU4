const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function verifyAppointmentCreation() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao MariaDB para verificar agendamento...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');
    
    // Verificar agendamentos na tabela maintenance_schedules
    console.log('\n📋 Verificando agendamentos criados...');
    
    const [schedules] = await connection.execute(`
      SELECT 
        ms.*,
        e.name as equipment_name,
        emp.name as company_name
      FROM maintenance_schedules ms
      LEFT JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN empresas emp ON e.id = emp.id
      ORDER BY ms.created_at DESC
      LIMIT 10
    `);
    
    if (schedules.length > 0) {
      console.log(`\n✅ Encontrados ${schedules.length} agendamentos:`);
      
      schedules.forEach((schedule, index) => {
        console.log(`\n${index + 1}. Agendamento ID: ${schedule.id}`);
        console.log(`   📅 Data: ${schedule.scheduled_date}`);
        console.log(`   🔧 Equipamento: ${schedule.equipment_name || 'N/A'}`);
        console.log(`   🏢 Empresa: ${schedule.company_name || 'N/A'}`);
        console.log(`   📝 Descrição: ${schedule.description || 'N/A'}`);
        console.log(`   ⚡ Prioridade: ${schedule.priority || 'N/A'}`);
        console.log(`   💰 Custo: R$ ${schedule.estimated_cost || '0.00'}`);
        console.log(`   📊 Status: ${schedule.status || 'N/A'}`);
        console.log(`   🕐 Criado em: ${schedule.created_at}`);
      });
      
      // Verificar se existe um agendamento recente (últimos 5 minutos)
      const [recentSchedules] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM maintenance_schedules 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
      `);
      
      if (recentSchedules[0].count > 0) {
        console.log(`\n🎉 SUCESSO! Encontrado(s) ${recentSchedules[0].count} agendamento(s) criado(s) nos últimos 5 minutos!`);
        return true;
      } else {
        console.log('\n⚠️  Nenhum agendamento recente encontrado (últimos 5 minutos)');
        return false;
      }
      
    } else {
      console.log('\n❌ Nenhum agendamento encontrado na tabela maintenance_schedules');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar agendamentos:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar verificação
verifyAppointmentCreation()
  .then((success) => {
    if (success) {
      console.log('\n✅ Verificação concluída - Agendamento criado com sucesso!');
      process.exit(0);
    } else {
      console.log('\n❌ Verificação concluída - Agendamento não foi criado');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Erro na verificação:', error);
    process.exit(1);
  });