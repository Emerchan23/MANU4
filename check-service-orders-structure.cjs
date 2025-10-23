const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkServiceOrdersStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela service_orders...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306')
    });

    console.log('✅ Conectado ao banco de dados');

    // Verificar estrutura da tabela
    console.log('\n📋 Estrutura da tabela service_orders:');
    const [columns] = await connection.execute('DESCRIBE service_orders');
    console.log('Colunas da tabela:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });

    // Verificar registros existentes para equipamento ID 9
    console.log('\n🔍 Verificando registros para equipamento ID 9:');
    const [orders] = await connection.execute('SELECT * FROM service_orders WHERE equipment_id = 9');
    console.log(`Total de registros encontrados: ${orders.length}`);
    
    if (orders.length > 0) {
      console.log('Registros encontrados:');
      orders.forEach((order, index) => {
        console.log(`Ordem ${index + 1}:`, order);
      });
    }

    await connection.end();
    console.log('\n✅ Verificação concluída');

  } catch (error) {
    console.error('❌ Erro na verificação:', error);
  }
}

checkServiceOrdersStructure();