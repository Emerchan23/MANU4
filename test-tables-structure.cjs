const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkTablesStructure() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao banco MariaDB...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance',
      port: parseInt(process.env.DB_PORT || '3306')
    });

    console.log('✅ Conectado ao banco com sucesso!');

    // Verificar se as tabelas existem
    console.log('\n📋 Verificando existência das tabelas...');
    
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('setores', 'sectors', 'subsectors', 'subsetores')
    `, [process.env.DB_NAME || 'hospital_maintenance']);
    
    console.log('📊 Tabelas encontradas:', tables.map(t => t.TABLE_NAME));

    // Verificar estrutura da tabela setores
    if (tables.some(t => t.TABLE_NAME === 'setores')) {
      console.log('\n🏢 Estrutura da tabela SETORES:');
      const [setoresStructure] = await connection.execute('DESCRIBE setores');
      console.table(setoresStructure);
      
      console.log('\n📊 Dados na tabela SETORES:');
      const [setoresData] = await connection.execute('SELECT * FROM setores LIMIT 5');
      console.table(setoresData);
    }

    // Verificar estrutura da tabela sectors (se existir)
    if (tables.some(t => t.TABLE_NAME === 'sectors')) {
      console.log('\n🏢 Estrutura da tabela SECTORS:');
      const [sectorsStructure] = await connection.execute('DESCRIBE sectors');
      console.table(sectorsStructure);
      
      console.log('\n📊 Dados na tabela SECTORS:');
      const [sectorsData] = await connection.execute('SELECT * FROM sectors LIMIT 5');
      console.table(sectorsData);
    }

    // Verificar estrutura da tabela subsectors
    if (tables.some(t => t.TABLE_NAME === 'subsectors')) {
      console.log('\n🏗️ Estrutura da tabela SUBSECTORS:');
      const [subsectorsStructure] = await connection.execute('DESCRIBE subsectors');
      console.table(subsectorsStructure);
      
      console.log('\n📊 Dados na tabela SUBSECTORS:');
      const [subsectorsData] = await connection.execute('SELECT * FROM subsectors LIMIT 5');
      console.table(subsectorsData);
    }

    // Verificar estrutura da tabela subsetores (se existir)
    if (tables.some(t => t.TABLE_NAME === 'subsetores')) {
      console.log('\n🏗️ Estrutura da tabela SUBSETORES:');
      const [subsetoresStructure] = await connection.execute('DESCRIBE subsetores');
      console.table(subsetoresStructure);
      
      console.log('\n📊 Dados na tabela SUBSETORES:');
      const [subsetoresData] = await connection.execute('SELECT * FROM subsetores LIMIT 5');
      console.table(subsetoresData);
    }

    // Verificar foreign keys
    console.log('\n🔗 Verificando foreign keys relacionadas:');
    const [foreignKeys] = await connection.execute(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE REFERENCED_TABLE_SCHEMA = ?
      AND (REFERENCED_TABLE_NAME IN ('setores', 'sectors', 'subsectors', 'subsetores')
           OR TABLE_NAME IN ('setores', 'sectors', 'subsectors', 'subsetores'))
    `, [process.env.DB_NAME || 'hospital_maintenance']);
    
    console.table(foreignKeys);

  } catch (error) {
    console.error('❌ Erro ao verificar estrutura das tabelas:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

checkTablesStructure();