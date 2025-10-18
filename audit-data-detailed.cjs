const { query } = require('./lib/database.js');

async function auditPreventiveMaintenanceData() {
  try {
    console.log('🔍 AUDITORIA DETALHADA DOS DADOS DE MANUTENÇÃO PREVENTIVA');
    console.log('='.repeat(70));
    
    // 1. Verificar dados da tabela preventive_maintenances
    console.log('\n1️⃣ DADOS DA TABELA preventive_maintenances:');
    const maintenances = await query('SELECT * FROM preventive_maintenances LIMIT 5');
    console.log('📊 Primeiros 5 registros:');
    maintenances.forEach((row, index) => {
      console.log(`\n   Registro ${index + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        console.log(`     ${key}: ${value}`);
      });
    });
    
    // 2. Verificar campos de data na tabela preventive_maintenances
    console.log('\n2️⃣ ANÁLISE DE CAMPOS DE DATA - preventive_maintenances:');
    const dateFields = await query(`
      SELECT 
        id,
        scheduled_date,
        completed_date,
        created_at,
        updated_at
      FROM preventive_maintenances 
      WHERE scheduled_date IS NOT NULL OR completed_date IS NOT NULL
      LIMIT 5
    `);
    
    console.log('📅 Campos de data encontrados:');
    dateFields.forEach((row, index) => {
      console.log(`\n   Registro ${index + 1} (ID: ${row.id}):`);
      console.log(`     scheduled_date: ${row.scheduled_date}`);
      console.log(`     completed_date: ${row.completed_date}`);
      console.log(`     created_at: ${row.created_at}`);
      console.log(`     updated_at: ${row.updated_at}`);
    });
    
    // 3. Verificar dados da tabela preventive_maintenance_plans
    console.log('\n3️⃣ DADOS DA TABELA preventive_maintenance_plans:');
    const plans = await query('SELECT * FROM preventive_maintenance_plans');
    console.log('📊 Todos os planos:');
    plans.forEach((row, index) => {
      console.log(`\n   Plano ${index + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        console.log(`     ${key}: ${value}`);
      });
    });
    
    // 4. Verificar status únicos
    console.log('\n4️⃣ STATUS ÚNICOS ENCONTRADOS:');
    const statuses = await query('SELECT DISTINCT status FROM preventive_maintenances');
    console.log('📋 Status disponíveis:', statuses.map(s => s.status));
    
    // 5. Verificar prioridades únicas
    console.log('\n5️⃣ PRIORIDADES ÚNICAS ENCONTRADAS:');
    const priorities = await query('SELECT DISTINCT priority FROM preventive_maintenances');
    console.log('📋 Prioridades disponíveis:', priorities.map(p => p.priority));
    
    // 6. Verificar equipamentos únicos
    console.log('\n6️⃣ EQUIPAMENTOS ÚNICOS ENCONTRADOS:');
    const equipments = await query('SELECT DISTINCT equipment_name FROM preventive_maintenances LIMIT 10');
    console.log('📋 Equipamentos (primeiros 10):', equipments.map(e => e.equipment_name));
    
    // 7. Verificar setores únicos
    console.log('\n7️⃣ SETORES ÚNICOS ENCONTRADOS:');
    const sectors = await query('SELECT DISTINCT sector FROM preventive_maintenances');
    console.log('📋 Setores disponíveis:', sectors.map(s => s.sector));
    
    // 8. Verificar campos nulos ou vazios
    console.log('\n8️⃣ VERIFICAÇÃO DE CAMPOS OBRIGATÓRIOS:');
    const nullChecks = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(equipment_name) as has_equipment,
        COUNT(sector) as has_sector,
        COUNT(scheduled_date) as has_scheduled_date,
        COUNT(status) as has_status,
        COUNT(priority) as has_priority
      FROM preventive_maintenances
    `);
    
    const check = nullChecks[0];
    console.log(`📊 Total de registros: ${check.total}`);
    console.log(`📊 Com equipment_name: ${check.has_equipment} (${check.has_equipment === check.total ? '✅' : '❌'})`);
    console.log(`📊 Com sector: ${check.has_sector} (${check.has_sector === check.total ? '✅' : '❌'})`);
    console.log(`📊 Com scheduled_date: ${check.has_scheduled_date} (${check.has_scheduled_date === check.total ? '✅' : '❌'})`);
    console.log(`📊 Com status: ${check.has_status} (${check.has_status === check.total ? '✅' : '❌'})`);
    console.log(`📊 Com priority: ${check.has_priority} (${check.has_priority === check.total ? '✅' : '❌'})`);
    
    console.log('\n✅ AUDITORIA DETALHADA CONCLUÍDA');
    
  } catch (error) {
    console.error('❌ ERRO NA AUDITORIA:', error.message);
  }
  process.exit(0);
}

auditPreventiveMaintenanceData();