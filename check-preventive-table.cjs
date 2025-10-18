const { query, queryDirect } = require('./lib/database.js');

console.log('🔍 DIAGNÓSTICO COMPLETO DA TABELA preventive_maintenances');
console.log('='.repeat(60));

(async () => {
  try {
    // 1. Verificar se a tabela existe
    console.log('1️⃣ Verificando se a tabela existe...');
    const tables = await queryDirect('SHOW TABLES', []);
    console.log('📊 Tabelas encontradas:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log('  - ' + tableName);
    });
    
    const hasTable = tables.some(table => Object.values(table)[0] === 'preventive_maintenances');
    console.log('📊 Tabela preventive_maintenances existe:', hasTable ? 'SIM' : 'NÃO');
    
    if (!hasTable) {
      console.log('❌ PROBLEMA: Tabela preventive_maintenances não existe!');
      console.log('🔧 Será necessário criar a tabela...');
      return;
    }
    
    // 2. Verificar estrutura da tabela
    console.log('');
    console.log('2️⃣ Estrutura da tabela:');
    const structure = await queryDirect('DESCRIBE preventive_maintenances', []);
    console.log('📊 Colunas encontradas:');
    structure.forEach(col => {
      console.log('  ✓ ' + col.Field + ' (' + col.Type + ') ' + (col.Null === 'YES' ? 'NULL' : 'NOT NULL') + ' ' + (col.Key ? '[' + col.Key + ']' : ''));
    });
    
    // 3. Verificar se coluna title existe
    console.log('');
    console.log('3️⃣ Verificando coluna title especificamente:');
    const hasTitle = structure.some(col => col.Field === 'title');
    console.log('📊 Coluna title existe:', hasTitle ? 'SIM' : 'NÃO');
    
    if (!hasTitle) {
      console.log('❌ PROBLEMA: Coluna title não existe!');
      console.log('🔧 Será necessário adicionar a coluna title...');
    }
    
    // 4. Contar registros
    console.log('');
    console.log('4️⃣ Contando registros existentes:');
    const count = await queryDirect('SELECT COUNT(*) as total FROM preventive_maintenances', []);
    console.log('📊 Total de registros:', count[0].total);
    
    // 5. Verificar se equipamento ID 1 existe
    console.log('');
    console.log('5️⃣ Verificando se equipamento ID 1 existe...');
    const equipment = await queryDirect('SELECT id, name FROM equipment WHERE id = ?', [1]);
    console.log('📊 Equipamento ID 1:', equipment.length > 0 ? equipment[0] : 'Não encontrado');
    
    console.log('');
    console.log('✅ DIAGNÓSTICO CONCLUÍDO');
    
  } catch (error) {
    console.error('❌ ERRO NO DIAGNÓSTICO:', error.message);
    console.error('❌ Stack:', error.stack);
  }
})();