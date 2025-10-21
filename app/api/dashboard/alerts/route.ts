import { NextRequest, NextResponse } from 'next/server'
import mysql from 'mysql2/promise'
import rateLimiter from '@/lib/rate-limiter.js';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
};

export async function GET(request: NextRequest) {
  // Aplicar rate limiting
  const rateLimitResult = rateLimiter.apiMiddleware('/api/dashboard/alerts')(request, NextResponse)
  if (!rateLimitResult) {
    return // Rate limit excedido, resposta já enviada
  }
  
  let connection;
  
  try {
    connection = await mysql.createConnection(dbConfig);
    
    console.log('🔄 [DASHBOARD-ALERTS] Iniciando busca de alertas...');
    
    // Get critical alerts - simplified query
    const [alertsRows] = await connection.execute(`
      SELECT 
        a.id,
        a.tipo as alert_type,
        a.prioridade as priority,
        a.descricao as description,
        a.data_vencimento as due_date,
        a.status,
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
        END
      LIMIT 10
    `);
    
    console.log('📊 [DASHBOARD-ALERTS] Alertas encontrados:', alertsRows.length);
    
    // Transform data for frontend consumption
    const alerts = (alertsRows as any[]).map(alert => {
      const dueDate = new Date(alert.due_date);
      const today = new Date();
      const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      return {
        id: alert.id,
        type: alert.alert_type,
        priority: alert.priority,
        description: alert.description,
        dueDate: alert.due_date,
        daysOverdue: daysOverdue,
        status: alert.status,
        equipment: {
          name: alert.equipment_name || 'N/A',
          code: alert.equipment_code || 'N/A',
        },
        sector: alert.sector_name || 'N/A',
      };
    });
    
    // Get alert statistics - simplified
    const statistics = {
      total: alerts.length,
      highPriority: alerts.filter(a => a.priority === 'ALTA').length,
      mediumPriority: alerts.filter(a => a.priority === 'MEDIA').length,
      lowPriority: alerts.filter(a => a.priority === 'BAIXA').length,
      overdue: alerts.filter(a => a.daysOverdue > 0).length,
    };
    
    console.log('📊 [DASHBOARD-ALERTS] Estatísticas:', statistics);
    
    const response = {
      alerts,
      statistics,
    };
    
    console.log('✅ [DASHBOARD-ALERTS] Alertas carregados com sucesso');
    return NextResponse.json(response);
    
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