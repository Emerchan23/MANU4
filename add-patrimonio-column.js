import { query } from './lib/database.js';

async function addPatrimonioColumn() {
  try {
    console.log('🔧 Adicionando coluna patrimonio_number à tabela equipment...');
    
    // Adicionar a coluna se ela não existir
    await query(`
      ALTER TABLE equipment 
      ADD COLUMN IF NOT EXISTS patrimonio_number VARCHAR(100)
    `);
    
    console.log('✅ Coluna patrimonio_number adicionada com sucesso!');
    
    // Verificar se a coluna foi criada
    const columns = await query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'equipment' AND COLUMN_NAME = 'patrimonio_number'
    `);
    
    if (columns.length > 0) {
      console.log('📋 Coluna patrimonio_number encontrada:', columns[0]);
    } else {
      console.log('❌ Coluna patrimonio_number não foi encontrada');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna:', error);
    process.exit(1);
  }
}

addPatrimonioColumn();