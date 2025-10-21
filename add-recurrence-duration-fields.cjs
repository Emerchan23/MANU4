const mysql = require('mysql2/promise');

async function addRecurrenceDurationFields() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('✅ Conectado ao banco de dados');
    
    // Verificar se os campos já existem
    console.log('\n🔍 Verificando campos existentes...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'hospital_maintenance' 
      AND TABLE_NAME = 'maintenance_schedules'
      AND COLUMN_NAME IN ('recurrence_end_date', 'recurrence_duration_type', 'recurrence_duration_value')
    `);
    
    const existingFields = columns.map(col => col.COLUMN_NAME);
    console.log('Campos já existentes:', existingFields);
    
    // Adicionar campos que não existem
    const fieldsToAdd = [
      {
        name: 'recurrence_end_date',
        sql: 'ADD COLUMN recurrence_end_date DATE NULL COMMENT "Data final da recorrência"'
      },
      {
        name: 'recurrence_duration_type',
        sql: 'ADD COLUMN recurrence_duration_type ENUM("indefinite", "months", "weeks", "occurrences", "end_date") DEFAULT "indefinite" COMMENT "Tipo de duração da recorrência"'
      },
      {
        name: 'recurrence_duration_value',
        sql: 'ADD COLUMN recurrence_duration_value INT DEFAULT 1 COMMENT "Valor da duração da recorrência"'
      }
    ];
    
    for (const field of fieldsToAdd) {
      if (!existingFields.includes(field.name)) {
        console.log(`\n📝 Adicionando campo ${field.name}...`);
        try {
          await connection.execute(`ALTER TABLE maintenance_schedules ${field.sql}`);
          console.log(`✅ Campo ${field.name} adicionado com sucesso`);
        } catch (error) {
          console.error(`❌ Erro ao adicionar campo ${field.name}:`, error.message);
        }
      } else {
        console.log(`ℹ️ Campo ${field.name} já existe`);
      }
    }
    
    // Verificar estrutura final
    console.log('\n📋 Estrutura final da tabela maintenance_schedules:');
    const [finalColumns] = await connection.execute('DESCRIBE maintenance_schedules');
    
    const recurrenceFields = finalColumns.filter(col => 
      col.Field.includes('recurrence') || col.Field.includes('duration')
    );
    
    console.log('Campos de recorrência:');
    recurrenceFields.forEach(col => {
      console.log(`  ${col.Field.padEnd(30)} | ${col.Type.padEnd(40)} | ${col.Null.padEnd(5)} | ${col.Default || 'NULL'}`);
    });
    
    console.log('\n🎉 Processo concluído!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addRecurrenceDurationFields();