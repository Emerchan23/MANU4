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
    
    // Get dashboard metrics from the view
    const [metricsRows] = await connection.execute(
      'SELECT * FROM dashboard_metrics'
    );
    
    const metrics = metricsRows[0] as any;
    
    // Get additional metrics for charts
    const [monthlyStatsRows] = await connection.execute(
      'SELECT * FROM monthly_maintenance_stats LIMIT 6'
    );
    
    const [costAnalysisRows] = await connection.execute(
      'SELECT * FROM cost_analysis_by_sector LIMIT 5'
    );
    
    const [companyPerformanceRows] = await connection.execute(
      'SELECT * FROM company_maintenance_performance LIMIT 5'
    );
    
    const response = {
      metrics: {
        equipmentsActive: metrics?.equipments_active || 0,
        pendingMaintenances: metrics?.pending_maintenances || 0,
        criticalAlerts: metrics?.critical_alerts || 0,
        openServiceOrders: metrics?.open_service_orders || 0,
      },
      charts: {
        monthlyStats: monthlyStatsRows,
        costAnalysis: costAnalysisRows,
        companyPerformance: companyPerformanceRows,
      },
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard metrics' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}