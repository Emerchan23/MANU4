const mysql = require('mysql2/promise');

async function checkEquipmentTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '',
    database: 'hospital_maintenance'
  });

  console.log('=== VERIFICANDO TABELAS DE EQUIPAMENTOS ===\n');

  // 1. Verificar todas as tabelas do banco
  console.log('1. TODAS AS TABELAS DO BANCO:');
  const [tables] = await connection.execute("SHOW TABLES");
  console.table(tables);

  // 2. Verificar se existe tabela equipment
  console.log('\n2. VERIFICANDO TABELA EQUIPMENT:');
  const [equipmentTables] = await connection.execute("SHOW TABLES LIKE 'equipment'");
  if (equipmentTables.length > 0) {
    console.log('✅ Tabela equipment encontrada');
    const [equipmentStructure] = await connection.execute("DESCRIBE equipment");
    console.table(equipmentStructure);
    
    // Contar registros
    const [equipmentCount] = await connection.execute("SELECT COUNT(*) as count FROM equipment");
    console.log(`📊 Total de registros na tabela equipment: ${equipmentCount[0].count}`);
  } else {
    console.log('❌ Tabela equipment NÃO encontrada');
  }

  // 3. Verificar se existe tabela equipamentos
  console.log('\n3. VERIFICANDO TABELA EQUIPAMENTOS:');
  const [equipamentosTables] = await connection.execute("SHOW TABLES LIKE 'equipamentos'");
  if (equipamentosTables.length > 0) {
    console.log('✅ Tabela equipamentos encontrada');
    const [equipamentosStructure] = await connection.execute("DESCRIBE equipamentos");
    console.table(equipamentosStructure);
    
    // Contar registros
    const [equipamentosCount] = await connection.execute("SELECT COUNT(*) as count FROM equipamentos");
    console.log(`📊 Total de registros na tabela equipamentos: ${equipamentosCount[0].count}`);
  } else {
    console.log('❌ Tabela equipamentos NÃO encontrada');
  }

  // 4. Testar query da API
  console.log('\n4. TESTANDO QUERY DA API:');
  try {
    const queryStr = `
      SELECT 
        e.id,
        e.name,
        e.patrimonio,
        e.model,
        e.serial_number,
        e.manufacturer,
        e.sector_id,
        e.category_id,
        e.subsector_id,
        e.installation_date,
        e.last_preventive_maintenance,
        e.next_preventive_maintenance,
        e.maintenance_frequency_days,
        e.warranty_expiry,
        e.status,
        e.observations,
        e.created_at,
        e.updated_at,
        e.patrimonio_number,
        e.voltage,
        e.power,
        e.maintenance_frequency,
        s.nome as sector_name,
        c.name as category_name,
        sub.name as subsector_name
      FROM equipment e
      LEFT JOIN setores s ON e.sector_id = s.id
      LEFT JOIN categorias c ON e.category_id = c.id
      LEFT JOIN subsetores sub ON e.subsector_id = sub.id
      ORDER BY e.created_at DESC
      LIMIT 5
    `;
    
    const [rows] = await connection.execute(queryStr);
    console.log('✅ Query da API executada com sucesso');
    console.log(`📊 Registros retornados: ${rows.length}`);
    
    if (rows.length > 0) {
      console.log('\n📄 Primeiro equipamento:');
      console.table([rows[0]]);
    }
  } catch (error) {
    console.log('❌ Erro na query da API:', error.message);
  }

  await connection.end();
}

checkEquipmentTable().catch(console.error);