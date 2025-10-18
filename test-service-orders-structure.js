import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Carregar variáveis de ambiente
dotenv.config();

async function testServiceOrdersStructure() {
  console.log('🔍 Verificando estrutura da tabela service_orders...');
  
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
    
    // Verificar estrutura da tabela service_orders
    console.log('\n📋 Estrutura da tabela service_orders:');
    const [structure] = await connection.execute('DESCRIBE service_orders');
    
    structure.forEach(column => {
      console.log(`   ${column.Field}: ${column.Type} ${column.Null === 'NO' ? '(NOT NULL)' : '(NULL)'} ${column.Key ? `[${column.Key}]` : ''} ${column.Default !== null ? `Default: ${column.Default}` : ''}`);
    });
    
    // Verificar se existem colunas relacionadas a custo e observações
    console.log('\n🔍 Verificando colunas específicas para custo e observações:');
    const costColumns = structure.filter(col => 
      col.Field.toLowerCase().includes('cost') || 
      col.Field.toLowerCase().includes('custo') ||
      col.Field.toLowerCase().includes('price') ||
      col.Field.toLowerCase().includes('valor')
    );
    
    const observationColumns = structure.filter(col => 
      col.Field.toLowerCase().includes('observ') || 
      col.Field.toLowerCase().includes('note') ||
      col.Field.toLowerCase().includes('comment') ||
      col.Field.toLowerCase().includes('description')
    );
    
    console.log('\n💰 Colunas relacionadas a CUSTO:');
    if (costColumns.length > 0) {
      costColumns.forEach(col => {
        console.log(`   ✅ ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
      });
    } else {
      console.log('   ❌ Nenhuma coluna de custo encontrada!');
    }
    
    console.log('\n📝 Colunas relacionadas a OBSERVAÇÕES:');
    if (observationColumns.length > 0) {
      observationColumns.forEach(col => {
        console.log(`   ✅ ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
      });
    } else {
      console.log('   ❌ Nenhuma coluna de observações encontrada!');
    }
    
    // Verificar dados existentes na tabela
    console.log('\n📊 Verificando dados existentes na tabela:');
    const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM service_orders');
    console.log(`   Total de registros: ${countResult[0].total}`);
    
    if (countResult[0].total > 0) {
      console.log('\n🔍 Amostra dos últimos 3 registros:');
      const [sampleData] = await connection.execute('SELECT * FROM service_orders ORDER BY id DESC LIMIT 3');
      
      sampleData.forEach((row, index) => {
        console.log(`\n   Registro ${index + 1}:`);
        Object.keys(row).forEach(key => {
          console.log(`     ${key}: ${row[key]}`);
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Código do erro:', error.code);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada');
    }
  }
}

testServiceOrdersStructure();