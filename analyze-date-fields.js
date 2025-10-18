import mysql from 'mysql2/promise';

async function analyzeDateFields() {
  console.log('🔍 Analisando campos de data no banco MariaDB...');
  
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_maintenance',
    port: process.env.DB_PORT || 3306,
  };

  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco MariaDB');

    // Obter todas as tabelas
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`\n📋 Analisando ${tables.length} tabelas...\n`);

    const dateFields = [];

    for (const tableRow of tables) {
      const tableName = Object.values(tableRow)[0];
      
      try {
        // Obter estrutura da tabela
        const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
      
      const tableDateFields = columns.filter(col => {
        const fieldName = col.Field.toLowerCase();
        const fieldType = col.Type.toLowerCase();
        
        // Identificar campos de data por tipo ou nome
        return fieldType.includes('date') || 
               fieldType.includes('time') || 
               fieldType.includes('timestamp') ||
               fieldName.includes('date') ||
               fieldName.includes('data') ||
               fieldName.includes('created_at') ||
               fieldName.includes('updated_at') ||
               fieldName.includes('scheduled') ||
               fieldName.includes('completion') ||
               fieldName.includes('due') ||
               fieldName.includes('expiry') ||
               fieldName.includes('start') ||
               fieldName.includes('end') ||
               fieldName.includes('vencimento') ||
               fieldName.includes('abertura') ||
               fieldName.includes('conclusao');
      });

      if (tableDateFields.length > 0) {
        console.log(`📅 Tabela: ${tableName}`);
        tableDateFields.forEach(field => {
          console.log(`   - ${field.Field} (${field.Type}) ${field.Null === 'YES' ? '[NULL]' : '[NOT NULL]'} ${field.Default ? `[DEFAULT: ${field.Default}]` : ''}`);
          dateFields.push({
            table: tableName,
            field: field.Field,
            type: field.Type,
            nullable: field.Null === 'YES',
            default: field.Default
          });
        });
        console.log('');
      }
    } catch (error) {
      console.log(`⚠️ Pulando ${tableName} (provavelmente uma view): ${error.message}`);
    }
    }

    console.log(`\n📊 RESUMO: Encontrados ${dateFields.length} campos de data em ${tables.length} tabelas\n`);

    // Agrupar por tipo de campo
    const fieldsByType = {};
    dateFields.forEach(field => {
      if (!fieldsByType[field.type]) {
        fieldsByType[field.type] = [];
      }
      fieldsByType[field.type].push(field);
    });

    console.log('📋 CAMPOS POR TIPO:');
    Object.keys(fieldsByType).forEach(type => {
      console.log(`\n${type.toUpperCase()}:`);
      fieldsByType[type].forEach(field => {
        console.log(`   ${field.table}.${field.field}`);
      });
    });

    // Verificar dados de exemplo para entender o formato atual
    console.log('\n🔍 VERIFICANDO FORMATOS DE DATA ATUAIS:\n');
    
    const sampleTables = ['service_orders', 'preventive_maintenances', 'equipment', 'companies'];
    
    for (const tableName of sampleTables) {
      const tableFields = dateFields.filter(f => f.table === tableName);
      if (tableFields.length > 0) {
        try {
          const fieldNames = tableFields.map(f => f.field).join(', ');
          const [sampleData] = await connection.execute(`SELECT ${fieldNames} FROM ${tableName} LIMIT 3`);
          
          if (sampleData.length > 0) {
            console.log(`📋 ${tableName}:`);
            sampleData.forEach((row, index) => {
              console.log(`   Registro ${index + 1}:`);
              tableFields.forEach(field => {
                const value = row[field.field];
                console.log(`     ${field.field}: ${value} (${typeof value})`);
              });
            });
            console.log('');
          }
        } catch (error) {
          console.log(`❌ Erro ao consultar ${tableName}: ${error.message}`);
        }
      }
    }

    await connection.end();
    console.log('🔌 Conexão fechada.');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (connection) {
      await connection.end();
    }
  }
}

analyzeDateFields();