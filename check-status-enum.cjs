const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'hospital_maintenance'
};

async function checkMaintenanceSchedulesStatus() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado com sucesso!');

    // Verificar estrutura da tabela maintenance_schedules
    console.log('\n📋 Verificando estrutura da tabela maintenance_schedules...');
    const [columns] = await connection.execute(`
      SHOW COLUMNS FROM maintenance_schedules
    `);
    
    console.log('\n📊 Colunas da tabela maintenance_schedules:');
    columns.forEach(column => {
      console.log(`- ${column.Field}: ${column.Type} (Default: ${column.Default})`);
    });

    // Verificar especificamente o campo status
    const statusColumn = columns.find(col => col.Field === 'status');
    if (statusColumn) {
      console.log('\n🎯 Campo status encontrado:');
      console.log(`- Tipo: ${statusColumn.Type}`);
      console.log(`- Default: ${statusColumn.Default}`);
      console.log(`- Null: ${statusColumn.Null}`);
    } else {
      console.log('\n❌ Campo status não encontrado na tabela!');
    }

    // Verificar registros existentes e seus status
    console.log('\n📊 Verificando registros existentes...');
    const [schedules] = await connection.execute(`
      SELECT id, equipment_id, status, created_at 
      FROM maintenance_schedules 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('\n📋 Últimos 10 agendamentos:');
    schedules.forEach(schedule => {
      console.log(`- ID: ${schedule.id}, Status: ${schedule.status}, Criado em: ${schedule.created_at}`);
    });

    // Verificar valores únicos de status
    console.log('\n🔍 Valores únicos de status na tabela:');
    const [statusValues] = await connection.execute(`
      SELECT DISTINCT status, COUNT(*) as count 
      FROM maintenance_schedules 
      GROUP BY status
    `);
    
    statusValues.forEach(item => {
      console.log(`- ${item.status}: ${item.count} registros`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão fechada.');
    }
  }
}

checkMaintenanceSchedulesStatus();