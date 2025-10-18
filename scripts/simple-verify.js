import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function simpleVerify() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao MariaDB...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hospital_maintenance',
      port: process.env.DB_PORT || 3306
    });
    
    console.log('✅ Conectado com sucesso!');
    
    // Verificar tabela maintenance_types
    console.log('\n📋 Verificando tabela maintenance_types:');
    
    const [columns] = await connection.execute('DESCRIBE maintenance_types');
    console.log('Colunas:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM maintenance_types');
    console.log(`Total de registros: ${count[0].total}`);
    
    if (count[0].total > 0) {
      const [sample] = await connection.execute('SELECT * FROM maintenance_types LIMIT 3');
      console.log('Dados de exemplo:');
      sample.forEach((row, i) => {
        console.log(`  ${i + 1}. ID: ${row.id}, Nome: ${row.name}, Ativo: ${row.is_active}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

simpleVerify();