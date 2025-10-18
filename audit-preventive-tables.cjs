const { query } = require('./lib/database.js');

async function checkPreventiveMaintenanceTables() {
  try {
    console.log('🔍 AUDITORIA DAS TABELAS DE MANUTENÇÃO PREVENTIVA');
    console.log('='.repeat(60));
    
    // 1. Verificar tabelas existentes
    console.log('\n1️⃣ VERIFICANDO TABELAS EXISTENTES:');
    const tables = await query("SHOW TABLES LIKE '%preventive%'");
    console.log('📊 Tabelas encontradas:', tables.map(t => Object.values(t)[0]));
    
    // 2. Verificar estrutura da tabela preventive_maintenances
    console.log('\n2️⃣ ESTRUTURA DA TABELA preventive_maintenances:');
    try {
      const structure = await query('DESCRIBE preventive_maintenances');
      console.log('📋 Campos encontrados:');
      structure.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? '[' + col.Key + ']' : ''}`);
      });
    } catch (err) {
      console.log('❌ Tabela preventive_maintenances não existe!');
    }
    
    // 3. Verificar estrutura da tabela preventive_maintenance_plans
    console.log('\n3️⃣ ESTRUTURA DA TABELA preventive_maintenance_plans:');
    try {
      const structure2 = await query('DESCRIBE preventive_maintenance_plans');
      console.log('📋 Campos encontrados:');
      structure2.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? '[' + col.Key + ']' : ''}`);
      });
    } catch (err) {
      console.log('❌ Tabela preventive_maintenance_plans não existe!');
    }
    
    // 4. Verificar estrutura da tabela maintenance_tasks
    console.log('\n4️⃣ ESTRUTURA DA TABELA maintenance_tasks:');
    try {
      const structure3 = await query('DESCRIBE maintenance_tasks');
      console.log('📋 Campos encontrados:');
      structure3.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? '[' + col.Key + ']' : ''}`);
      });
    } catch (err) {
      console.log('❌ Tabela maintenance_tasks não existe!');
    }
    
    // 5. Contar registros
    console.log('\n5️⃣ CONTAGEM DE REGISTROS:');
    try {
      const count1 = await query('SELECT COUNT(*) as total FROM preventive_maintenances');
      console.log(`📊 preventive_maintenances: ${count1[0].total} registros`);
    } catch (err) {
      console.log('❌ Erro ao contar preventive_maintenances');
    }
    
    try {
      const count2 = await query('SELECT COUNT(*) as total FROM preventive_maintenance_plans');
      console.log(`📊 preventive_maintenance_plans: ${count2[0].total} registros`);
    } catch (err) {
      console.log('❌ Erro ao contar preventive_maintenance_plans');
    }
    
    try {
      const count3 = await query('SELECT COUNT(*) as total FROM maintenance_tasks');
      console.log(`📊 maintenance_tasks: ${count3[0].total} registros`);
    } catch (err) {
      console.log('❌ Erro ao contar maintenance_tasks');
    }
    
    console.log('\n✅ AUDITORIA CONCLUÍDA');
    
  } catch (error) {
    console.error('❌ ERRO NA AUDITORIA:', error.message);
  }
  process.exit(0);
}

checkPreventiveMaintenanceTables();