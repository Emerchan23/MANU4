const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function removeMaintenanceTypeColumn() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');
    
    // Verificar se a coluna existe antes de tentar remover
    console.log('\n🔍 Verificando se a coluna maintenance_type_id existe...');
    const [columns] = await connection.execute('DESCRIBE service_orders');
    const maintenanceTypeColumn = columns.find(col => col.Field === 'maintenance_type_id');
    
    if (!maintenanceTypeColumn) {
      console.log('❌ Coluna maintenance_type_id não encontrada. Nada para remover.');
      return;
    }
    
    console.log('✅ Coluna maintenance_type_id encontrada. Procedendo com a remoção...');
    
    // Verificar novamente se há dados na coluna (segurança extra)
    const [usage] = await connection.execute(`
      SELECT COUNT(maintenance_type_id) as records_with_data
      FROM service_orders 
      WHERE maintenance_type_id IS NOT NULL
    `);
    
    if (usage[0].records_with_data > 0) {
      console.log(`⚠️  ATENÇÃO: Encontrados ${usage[0].records_with_data} registros com dados na coluna!`);
      console.log('❌ Operação cancelada por segurança. Verifique os dados antes de prosseguir.');
      return;
    }
    
    console.log('✅ Confirmado: coluna está vazia, seguro para remover.');
    
    // Remover a coluna
    console.log('\n🗑️  Removendo coluna maintenance_type_id...');
    await connection.execute('ALTER TABLE service_orders DROP COLUMN maintenance_type_id');
    
    console.log('✅ Coluna maintenance_type_id removida com sucesso!');
    
    // Verificar se a remoção foi bem-sucedida
    console.log('\n🔍 Verificando estrutura atualizada da tabela...');
    const [updatedColumns] = await connection.execute('DESCRIBE service_orders');
    const stillExists = updatedColumns.find(col => col.Field === 'maintenance_type_id');
    
    if (stillExists) {
      console.log('❌ Erro: A coluna ainda existe após a tentativa de remoção!');
    } else {
      console.log('✅ Confirmado: Coluna maintenance_type_id foi removida com sucesso!');
      
      console.log('\n📋 Estrutura atualizada da tabela service_orders:');
      updatedColumns.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao remover coluna:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão encerrada');
    }
  }
}

removeMaintenanceTypeColumn();