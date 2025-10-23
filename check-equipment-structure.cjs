const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkEquipmentTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });

    console.log('✅ Conectado ao banco de dados');

    // Verificar estrutura da tabela equipment
    console.log('\n🔍 Estrutura da tabela equipment:');
    const [structure] = await connection.execute('DESCRIBE equipment');
    
    structure.forEach(column => {
      console.log(`  - ${column.Field}: ${column.Type} ${column.Null === 'NO' ? '(NOT NULL)' : ''} ${column.Default !== null ? 'DEFAULT ' + column.Default : ''}`);
    });

    // Verificar se a coluna code permite NULL
    const codeColumn = structure.find(col => col.Field === 'code');
    if (codeColumn) {
      console.log('\n📊 Coluna code:');
      console.log(`  - Permite NULL: ${codeColumn.Null === 'YES' ? 'SIM' : 'NÃO'}`);
      console.log(`  - Default: ${codeColumn.Default || 'NULL'}`);
    }

    // Verificar alguns equipamentos para ver a estrutura dos dados
    console.log('\n🔍 Primeiros 3 equipamentos:');
    const [equipments] = await connection.execute('SELECT * FROM equipment LIMIT 3');
    
    if (equipments.length > 0) {
      console.log('Campos disponíveis:', Object.keys(equipments[0]));
      console.log('\nPrimeiro equipamento:');
      console.log(JSON.stringify(equipments[0], null, 2));
    } else {
      console.log('Nenhum equipamento encontrado');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkEquipmentTable();