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
        s.name as sector_name,
        u.full_name as assigned_user_name,
        ms.estimated_cost
      FROM maintenance_schedules ms
      LEFT JOIN equipment e ON ms.equipment_id = e.id
      LEFT JOIN sectors s ON e.sector_id = s.id
      LEFT JOIN users u ON ms.assigned_user_id = u.id
      WHERE ms.scheduled_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY)
      AND ms.status IN ('AGENDADA', 'SCHEDULED', 'PENDENTE', 'PENDING')
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
      assignedUser: schedule.assigned_user_name || 'Não atribuído',
      company: 'Hospital',
      estimatedCost: schedule.estimated_cost || 0,
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