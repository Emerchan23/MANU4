require('dotenv').config();
const { query } = require('./lib/database');

async function checkEquipmentTable() {
  try {
    console.log('🔍 Verificando tabela equipment...');
    
    // Verificar se a tabela existe
    const tables = await query('SHOW TABLES LIKE "equipment"');
    
    if (tables.length === 0) {
      console.log('❌ Tabela equipment não encontrada!');
      return;
    }
    
    // Obter estrutura da tabela
    const structure = await query('DESCRIBE equipment');
    
    console.log('\n📋 Estrutura da tabela equipment:');
    structure.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
    // Verificar algumas linhas de exemplo
    const sampleData = await query('SELECT * FROM equipment LIMIT 3');
    
    console.log('\n📊 Dados de exemplo na tabela equipment:');
    console.log(`  Total de registros: ${sampleData.length}`);
    
    if (sampleData.length > 0) {
      console.log('\n  Primeiros registros:');
      sampleData.forEach((row, index) => {
        console.log(`    ${index + 1}: ID=${row.id}, Name=${row.name}`);
      });
    }
    
    console.log('\n✅ Verificação da tabela equipment concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabela equipment:', error.message);
    console.error('Detalhes do erro:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
  } finally {
    process.exit(0);
  }
}

checkEquipmentTable();