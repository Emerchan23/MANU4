const mysql = require('mysql2/promise');

async function testSimpleAPI() {
  try {
    console.log('🧪 TESTE SIMPLES DA API DE EQUIPAMENTOS');
    console.log('=====================================');
    
    // Conectar diretamente ao banco
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('✅ Conectado ao banco de dados');

    // Simular dados que vêm do formulário
    const formData = {
      name: 'Equipamento Teste Simples',
      patrimonio_number: 'PAT' + Date.now(),
      manufacturer: 'Fabricante Teste',
      model: 'Modelo Teste',
      serial_number: 'SN' + Date.now(),
      category_id: 1,
      sector_id: 1,
      subsector_id: 1,
      installation_date: '2024-01-15',
      status: 'ativo',
      observations: 'Teste simples'
    };

    console.log('📊 Dados do formulário:', formData);

    // Query exata que está sendo usada na API
    const insertQuery = `
      INSERT INTO equipment (
        name, patrimony, patrimonio_number, code, model, serial_number, manufacturer, 
        sector_id, category_id, subsector_id, acquisition_date, 
        warranty_expiry, status, observations, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    console.log('📝 Query SQL:', insertQuery);

    // Parâmetros exatos que estão sendo usados na API
    const params = [
      formData.name,
      formData.patrimonio_number || null, // patrimony
      formData.patrimonio_number || null, // patrimonio_number
      formData.patrimonio_number || null, // code usando mesmo valor que patrimonio_number
      formData.model || null,
      formData.serial_number || null,
      formData.manufacturer || null,
      formData.sector_id || null,
      formData.category_id || null,
      formData.subsector_id || null,
      formData.installation_date || null, // acquisition_date
      formData.warranty_expiry || null,
      formData.status || 'ativo',
      formData.observations || null,
      1 // is_active = true
    ];

    console.log('📋 Parâmetros:', params);

    // Executar a query
    const [result] = await connection.execute(insertQuery, params);
    
    console.log('✅ Resultado da inserção:', result);
    console.log('🆔 ID do equipamento criado:', result.insertId);

    // Verificar se foi inserido
    const [verification] = await connection.execute(
      'SELECT * FROM equipment WHERE id = ?',
      [result.insertId]
    );

    console.log('🔍 Equipamento verificado:', verification[0]);

    await connection.end();
    console.log('✅ Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('📍 Stack:', error.stack);
    
    // Verificar se é erro de SQL
    if (error.code) {
      console.error('🔍 Código do erro SQL:', error.code);
      console.error('🔍 SQL State:', error.sqlState);
      console.error('🔍 SQL Message:', error.sqlMessage);
    }
  }
}

testSimpleAPI();

async function testSimpleAPI() {
  try {
    console.log('🧪 TESTE SIMPLES DA API DE EQUIPAMENTOS');
    console.log('=====================================');
    
    // Conectar diretamente ao banco
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('✅ Conectado ao banco de dados');

    // Simular dados que vêm do formulário
    const formData = {
      name: 'Equipamento Teste Simples',
      patrimonio_number: 'PAT' + Date.now(),
      manufacturer: 'Fabricante Teste',
      model: 'Modelo Teste',
      serial_number: 'SN' + Date.now(),
      category_id: 1,
      sector_id: 1,
      subsector_id: 1,
      installation_date: '2024-01-15',
      status: 'ativo',
      observations: 'Teste simples'
    };

    console.log('📊 Dados do formulário:', formData);

    // Query exata que está sendo usada na API
    const insertQuery = `
      INSERT INTO equipment (
        name, patrimony, patrimonio_number, code, model, serial_number, manufacturer, 
        sector_id, category_id, subsector_id, acquisition_date, 
        warranty_expiry, status, observations, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    console.log('📝 Query SQL:', insertQuery);

    // Parâmetros exatos que estão sendo usados na API
    const params = [
      formData.name,
      formData.patrimonio_number || null, // patrimony
      formData.patrimonio_number || null, // patrimonio_number
      formData.patrimonio_number || null, // code usando mesmo valor que patrimonio_number
      formData.model || null,
      formData.serial_number || null,
      formData.manufacturer || null,
      formData.sector_id || null,
      formData.category_id || null,
      formData.subsector_id || null,
      formData.installation_date || null, // acquisition_date
      formData.warranty_expiry || null,
      formData.status || 'ativo',
      formData.observations || null,
      1 // is_active = true
    ];

    console.log('📋 Parâmetros:', params);

    // Executar a query
    const [result] = await connection.execute(insertQuery, params);
    
    console.log('✅ Resultado da inserção:', result);
    console.log('🆔 ID do equipamento criado:', result.insertId);

    // Verificar se foi inserido
    const [verification] = await connection.execute(
      'SELECT * FROM equipment WHERE id = ?',
      [result.insertId]
    );

    console.log('🔍 Equipamento verificado:', verification[0]);

    await connection.end();
    console.log('✅ Teste concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    console.error('📍 Stack:', error.stack);
    
    // Verificar se é erro de SQL
    if (error.code) {
      console.error('🔍 Código do erro SQL:', error.code);
      console.error('🔍 SQL State:', error.sqlState);
      console.error('🔍 SQL Message:', error.sqlMessage);
    }
  }
}

testSimpleAPI();