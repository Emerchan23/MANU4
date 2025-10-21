const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkEquipmentStructure() {
  console.log('🔍 Verificando estrutura da tabela equipment...');
  
  // Configuração do banco de dados
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
    console.log('✅ Conectado ao banco de dados');
    
    // Verificar estrutura da tabela equipment
    console.log('\n📋 Estrutura da tabela equipment:');
    const [columns] = await connection.execute('DESCRIBE equipment');
    
    console.log('Colunas encontradas:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `KEY: ${col.Key}` : ''} ${col.Default !== null ? `DEFAULT: ${col.Default}` : ''}`);
    });
    
    // Verificar se a coluna patrimonio existe
    const patrimonioExists = columns.some(col => col.Field === 'patrimonio');
    console.log(`\n📊 Coluna 'patrimonio' existe: ${patrimonioExists ? '✅ SIM' : '❌ NÃO'}`);
    
    if (!patrimonioExists) {
      console.log('\n🔧 A coluna "patrimonio" não existe. Vamos verificar se existe uma coluna similar...');
      
      const similarColumns = columns.filter(col => 
        col.Field.toLowerCase().includes('patrim') || 
        col.Field.toLowerCase().includes('asset') ||
        col.Field.toLowerCase().includes('serial') ||
        col.Field.toLowerCase().includes('number')
      );
      
      if (similarColumns.length > 0) {
        console.log('📋 Colunas similares encontradas:');
        similarColumns.forEach(col => {
          console.log(`  - ${col.Field} (${col.Type})`);
        });
      } else {
        console.log('❌ Nenhuma coluna similar encontrada.');
      }
    }
    
    // Mostrar alguns registros de exemplo
    console.log('\n📊 Registros de exemplo da tabela equipment:');
    const [equipments] = await connection.execute('SELECT * FROM equipment LIMIT 3');
    
    equipments.forEach((eq, index) => {
      console.log(`\nEquipamento ${index + 1}:`);
      Object.keys(eq).forEach(key => {
        console.log(`  ${key}: ${eq[key]}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada.');
    }
  }
}

checkEquipmentStructure();