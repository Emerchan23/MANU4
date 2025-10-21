const mysql = require('mysql2/promise');

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
};

async function debugAlertsAPI() {
  let connection;
  
  try {
    console.log('🔄 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao banco de dados');
    
    console.log('\n🔄 Executando query de alertas...');
    
    // Execute the same query as the API
    const [alertsRows] = await connection.execute(`
      SELECT 
        a.id,
        a.tipo as alert_type,
        a.prioridade as priority,
        a.descricao as description,
        a.data_vencimento as due_date,
        a.status,
        a.data_criacao as created_at,
        e.name as equipment_name,
        e.code as equipment_code,
        s.name as sector_name
      FROM alerts a
      LEFT JOIN equipment e ON a.equipment_id = e.id
      LEFT JOIN sectors s ON e.sector_id = s.id
      WHERE a.status = 'ATIVO'
      ORDER BY 
        CASE a.prioridade 
          WHEN 'ALTA' THEN 1 
          WHEN 'MEDIA' THEN 2 
          WHEN 'BAIXA' THEN 3 
        END,
        a.created_at DESC
    `);
    
    console.log('📊 Total de alertas encontrados:', alertsRows.length);
    
    if (alertsRows.length > 0) {
      console.log('\n📋 Primeiro alerta encontrado:');
      console.log(JSON.stringify(alertsRows[0], null, 2));
      
      // Transform data like the API does
      const transformedAlert = {
        id: alertsRows[0].id,
        title: `${alertsRows[0].alert_type} - ${alertsRows[0].equipment_name || 'Equipamento'}`,
        description: alertsRows[0].description,
        priority: alertsRows[0].priority,
        equipment: alertsRows[0].equipment_name || 'N/A',
        code: alertsRows[0].equipment_code || 'N/A',
        created_at: alertsRows[0].created_at,
        status: alertsRows[0].status,
        sector: alertsRows[0].sector_name || 'N/A'
      };
      
      console.log('\n🔄 Alerta transformado:');
      console.log(JSON.stringify(transformedAlert, null, 2));
    } else {
      console.log('❌ Nenhum alerta encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

debugAlertsAPI();