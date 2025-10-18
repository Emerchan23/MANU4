import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

async function checkNotificationsStructure() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_maintenance'
  };
  
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    const [result] = await connection.execute('DESCRIBE notifications');
    console.log('Estrutura da tabela notifications:');
    result.forEach(col => {
      console.log(`${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
    });
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await connection.end();
  }
}

checkNotificationsStructure();