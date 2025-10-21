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
    
    console.log('🔄 [DASHBOARD-CALENDAR] Iniciando busca de agendamentos...');
    
    // Get upcoming maintenance schedules - simplified query
    const [schedulesRows] = await connection.execute(`
      SELECT 
        ms.id,
        ms.scheduled_date,
        ms.priority,
        ms.status,
        ms.description,
        ms.assigned_user_id,
        e.id as equipment_id,
        e.name as equipment_name,
        e.code as equipment_code,
        s.name as sector_name
      FROM maintenance_schedules ms
      LEFT JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN sectors s ON e.sector_id = s.id
      WHERE ms.scheduled_date >= CURDATE()
      AND ms.scheduled_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      ORDER BY ms.scheduled_date ASC
      LIMIT 20
    `);
    
    console.log('📊 [DASHBOARD-CALENDAR] Agendamentos encontrados:', schedulesRows.length);
    
    // Transform data for calendar format
    const events = (schedulesRows as any[]).map(schedule => ({
      id: schedule.id,
      title: `Manutenção - ${schedule.equipment_name || 'Equipamento'}`,
      date: schedule.scheduled_date,
      equipment: {
        id: schedule.equipment_id,
        name: schedule.equipment_name || 'N/A',
        code: schedule.equipment_code || 'N/A',
      },
      priority: schedule.priority || 'MEDIA',
      status: schedule.status || 'SCHEDULED',
      sector: schedule.sector_name || 'N/A',
      description: schedule.description || '',
    }));
    
    const response = {
      events,
      totalEvents: events.length,
    };
    
    console.log('✅ [DASHBOARD-CALENDAR] Agendamentos carregados com sucesso');
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}