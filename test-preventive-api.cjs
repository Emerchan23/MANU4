const { query } = require('./lib/database.js');

async function testPreventiveAPI() {
  try {
    console.log('🔍 Testando conexão com banco de dados...');
    
    // Testar conexão
    const testResult = await query('SELECT 1 as test');
    console.log('✅ Conexão OK:', testResult);
    
    // Verificar tabela
    console.log('🔍 Verificando tabela preventive_maintenances...');
    const tableStructure = await query('DESCRIBE preventive_maintenances');
    console.log('✅ Tabela preventive_maintenances existe:');
    tableStructure.forEach(col => console.log('  -', col.Field, ':', col.Type));
    
    // Testar inserção simples
    console.log('🔍 Testando inserção simples...');
    const insertQuery = `
      INSERT INTO preventive_maintenances (
        equipment_id, scheduled_date, status, priority, 
        estimated_duration, estimated_cost, notes, 
        created_at, created_by, updated_at, updated_by
      ) VALUES (1, '2025-02-20', 'SCHEDULED', 'MEDIUM', 60, 100, 'Teste', NOW(), 'system', NOW(), 'system')
    `;
    
    const insertResult = await query(insertQuery);
    console.log('✅ Inserção OK, ID:', insertResult.insertId);
    
    // Buscar registro inserido
    console.log('🔍 Buscando registro inserido...');
    const selectResult = await query('SELECT * FROM preventive_maintenances WHERE id = ?', [insertResult.insertId]);
    console.log('✅ Registro encontrado:', JSON.stringify(selectResult[0], null, 2));
    
    // Limpar teste
    await query('DELETE FROM preventive_maintenances WHERE id = ?', [insertResult.insertId]);
    console.log('🧹 Registro de teste removido');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('❌ Stack:', error.stack);
  }
}

testPreventiveAPI();