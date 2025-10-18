const { query } = require('./lib/database.js');

async function checkDateFields() {
  try {
    console.log('🔍 VERIFICANDO CAMPOS DE DATA NA TABELA preventive_maintenances');
    console.log('='.repeat(60));
    
    const structure = await query('DESCRIBE preventive_maintenances');
    console.log('📋 CAMPOS DE DATA ENCONTRADOS:');
    structure.forEach(col => {
      if (col.Type.includes('date') || col.Type.includes('time')) {
        console.log(`   - ${col.Field} (${col.Type})`);
      }
    });
    
    console.log('\n📋 TODOS OS CAMPOS DA TABELA:');
    structure.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Verificar alguns registros com campos de data
    console.log('\n📅 DADOS DE EXEMPLO COM CAMPOS DE DATA:');
    const sampleData = await query('SELECT * FROM preventive_maintenances LIMIT 3');
    sampleData.forEach((row, index) => {
      console.log(`\n   Registro ${index + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        if (key.includes('date') || key.includes('time') || key.includes('at')) {
          console.log(`     ${key}: ${value}`);
        }
      });
    });
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
  }
  process.exit(0);
}

checkDateFields();