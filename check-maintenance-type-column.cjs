const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function checkMaintenanceTypeColumn() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');
    
    // Verificar estrutura da tabela service_orders
    console.log('\n📋 Verificando coluna maintenance_type_id na tabela service_orders:');
    const [columns] = await connection.execute('DESCRIBE service_orders');
    
    // Procurar pela coluna maintenance_type_id
    const maintenanceTypeColumn = columns.find(col => col.Field === 'maintenance_type_id');
    
    if (maintenanceTypeColumn) {
      console.log('✅ Coluna maintenance_type_id encontrada:');
      console.log(`   Tipo: ${maintenanceTypeColumn.Type}`);
      console.log(`   Null: ${maintenanceTypeColumn.Null}`);
      console.log(`   Default: ${maintenanceTypeColumn.Default}`);
      
      // Verificar se há dados usando esta coluna
      console.log('\n🔍 Verificando uso da coluna:');
      const [usage] = await connection.execute(`
        SELECT 
          COUNT(*) as total_records,
          COUNT(maintenance_type_id) as records_with_maintenance_type,
          COUNT(DISTINCT maintenance_type_id) as distinct_maintenance_types
        FROM service_orders
      `);
      
      console.log(`   Total de registros: ${usage[0].total_records}`);
      console.log(`   Registros com maintenance_type_id: ${usage[0].records_with_maintenance_type}`);
      console.log(`   Tipos distintos: ${usage[0].distinct_maintenance_types}`);
      
      if (usage[0].records_with_maintenance_type > 0) {
        console.log('\n⚠️  ATENÇÃO: Existem registros usando a coluna maintenance_type_id!');
        
        // Mostrar alguns exemplos
        const [examples] = await connection.execute(`
          SELECT id, order_number, maintenance_type_id 
          FROM service_orders 
          WHERE maintenance_type_id IS NOT NULL 
          LIMIT 5
        `);
        
        console.log('   Exemplos de registros:');
        examples.forEach(record => {
          console.log(`   - OS ${record.order_number} (ID: ${record.id}) -> maintenance_type_id: ${record.maintenance_type_id}`);
        });
      } else {
        console.log('\n✅ A coluna maintenance_type_id existe mas não está sendo usada. Pode ser removida com segurança.');
      }
      
    } else {
      console.log('❌ Coluna maintenance_type_id NÃO encontrada na tabela service_orders');
    }
    
    // Mostrar todas as colunas da tabela para referência
    console.log('\n📋 Todas as colunas da tabela service_orders:');
    columns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão encerrada');
    }
  }
}

checkMaintenanceTypeColumn();