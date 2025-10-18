const { query } = require('./lib/database.js');

console.log('🧪 Testando inserção direta na tabela preventive_maintenances...');

const testData = [
  19, // equipment_id
  '2025-02-15', // scheduled_date
  'MEDIUM', // priority
  120, // estimated_duration
  250.00, // estimated_cost
  JSON.stringify({
    title: 'Teste Direto',
    description: 'Teste inserção direta',
    frequency: 'MONTHLY',
    type: 'CLEANING',
    originalNotes: 'Teste de inserção'
  }) // notes
];

const insertQuery = `
  INSERT INTO preventive_maintenances (
    equipment_id, scheduled_date, priority, 
    estimated_duration, estimated_cost, notes,
    created_at, created_by, updated_at, updated_by
  ) VALUES (?, ?, ?, ?, ?, ?, NOW(), 'system', NOW(), 'system')
`;

query(insertQuery, testData)
  .then(result => {
    console.log('✅ Inserção bem-sucedida:', result);
    console.log('📝 ID da manutenção criada:', result.insertId);
  })
  .catch(error => {
    console.error('❌ Erro na inserção:', error.message);
    console.error('❌ Stack trace:', error.stack);
  });