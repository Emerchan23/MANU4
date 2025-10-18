const { queryDirect } = require('./lib/database.js');

console.log('🔧 ADICIONANDO COLUNA TITLE NA TABELA preventive_maintenances');
console.log('='.repeat(60));

(async () => {
  try {
    // 1. Verificar se a coluna já existe
    console.log('1️⃣ Verificando se coluna title já existe...');
    const structure = await queryDirect('DESCRIBE preventive_maintenances', []);
    const hasTitle = structure.some(col => col.Field === 'title');
    
    if (hasTitle) {
      console.log('✅ Coluna title já existe!');
      return;
    }
    
    console.log('❌ Coluna title não existe. Adicionando...');
    
    // 2. Adicionar a coluna title
    console.log('2️⃣ Adicionando coluna title...');
    const alterQuery = `
      ALTER TABLE preventive_maintenances 
      ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT 'Manutenção Preventiva'
      AFTER id
    `;
    
    await queryDirect(alterQuery, []);
    console.log('✅ Coluna title adicionada com sucesso!');
    
    // 3. Verificar se foi adicionada corretamente
    console.log('3️⃣ Verificando estrutura atualizada...');
    const newStructure = await queryDirect('DESCRIBE preventive_maintenances', []);
    const titleColumn = newStructure.find(col => col.Field === 'title');
    
    if (titleColumn) {
      console.log('✅ Coluna title confirmada:');
      console.log('  - Campo:', titleColumn.Field);
      console.log('  - Tipo:', titleColumn.Type);
      console.log('  - Null:', titleColumn.Null);
      console.log('  - Default:', titleColumn.Default);
    }
    
    // 4. Atualizar registros existentes com títulos mais descritivos
    console.log('4️⃣ Atualizando registros existentes...');
    const updateQuery = `
      UPDATE preventive_maintenances 
      SET title = CONCAT(
        CASE 
          WHEN maintenance_type = 'LUBRICATION' THEN 'Lubrificação'
          WHEN maintenance_type = 'CLEANING' THEN 'Limpeza'
          WHEN maintenance_type = 'INSPECTION' THEN 'Inspeção'
          WHEN maintenance_type = 'CALIBRATION' THEN 'Calibração'
          WHEN maintenance_type = 'REPLACEMENT' THEN 'Substituição'
          WHEN maintenance_type = 'ADJUSTMENT' THEN 'Ajuste'
          ELSE 'Manutenção'
        END,
        ' - ',
        COALESCE(equipment_name, 'Equipamento')
      )
      WHERE title = 'Manutenção Preventiva'
    `;
    
    const result = await queryDirect(updateQuery, []);
    console.log('✅ Registros atualizados:', result.affectedRows || 0);
    
    console.log('');
    console.log('✅ COLUNA TITLE ADICIONADA COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ ERRO AO ADICIONAR COLUNA:', error.message);
    console.error('❌ Stack:', error.stack);
  }
})();