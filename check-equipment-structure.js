const mysql = require('mysql2/promise');

async function checkEquipmentStructure() {
  let connection;
  
  try {
    // Conectar ao banco
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'admin',
      database: 'sis_manutencao'
    });

    console.log('✅ Conectado ao banco de dados');

    // Verificar estrutura da tabela equipment
    console.log('\n🔍 Estrutura da tabela equipment:');
    const [structure] = await connection.execute('DESCRIBE equipment');
    
    console.table(structure);

    // Verificar se existe company_id
    const hasCompanyId = structure.some(field => field.Field === 'company_id');
    console.log(`\n📋 Campo company_id existe: ${hasCompanyId ? '✅ SIM' : '❌ NÃO'}`);

    // Buscar alguns equipamentos para ver a estrutura dos dados
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

checkEquipmentStructure();