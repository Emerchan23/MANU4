import mysql from 'mysql2/promise';

(async () => {
  try {
    console.log('Conectando ao banco de dados...');
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hospital_maintenance'
    });
    
    console.log('Verificando tabelas existentes...');
    const [tables] = await connection.execute(
      `SELECT TABLE_NAME 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = 'hospital_maintenance' 
       AND (TABLE_NAME LIKE 'dashboard_%' OR TABLE_NAME IN ('kpi_metrics', 'trend_data', 'heatmap_data'))`
    );
    
    if (tables.length > 0) {
      console.log('✅ Tabelas do dashboard já existem:');
      tables.forEach(table => console.log(`  - ${table.TABLE_NAME}`));
    } else {
      console.log('Criando tabelas básicas...');
      
      // Criar tabelas uma por vez
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS kpi_metrics (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          metric_name VARCHAR(100) NOT NULL,
          value DECIMAL(15,4) NOT NULL,
          unit VARCHAR(20),
          category VARCHAR(50) NOT NULL,
          metadata JSON DEFAULT ('{}'),
          recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS dashboard_alerts (
          id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
          alert_type VARCHAR(50) NOT NULL,
          title VARCHAR(200) NOT NULL,
          message TEXT NOT NULL,
          severity VARCHAR(20) DEFAULT 'medium',
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ Tabelas básicas criadas!');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
})();