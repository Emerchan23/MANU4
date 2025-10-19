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
    
    // Get upcoming schedules from the view (next 7 days)
    const [upcomingRows] = await connection.execute(
      'SELECT * FROM upcoming_schedules ORDER BY scheduled_date ASC, priority DESC'
    );
    
    // Transform data for calendar format
    const calendarEvents = (upcomingRows as any[]).map(schedule => ({
      id: schedule.id,
      title: `${schedule.maintenance_type} - ${schedule.equipment_name}`,
      date: schedule.scheduled_date,
      priority: schedule.priority,
      status: schedule.status,
      equipment: {
        name: schedule.equipment_name,
        code: schedule.equipment_code,
      },
      sector: schedule.sector_name,
      assignedUser: schedule.assigned_user_name,
      company: schedule.company_name,
      estimatedCost: schedule.estimated_cost,
    }));
    
    return NextResponse.json({
      events: calendarEvents,
      totalEvents: calendarEvents.length,
    });
    
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