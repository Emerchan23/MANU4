import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database.js'
import rateLimiter from '@/lib/rate-limiter.js'
import healthCheck from '@/lib/health-check.js'
import cacheManager from '@/lib/cache-manager.js';

export async function GET(request: NextRequest) {
  console.log('🔄 [DASHBOARD-METRICS] Iniciando requisição...');
  
  // Buscar dados diretamente do banco (sem cache para debug)
  try {
    console.log('🔄 [DASHBOARD-METRICS] Buscando dados diretamente do banco...');
    
    console.log('🔄 [DASHBOARD-METRICS] Iniciando busca de métricas...');
    
    // Get active equipment count - usar is_active = 1 como na API de equipamentos
    const equipmentRows = await query(
      'SELECT COUNT(*) as count FROM equipment WHERE is_active = 1'
    );
    const activeEquipment = equipmentRows[0]?.count || 0;
    
    // Get pending maintenances count
    const maintenanceRows = await query(
      'SELECT COUNT(*) as count FROM maintenance_schedules WHERE status IN ("AGENDADO", "PENDENTE")'
    );
    const pendingMaintenances = maintenanceRows[0]?.count || 0;
    
    // Get open service orders count - incluir todas as ordens (não apenas abertas)
    const serviceOrderRows = await query(
      'SELECT COUNT(*) as count FROM service_orders'
    );
    const openServiceOrders = serviceOrderRows[0]?.count || 0;
    
    // Get critical alerts count
    const alertsRows = await query(
      'SELECT COUNT(*) as count FROM alerts WHERE status = "ATIVO" AND prioridade = "ALTA"'
    );
    const criticalAlerts = alertsRows[0]?.count || 0;
    
    // Get upcoming appointments in next 30 days
    const upcomingRows = await query(`
      SELECT COUNT(*) as count 
      FROM maintenance_schedules 
      WHERE scheduled_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY)
      AND status IN ('AGENDADA', 'SCHEDULED', 'PENDENTE', 'PENDING')
    `);
    const upcomingAppointments = upcomingRows[0]?.count || 0;
    
    console.log('📊 [DASHBOARD-METRICS] Métricas coletadas:', {
      activeEquipment,
      pendingMaintenances,
      openServiceOrders,
      criticalAlerts,
      upcomingAppointments
    });
    
    // Get monthly maintenance statistics from database - usando service_orders para dados reais
    const monthlyStatsRows = await query(`
      SELECT 
        DATE_FORMAT(COALESCE(so.completion_date, so.created_at), '%b') as month,
        COUNT(DISTINCT so.id) as total_scheduled,
        SUM(CASE WHEN so.status IN ('ATRASADA', 'OVERDUE') THEN 1 ELSE 0 END) as overdue,
        SUM(CASE WHEN so.status IN ('CONCLUIDA', 'COMPLETED') THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN so.status IN ('AGENDADA', 'PENDENTE', 'SCHEDULED', 'PENDING', 'EM_ANDAMENTO', 'IN_PROGRESS') THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN so.status IN ('CONCLUIDA', 'COMPLETED') THEN COALESCE(so.actual_cost, so.estimated_cost, 0) ELSE 0 END) as completed_cost,
        SUM(CASE WHEN so.status IN ('ATRASADA', 'OVERDUE') THEN COALESCE(so.actual_cost, so.estimated_cost, 0) ELSE 0 END) as overdue_cost
      FROM service_orders so
      GROUP BY YEAR(COALESCE(so.completion_date, so.created_at)), MONTH(COALESCE(so.completion_date, so.created_at))
      ORDER BY COALESCE(so.completion_date, so.created_at) DESC
    `);

    // Get cost analysis by sector from database
    const costAnalysisRows = await query(`
      SELECT 
        s.name as sector_name,
        COALESCE(SUM(ms.estimated_cost), 0) as total_estimated_cost,
        COUNT(ms.id) as total_maintenances
      FROM sectors s
      LEFT JOIN equipment e ON e.sector_id = s.id
      LEFT JOIN maintenance_schedules ms ON ms.equipment_id = e.id
      WHERE s.active = 1
      GROUP BY s.id, s.name
      HAVING total_maintenances > 0
      ORDER BY total_estimated_cost DESC
      LIMIT 10
    `);

    // Get equipment performance by company from database
    const performanceRows = await query(`
      SELECT 
        c.name as company_name,
        ROUND(
          (SUM(CASE WHEN ms.status IN ('CONCLUIDA', 'COMPLETED') THEN 1 ELSE 0 END) * 100.0) / 
          NULLIF(COUNT(ms.id), 0), 
          0
        ) as completion_rate,
        COUNT(ms.id) as total_schedules
      FROM companies c
      LEFT JOIN maintenance_schedules ms ON ms.company_id = c.id
      WHERE c.active = 1
      GROUP BY c.id, c.name
      HAVING total_schedules > 0
      ORDER BY completion_rate DESC
      LIMIT 10
    `);
    
    const response = {
      metrics: {
        activeEquipment: activeEquipment || 0,
        equipmentsActive: activeEquipment || 0, // Frontend compatibility
        pendingMaintenances: pendingMaintenances || 0,
        openServiceOrders: openServiceOrders || 0,
        criticalAlerts: criticalAlerts || 0,
        upcomingAppointments: upcomingAppointments || 0,
      },
      charts: {
        monthlyStats: monthlyStatsRows,
        costAnalysis: costAnalysisRows,
        companyPerformance: performanceRows,
      },
      monthlyStats: monthlyStatsRows,
      costAnalysis: costAnalysisRows,
      performance: performanceRows,
    };
    
    console.log('✅ [DASHBOARD-METRICS] Métricas carregadas com sucesso');
    console.log('📊 [DASHBOARD-METRICS] Estrutura da resposta:', JSON.stringify(response, null, 2));
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ [DASHBOARD-METRICS] Erro geral:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}