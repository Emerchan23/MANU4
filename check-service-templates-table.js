import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Carregar variáveis de ambiente
dotenv.config();

async function checkServiceTemplatesTable() {
  console.log('🔍 Verificando estrutura da tabela service_description_templates...');
  
  // Configuração do banco
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_maintenance',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',
    timezone: '+00:00'
  };
  
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco MariaDB');
    
    // Verificar se a tabela existe
    console.log('\n1. Verificando se a tabela service_description_templates existe...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'service_description_templates'
    `, [dbConfig.database]);
    
    if (tables.length === 0) {
      console.log('❌ Tabela service_description_templates NÃO EXISTE!');
      
      // Verificar se existe uma tabela similar
      console.log('\n2. Procurando tabelas similares...');
      const [similarTables] = await connection.execute(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME LIKE '%template%'
      `, [dbConfig.database]);
      
      console.log('📋 Tabelas com "template" no nome:');
      similarTables.forEach(table => {
        console.log(`   - ${table.TABLE_NAME}`);
      });
      
      return;
    }
    
    console.log('✅ Tabela service_description_templates existe!');
    
    // Verificar estrutura da tabela
    console.log('\n2. Verificando estrutura da tabela...');
    const [columns] = await connection.execute(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        CHARACTER_SET_NAME,
        COLLATION_NAME
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'service_description_templates'
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);
    
    console.log('📊 Estrutura da tabela:');
    columns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.CHARACTER_SET_NAME ? `[${col.CHARACTER_SET_NAME}/${col.COLLATION_NAME}]` : ''}`);
    });
    
    // Verificar dados na tabela
    console.log('\n3. Verificando dados na tabela...');
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM service_description_templates');
    console.log(`📊 Total de registros: ${count[0].total}`);
    
    if (count[0].total > 0) {
      console.log('\n4. Mostrando primeiros 3 registros...');
      const [samples] = await connection.execute(`
        SELECT id, name, description, category_id, is_active, created_at 
        FROM service_description_templates 
        LIMIT 3
      `);
      
      samples.forEach((row, index) => {
        console.log(`   ${index + 1}. ID: ${row.id}, Nome: "${row.name}", Categoria: ${row.category_id}, Ativo: ${row.is_active}`);
      });
    }
    
    // Verificar charset e collation da tabela
    console.log('\n5. Verificando charset e collation da tabela...');
    const [tableInfo] = await connection.execute(`
      SELECT 
        TABLE_COLLATION,
        TABLE_SCHEMA
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'service_description_templates'
    `, [dbConfig.database]);
    
    if (tableInfo.length > 0) {
      console.log(`📊 Collation da tabela: ${tableInfo[0].TABLE_COLLATION}`);
    }
    
    await connection.end();
    console.log('\n✅ Verificação concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabela:', error.message);
    if (connection) {
      await connection.end();
    }
  }
}

// Executar verificação
checkServiceTemplatesTable().then(() => {
  console.log('\n🏁 Verificação finalizada.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});