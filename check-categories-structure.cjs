const mysql = require('mysql2/promise');

const config = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function checkCategoriesStructure() {
  try {
    const connection = await mysql.createConnection(config);
    console.log('🔍 Verificando estrutura da tabela categories...');
    
    const [columns] = await connection.execute('DESCRIBE categories');
    console.log('\nColunas da tabela categories:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? 'KEY: ' + col.Key : ''}`);
    });
    
    // Verificar se o campo is_electrical existe
    const hasElectricalField = columns.some(col => col.Field === 'is_electrical');
    console.log(`\n📋 Campo 'is_electrical' existe: ${hasElectricalField ? '✅ SIM' : '❌ NÃO'}`);
    
    if (!hasElectricalField) {
      console.log('\n🔧 Adicionando campo is_electrical à tabela categories...');
      await connection.execute('ALTER TABLE categories ADD COLUMN is_electrical TINYINT(1) DEFAULT 0');
      console.log('✅ Campo is_electrical adicionado com sucesso!');
      
      // Verificar novamente
      const [newColumns] = await connection.execute('DESCRIBE categories');
      console.log('\nNova estrutura da tabela categories:');
      newColumns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? 'KEY: ' + col.Key : ''}`);
      });
    }
    
    // Verificar dados existentes
    const [categories] = await connection.execute('SELECT id, name, is_electrical FROM categories LIMIT 5');
    console.log('\n📊 Dados das categorias (primeiras 5):');
    categories.forEach(cat => {
      console.log(`  - ID: ${cat.id}, Nome: ${cat.name}, Elétrica: ${cat.is_electrical ? 'SIM' : 'NÃO'}`);
    });
    
    await connection.end();
    console.log('\n✅ Verificação concluída!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkCategoriesStructure();