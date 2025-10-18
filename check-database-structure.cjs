const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function checkDatabaseStructure() {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados MariaDB');
    
    // 1. Verificar estrutura da tabela service_orders
    console.log('\n📋 Verificando estrutura da tabela service_orders...');
    const [serviceOrdersColumns] = await connection.execute(`
      DESCRIBE service_orders
    `);
    
    console.log('\nColunas da tabela service_orders:');
    serviceOrdersColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.Key ? `[${col.Key}]` : ''}`);
    });
    
    // Verificar se maintenance_type_id existe
    const hasMaintenanceTypeId = serviceOrdersColumns.some(col => col.Field === 'maintenance_type_id');
    console.log(`\n🔍 Campo maintenance_type_id existe: ${hasMaintenanceTypeId ? '✅ SIM' : '❌ NÃO'}`);
    
    // 2. Verificar se tabela maintenance_types existe
    console.log('\n📋 Verificando se tabela maintenance_types existe...');
    try {
      const [maintenanceTypesColumns] = await connection.execute(`
        DESCRIBE maintenance_types
      `);
      
      console.log('\n✅ Tabela maintenance_types encontrada!');
      console.log('Colunas da tabela maintenance_types:');
      maintenanceTypesColumns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${col.Key ? `[${col.Key}]` : ''}`);
      });
      
      // Verificar dados na tabela maintenance_types
      const [maintenanceTypesData] = await connection.execute(`
        SELECT id, name, isActive FROM maintenance_types WHERE isActive = 1
      `);
      
      console.log(`\n📊 Tipos de manutenção ativos encontrados: ${maintenanceTypesData.length}`);
      maintenanceTypesData.forEach(type => {
        console.log(`  - ID: ${type.id}, Nome: ${type.name}`);
      });
      
    } catch (error) {
      console.log('❌ Tabela maintenance_types NÃO encontrada!');
      console.log('Erro:', error.message);
    }
    
    // 3. Verificar chaves estrangeiras da tabela service_orders
    console.log('\n🔗 Verificando chaves estrangeiras da tabela service_orders...');
    const [foreignKeys] = await connection.execute(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'service_orders' 
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    console.log('Chaves estrangeiras encontradas:');
    if (foreignKeys.length === 0) {
      console.log('  - Nenhuma chave estrangeira encontrada');
    } else {
      foreignKeys.forEach(fk => {
        console.log(`  - ${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });
    }
    
    // 4. Verificar se há dados na tabela service_orders
    console.log('\n📊 Verificando dados na tabela service_orders...');
    const [serviceOrdersCount] = await connection.execute(`
      SELECT COUNT(*) as total FROM service_orders
    `);
    
    console.log(`Total de ordens de serviço: ${serviceOrdersCount[0].total}`);
    
    if (serviceOrdersCount[0].total > 0) {
      // Verificar se há dados no campo maintenance_type_id
      if (hasMaintenanceTypeId) {
        const [maintenanceTypeIdUsage] = await connection.execute(`
          SELECT 
            COUNT(*) as total,
            COUNT(maintenance_type_id) as with_type_id,
            COUNT(DISTINCT maintenance_type_id) as distinct_type_ids
          FROM service_orders
        `);
        
        console.log(`Registros com maintenance_type_id preenchido: ${maintenanceTypeIdUsage[0].with_type_id}/${maintenanceTypeIdUsage[0].total}`);
        console.log(`IDs de tipos distintos: ${maintenanceTypeIdUsage[0].distinct_type_ids}`);
      }
    }
    
    console.log('\n✅ Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura do banco:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkDatabaseStructure();