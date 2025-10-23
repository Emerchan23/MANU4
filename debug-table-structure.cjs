const mysql = require('mysql2/promise');

async function debugTableStructure() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  try {
    console.log('🔍 Verificando estrutura da tabela equipment...');
    
    // Verificar estrutura da tabela
    const [columns] = await connection.execute('DESCRIBE equipment');
    console.log('\n📋 Estrutura da tabela equipment:');
    columns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type} | Null: ${col.Null} | Default: ${col.Default}`);
    });

    // Verificar o último equipamento inserido
    const [lastEquipment] = await connection.execute(
      'SELECT * FROM equipment ORDER BY id DESC LIMIT 1'
    );
    
    console.log('\n📋 Último equipamento inserido:');
    console.log(JSON.stringify(lastEquipment[0], null, 2));

    // Testar inserção manual
    console.log('\n🧪 Testando inserção manual...');
    const testResult = await connection.execute(`
      INSERT INTO equipment (
        name, code, patrimonio_number, model, serial_number, manufacturer, 
        sector_id, category_id, status, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'Teste Manual',
      'PAT333333',
      '333333',
      'Modelo Manual',
      'SN-MANUAL-333',
      'Fabricante Manual',
      1,
      1,
      'ativo',
      1
    ]);

    console.log('✅ Inserção manual bem-sucedida, ID:', testResult[0].insertId);

    // Verificar o equipamento recém-inserido
    const [newEquipment] = await connection.execute(
      'SELECT * FROM equipment WHERE id = ?',
      [testResult[0].insertId]
    );
    
    console.log('\n📋 Equipamento inserido manualmente:');
    console.log(JSON.stringify(newEquipment[0], null, 2));

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await connection.end();
  }
}

debugTableStructure();