const mysql = require('mysql2/promise');

async function checkMaintenanceSchedulesStructure() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco de dados');
    
    // Verificar estrutura atual da tabela maintenance_schedules
    console.log('\n📋 Estrutura atual da tabela maintenance_schedules:');
    const [columns] = await connection.execute('DESCRIBE maintenance_schedules');
    
    console.log('Campos existentes:');
    columns.forEach(col => {
      console.log(`  ${col.Field.padEnd(25)} | ${col.Type.padEnd(30)} | ${col.Null.padEnd(5)} | ${col.Key.padEnd(5)} | ${col.Default || 'NULL'}`);
    });
    
    // Verificar se os campos de duração de recorrência existem
    const hasRecurrenceEndDate = columns.some(col => col.Field === 'recurrence_end_date');
    const hasRecurrenceDurationType = columns.some(col => col.Field === 'recurrence_duration_type');
    const hasRecurrenceDurationValue = columns.some(col => col.Field === 'recurrence_duration_value');
    
    console.log('\n🔍 Verificando campos de duração de recorrência:');
    console.log(`  recurrence_end_date: ${hasRecurrenceEndDate ? '✅ Existe' : '❌ Não existe'}`);
    console.log(`  recurrence_duration_type: ${hasRecurrenceDurationType ? '✅ Existe' : '❌ Não existe'}`);
    console.log(`  recurrence_duration_value: ${hasRecurrenceDurationValue ? '✅ Existe' : '❌ Não existe'}`);
    
    if (!hasRecurrenceEndDate || !hasRecurrenceDurationType || !hasRecurrenceDurationValue) {
      console.log('\n⚠️ Campos de duração de recorrência não encontrados!');
      console.log('📝 Será necessário adicionar os seguintes campos:');
      
      if (!hasRecurrenceEndDate) {
        console.log('  - recurrence_end_date DATE NULL');
      }
      if (!hasRecurrenceDurationType) {
        console.log('  - recurrence_duration_type ENUM("indefinite", "months", "weeks", "occurrences", "end_date") DEFAULT "indefinite"');
      }
      if (!hasRecurrenceDurationValue) {
        console.log('  - recurrence_duration_value INT DEFAULT 1');
      }
    } else {
      console.log('\n✅ Todos os campos de duração de recorrência já existem!');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkMaintenanceSchedulesStructure();