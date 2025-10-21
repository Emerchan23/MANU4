const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance',
  charset: 'utf8mb4'
};

async function verifyTables() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    
    // Lista de tabelas que a API usa
    const tables = ['maintenance_schedules', 'equipment', 'users', 'companies', 'maintenance_plans'];
    
    console.log('\n📋 Verificando existência das tabelas...');
    
    for (const table of tables) {
      try {
        const [rows] = await connection.execute(`SHOW TABLES LIKE '${table}'`);
        if (rows.length > 0) {
          console.log(`✅ Tabela '${table}' existe`);
          
          // Verificar estrutura da tabela
          const [columns] = await connection.execute(`DESCRIBE ${table}`);
          console.log(`   Colunas da tabela '${table}':`);
          columns.forEach(col => {
            console.log(`   - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? col.Key : ''}`);
          });
          console.log('');
        } else {
          console.log(`❌ Tabela '${table}' NÃO existe`);
        }
      } catch (error) {
        console.log(`❌ Erro ao verificar tabela '${table}':`, error.message);
      }
    }
    
    // Testar uma query simples na tabela maintenance_schedules
    console.log('\n🧪 Testando query na tabela maintenance_schedules...');
    try {
      const [result] = await connection.execute('SELECT COUNT(*) as count FROM maintenance_schedules');
      console.log(`✅ Query executada com sucesso. Total de registros: ${result[0].count}`);
    } catch (error) {
      console.log('❌ Erro ao executar query na tabela maintenance_schedules:', error.message);
    }
    
    // Testar a query completa da API (simplificada)
    console.log('\n🧪 Testando query completa da API...');
    try {
      const query = `
        SELECT 
          ms.id,
          ms.equipment_id,
          ms.maintenance_type,
          ms.description,
          ms.scheduled_date,
          ms.status,
          e.name as equipment_name,
          u.full_name as assigned_user_name,
          c.name as company_name,
          mp.name as maintenance_plan_name
        FROM maintenance_schedules ms
        LEFT JOIN equipment e ON ms.equipment_id = e.id
        LEFT JOIN users u ON ms.assigned_user_id = u.id
        LEFT JOIN companies c ON ms.company_id = c.id
        LEFT JOIN maintenance_plans mp ON ms.maintenance_plan_id = mp.id
        LIMIT 5
      `;
      
      const [result] = await connection.execute(query);
      console.log(`✅ Query completa executada com sucesso. Registros retornados: ${result.length}`);
      
      if (result.length > 0) {
        console.log('📄 Exemplo de registro:');
        console.log(JSON.stringify(result[0], null, 2));
      }
    } catch (error) {
      console.log('❌ Erro ao executar query completa:', error.message);
      console.log('Stack trace:', error.stack);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada');
    }
  }
}

verifyTables();