const { query } = require('./lib/database.js');

console.log('🧪 DEBUG: Testando API de manutenção preventiva passo a passo...');

const testData = {
  equipmentId: '1',
  title: 'Teste de Manutenção',
  description: 'Teste de criação via API',
  frequency: 'MONTHLY',
  type: 'INSPECTION',
  priority: 'MEDIUM',
  scheduledDate: '2024-12-31',
  estimatedDuration: '60',
  estimatedCost: '100',
  notes: 'Teste de notas'
};

(async () => {
  try {
    console.log('📝 Dados de teste:', JSON.stringify(testData, null, 2));
    
    // 1. Testar conexão com banco
    console.log('\n🔍 PASSO 1: Testando conexão com banco...');
    const testConnection = await query('SELECT 1 as test', []);
    console.log('✅ Conexão OK:', testConnection);
    
    // 2. Verificar se equipamento existe
    console.log('\n🔍 PASSO 2: Verificando equipamento...');
    const equipmentQuery = `
      SELECT 
        e.id,
        e.name as equipment_name,
        e.patrimonio_number as equipment_code,
        e.sector_id,
        s.name as sector_name
      FROM equipment e
      LEFT JOIN sectors s ON e.sector_id = s.id
      WHERE e.id = ?
    `;
    const equipmentRows = await query(equipmentQuery, [testData.equipmentId]);
    console.log('📊 Equipamento encontrado:', equipmentRows.length > 0 ? equipmentRows[0] : 'Nenhum');
    
    if (equipmentRows.length === 0) {
      console.log('❌ Equipamento não encontrado - parando teste');
      return;
    }
    
    // 3. Verificar estrutura da tabela preventive_maintenances
    console.log('\n🔍 PASSO 3: Verificando estrutura da tabela...');
    const tableStructure = await query('DESCRIBE preventive_maintenances', []);
    console.log('📊 Colunas da tabela:');
    tableStructure.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? '[' + col.Key + ']' : ''}`);
    });
    
    // 4. Testar inserção
    console.log('\n🔍 PASSO 4: Testando inserção...');
    const maintenanceInsertQuery = `
      INSERT INTO preventive_maintenances (
        equipment_id, scheduled_date, status, priority,
        estimated_duration, estimated_cost, notes,
        created_at, created_by, updated_at, updated_by
      ) VALUES (?, ?, 'SCHEDULED', ?, ?, ?, ?, NOW(), 'system', NOW(), 'system')
    `;
    
    const notesData = {
      title: testData.title || 'Manutenção Preventiva',
      description: testData.description || '',
      frequency: testData.frequency || 'MONTHLY',
      type: testData.type || 'INSPECTION',
      originalNotes: testData.notes || ''
    };
    
    const maintenanceParams = [
      testData.equipmentId,
      testData.scheduledDate || new Date().toISOString().split('T')[0],
      testData.priority || 'MEDIUM',
      testData.estimatedDuration || 60,
      testData.estimatedCost || 0,
      JSON.stringify(notesData)
    ];
    
    console.log('📝 Parâmetros para inserção:', maintenanceParams);
    
    const result = await query(maintenanceInsertQuery, maintenanceParams);
    console.log('✅ Inserção realizada com sucesso! ID:', result.insertId);
    
    // 5. Buscar o registro criado
    console.log('\n🔍 PASSO 5: Buscando registro criado...');
    const createdMaintenanceQuery = `
      SELECT 
        pm.*,
        e.name as equipment_name,
        e.patrimonio_number as equipment_code,
        s.name as sector_name
      FROM preventive_maintenances pm
      LEFT JOIN equipment e ON pm.equipment_id = e.id
      LEFT JOIN sectors s ON e.sector_id = s.id
      WHERE pm.id = ?
    `;
    
    const createdRows = await query(createdMaintenanceQuery, [result.insertId]);
    console.log('✅ Registro encontrado:', createdRows.length > 0 ? createdRows[0] : 'Nenhum');
    
    console.log('\n🎉 TESTE COMPLETO - TODOS OS PASSOS FUNCIONARAM!');
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.error('❌ Stack:', error.stack);
    console.error('❌ Tipo do erro:', error.constructor.name);
  }
})();