const mysql = require('mysql2/promise');

async function checkEquipmentTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  try {
    console.log('🔍 Verificando estrutura da tabela equipment...\n');

    // Verificar estrutura da tabela equipment
    const [columns] = await connection.execute('DESCRIBE equipment');
    
    console.log('📋 Colunas da tabela equipment:');
    columns.forEach(col => {
      console.log(`- ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Verificar se existe a coluna patrimonio_number
    const patrimonioColumn = columns.find(col => col.Field.includes('patrimonio'));
    if (patrimonioColumn) {
      console.log(`\n✅ Coluna patrimonio encontrada: ${patrimonioColumn.Field}`);
    } else {
      console.log('\n❌ Nenhuma coluna patrimonio encontrada');
    }

    // Testar query corrigida
    console.log('\n🔍 Testando query corrigida...');
    const correctedQuery = `
      SELECT 
        ms.*,
        e.name as equipment_name,
        e.model as equipment_model,
        e.serial_number as equipment_serial,
        e.patrimonio_number as equipment_patrimonio_number,
        u.full_name as assigned_user_name,
        u.email as assigned_user_email,
        creator.full_name as created_by_name,
        c.name as company_name,
        mp.name as maintenance_plan_name
      FROM maintenance_schedules ms
      LEFT JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN users u ON ms.assigned_user_id = u.id
      LEFT JOIN users creator ON ms.created_by = creator.id
      LEFT JOIN companies c ON ms.company_id = c.id
      LEFT JOIN maintenance_plans mp ON ms.maintenance_plan_id = mp.id
      WHERE ms.id = 53
      LIMIT 1
    `;

    const [rows] = await connection.execute(correctedQuery);
    
    if (rows.length > 0) {
      const schedule = rows[0];
      console.log('✅ Query corrigida executada com sucesso!');
      console.log('\n🔍 Verificando maintenance_plan_name:');
      console.log('- maintenance_plan_id:', schedule.maintenance_plan_id);
      console.log('- maintenance_plan_name:', schedule.maintenance_plan_name);
      console.log('- Tipo:', typeof schedule.maintenance_plan_name);
      
      if (schedule.maintenance_plan_name) {
        console.log('✅ maintenance_plan_name está sendo retornado corretamente!');
      } else {
        console.log('❌ maintenance_plan_name está null/undefined');
      }
    } else {
      console.log('❌ Nenhum resultado encontrado');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

checkEquipmentTable();