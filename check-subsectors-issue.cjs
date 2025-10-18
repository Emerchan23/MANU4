const mysql = require('mysql2/promise');

async function checkSubsectors() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root', 
    password: '',
    database: 'hospital_maintenance'
  });

  console.log('=== VERIFICANDO SETORES ===');
  const [sectors] = await connection.execute('SELECT id, nome FROM setores WHERE nome LIKE "%Administra%"');
  console.table(sectors);

  console.log('\n=== VERIFICANDO SUBSETORES ===');
  const [subsectors] = await connection.execute('SELECT * FROM subsetores');
  console.table(subsectors);

  console.log('\n=== VERIFICANDO UTI ADULTO E UTI PEDIÁTRICA ===');
  const [utiSubsectors] = await connection.execute('SELECT * FROM subsetores WHERE nome LIKE "%UTI%"');
  console.table(utiSubsectors);

  if (sectors.length > 0) {
    const sectorId = sectors[0].id;
    console.log(`\n=== SUBSETORES DO SETOR ADMINISTRAÇÃO (ID: ${sectorId}) ===`);
    const [adminSubsectors] = await connection.execute('SELECT * FROM subsetores WHERE setor_id = ?', [sectorId]);
    console.table(adminSubsectors);
  }

  await connection.end();
}

checkSubsectors().catch(console.error);