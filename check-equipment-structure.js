import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkEquipmentStructure() {
  const conn = await mysql.createConnection({
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'hospital_maintenance'
  });
  
  console.log('🔍 Verificando estrutura da tabela equipment...');
  const [cols] = await conn.execute('DESCRIBE equipment');
  console.log('Colunas da tabela equipment:');
  cols.forEach(c => console.log(`- ${c.Field} (${c.Type})`));
  
  await conn.end();
}

checkEquipmentStructure().catch(console.error);