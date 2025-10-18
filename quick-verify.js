const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  port: parseInt(process.env.DB_PORT || '3306')
};

async function quickVerify() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao banco de dados...\n');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexão estabelecida!\n');
    
    // 1. Verificar tabelas principais
    console.log('📋 TABELAS PRINCIPAIS:\n');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_ROWS, ENGINE
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME IN (
          'service_orders', 'maintenance_schedules', 'equipment',
          'companies', 'sectors', 'subsectors', 'users',
          'service_templates', 'maintenance_plans'
        )
      ORDER BY TABLE_NAME
    `, [dbConfig.database]);
    
    tables.forEach(t => {
      const status = t.TABLE_ROWS > 0 ? '✅' : '⚠️';
      console.log(`${status} ${t.TABLE_NAME.padEnd(30)} - ${t.TABLE_ROWS || 0} registros`);
    });
    
    // 2. Verificar estrutura de service_orders
    console.log('\n\n🔧 ESTRUTURA: service_orders\n');
    const [soCols] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'service_orders'
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);
    
    soCols.forEach(c => {
      const key = c.COLUMN_KEY ? `[${c.COLUMN_KEY}]` : '';
      console.log(`   ${c.COLUMN_NAME.padEnd(25)} ${c.DATA_TYPE.padEnd(15)} ${key}`);
    });
    
    // 3. Verificar estrutura de maintenance_schedules
    console.log('\n\n🔧 ESTRUTURA: maintenance_schedules\n');
    const [msCols] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'maintenance_schedules'
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database]);
    
    msCols.forEach(c => {
      const key = c.COLUMN_KEY ? `[${c.COLUMN_KEY}]` : '';
      console.log(`   ${c.COLUMN_NAME.padEnd(25)} ${c.DATA_TYPE.padEnd(15)} ${key}`);
    });
    
    // 4. Verificar chaves estrangeiras de service_orders
    console.log('\n\n🔗 CHAVES ESTRANGEIRAS: service_orders\n');
    const [soFks] = await connection.execute(`
      SELECT COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'service_orders'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [dbConfig.database]);
    
    soFks.forEach(fk => {
      console.log(`   ${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
    });
    
    console.log('\n\n✅ VERIFICAÇÃO CONCLUÍDA!\n');
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  O servidor MySQL/MariaDB não está rodando!');
      console.error('   Por favor, inicie o XAMPP e tente novamente.\n');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

quickVerify();
