const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function checkMaintenanceTypesDB() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados MariaDB');
    
    console.log('\n🔍 Verificando estrutura das tabelas de tipos de manutenção...');
    
    // Verificar se tabela maintenance_types existe
    const [mtCheck] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'maintenance_types'
    `, [dbConfig.database]);
    
    console.log(`📋 Tabela maintenance_types: ${mtCheck[0].count > 0 ? 'EXISTE' : 'NÃO EXISTE'}`);
    
    if (mtCheck[0].count > 0) {
      const [mtData] = await connection.execute('SELECT * FROM maintenance_types ORDER BY name');
      console.log(`   - Registros: ${mtData.length}`);
      mtData.forEach(row => console.log(`     ID: ${row.id}, Nome: ${row.name}, Categoria: ${row.category}, Ativo: ${row.isActive}`));
    }
    
    // Verificar se tabela tipos_manutencao existe
    const [tmCheck] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'tipos_manutencao'
    `, [dbConfig.database]);
    
    console.log(`\n📋 Tabela tipos_manutencao: ${tmCheck[0].count > 0 ? 'EXISTE' : 'NÃO EXISTE'}`);
    
    if (tmCheck[0].count > 0) {
      const [tmData] = await connection.execute('SELECT * FROM tipos_manutencao ORDER BY nome');
      console.log(`   - Registros: ${tmData.length}`);
      tmData.forEach(row => console.log(`     ID: ${row.id}, Nome: ${row.nome}, Categoria: ${row.categoria}, Ativo: ${row.ativo}`));
    }
    
    // Verificar estrutura da tabela service_orders
    console.log('\n🔍 Verificando coluna maintenance_type_id na tabela service_orders...');
    const [soColumns] = await connection.execute('DESCRIBE service_orders');
    const maintenanceTypeColumn = soColumns.find(col => col.Field === 'maintenance_type_id');
    
    if (maintenanceTypeColumn) {
      console.log('✅ Coluna maintenance_type_id encontrada:');
      console.log(`   Tipo: ${maintenanceTypeColumn.Type}`);
      console.log(`   Null: ${maintenanceTypeColumn.Null}`);
      console.log(`   Default: ${maintenanceTypeColumn.Default}`);
    } else {
      console.log('❌ Coluna maintenance_type_id NÃO encontrada');
    }
    
    // Verificar uso da coluna
    const [usage] = await connection.execute(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(maintenance_type_id) as records_with_maintenance_type,
        COUNT(DISTINCT maintenance_type_id) as distinct_maintenance_types
      FROM service_orders
    `);
    
    console.log('\n📊 Uso da coluna maintenance_type_id:');
    console.log(`   Total de registros: ${usage[0].total_records}`);
    console.log(`   Registros com maintenance_type_id: ${usage[0].records_with_maintenance_type}`);
    console.log(`   Tipos distintos: ${usage[0].distinct_maintenance_types}`);
    
    console.log('\n✅ Verificação concluída');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkMaintenanceTypesDB().catch(console.error);