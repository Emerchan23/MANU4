import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
};

export async function GET(request: NextRequest) {
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Get critical alerts from the view
    const [alertsRows] = await connection.execute(
      'SELECT * FROM critical_alerts_view LIMIT 10'
    );
    
    // Transform data for frontend consumption
    const alerts = (alertsRows as any[]).map(alert => ({
      id: alert.id,
      type: alert.alert_type,
      priority: alert.priority,
      description: alert.description,
      dueDate: alert.data_vencimento,
      daysOverdue: alert.dias_atraso,
      status: alert.status,
      equipment: {
        name: alert.equipment_name,
        code: alert.equipment_code,
      },
      sector: alert.sector_name,
    }));
    
    // Get alert statistics
    const [statsRows] = await connection.execute(`
      SELECT 
        COUNT(*) as total_alerts,
        SUM(CASE WHEN prioridade = 'ALTA' THEN 1 ELSE 0 END) as high_priority,
        SUM(CASE WHEN prioridade = 'MEDIA' THEN 1 ELSE 0 END) as medium_priority,
        SUM(CASE WHEN prioridade = 'BAIXA' THEN 1 ELSE 0 END) as low_priority,
        SUM(CASE WHEN dias_atraso > 0 THEN 1 ELSE 0 END) as overdue_alerts
      FROM alerts 
      WHERE status = 'ATIVO'
    `);
    
    const stats = statsRows[0] as any;
    
    return NextResponse.json({
      alerts,
      statistics: {
        total: stats.total_alerts || 0,
        highPriority: stats.high_priority || 0,
        mediumPriority: stats.medium_priority || 0,
        lowPriority: stats.low_priority || 0,
        overdue: stats.overdue_alerts || 0,
      },
    });
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}