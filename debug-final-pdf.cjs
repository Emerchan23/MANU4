const mysql = require('mysql2/promise');

async function debugPDFGeneration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hospital_maintenance'
  });

  console.log('=== DEBUG FINAL DA GERAÇÃO DE PDF ===\n');

  try {
    // 1. Verificar dados da ordem de serviço 89
    console.log('1. Dados da ordem de serviço 89:');
    const [orderRows] = await connection.execute(`
      SELECT 
        so.id,
        so.company_id,
        c.name as company_name,
        c.cnpj as company_cnpj,
        c.address as company_address,
        c.phone
      FROM service_orders so
      LEFT JOIN companies c ON so.company_id = c.id
      WHERE so.id = 89
    `);
    
    if (orderRows.length > 0) {
      console.log('Ordem de serviço encontrada:');
      console.log(JSON.stringify(orderRows[0], null, 2));
    } else {
      console.log('Ordem de serviço 89 não encontrada!');
    }

    // 2. Verificar configurações de PDF
    console.log('\n2. Configurações de PDF:');
    try {
      const [settingsRows] = await connection.execute(`
        SELECT * FROM pdf_settings WHERE is_active = 1 LIMIT 1
      `);
      
      if (settingsRows.length > 0) {
        console.log('Configurações encontradas:');
        console.log(JSON.stringify(settingsRows[0], null, 2));
      } else {
        console.log('Nenhuma configuração de PDF encontrada - usando padrões');
      }
    } catch (error) {
      console.log('Tabela pdf_settings não existe - usando configurações padrão');
    }

    // 3. Verificar se existe "FUNDO MUNICIPAL" em alguma tabela
    console.log('\n3. Procurando por "FUNDO MUNICIPAL" em todas as tabelas:');
    
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'hospital_maintenance'
    `);

    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      
      // Obter colunas da tabela
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME, DATA_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'hospital_maintenance' 
        AND TABLE_NAME = '${tableName}'
        AND DATA_TYPE IN ('varchar', 'text', 'char', 'longtext', 'mediumtext', 'tinytext')
      `);

      for (const col of columns) {
        try {
          const [results] = await connection.execute(`
            SELECT * FROM ${tableName} 
            WHERE ${col.COLUMN_NAME} LIKE '%FUNDO MUNICIPAL%'
          `);
          
          if (results.length > 0) {
            console.log(`ENCONTRADO em ${tableName}.${col.COLUMN_NAME}:`);
            console.log(JSON.stringify(results, null, 2));
          }
        } catch (error) {
          // Ignorar erros de consulta
        }
      }
    }

    // 4. Testar a consulta exata da API
    console.log('\n4. Testando consulta exata da API:');
    const [apiRows] = await connection.execute(`
      SELECT 
        so.id,
        so.equipment_id,
        so.company_id,
        so.maintenance_type,
        so.description,
        so.status,
        so.priority,
        so.created_at,
        so.scheduled_date,
        so.completed_date,
        so.technician_notes,
        so.cost,
        e.name as equipment_name,
        e.model as equipment_model,
        e.serial_number as equipment_serial,
        e.location as equipment_location,
        c.name as company_name,
        c.cnpj as company_cnpj,
        c.address as company_address,
        c.phone as company_phone
      FROM service_orders so
      LEFT JOIN equipments e ON so.equipment_id = e.id
      LEFT JOIN companies c ON so.company_id = c.id
      WHERE so.id = ?
    `, [89]);

    if (apiRows.length > 0) {
      console.log('Resultado da consulta da API:');
      console.log(JSON.stringify(apiRows[0], null, 2));
    }

    // 5. Verificar se há dados em cache ou outras fontes
    console.log('\n5. Verificando outras possíveis fontes de dados:');
    
    // Verificar se existe alguma configuração global
    try {
      const [globalSettings] = await connection.execute(`
        SELECT * FROM settings WHERE setting_key LIKE '%company%' OR setting_key LIKE '%empresa%'
      `);
      
      if (globalSettings.length > 0) {
        console.log('Configurações globais encontradas:');
        console.log(JSON.stringify(globalSettings, null, 2));
      }
    } catch (error) {
      console.log('Tabela settings não existe');
    }

    // Verificar se existe alguma configuração de sistema
    try {
      const [systemConfig] = await connection.execute(`
        SELECT * FROM system_config WHERE config_key LIKE '%company%' OR config_key LIKE '%empresa%'
      `);
      
      if (systemConfig.length > 0) {
        console.log('Configurações de sistema encontradas:');
        console.log(JSON.stringify(systemConfig, null, 2));
      }
    } catch (error) {
      console.log('Tabela system_config não existe');
    }

  } catch (error) {
    console.error('Erro durante debug:', error);
  } finally {
    await connection.end();
  }
}

debugPDFGeneration().catch(console.error);