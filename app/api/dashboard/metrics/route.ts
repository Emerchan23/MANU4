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
    
    // Get pending maintenances count - corrigido para usar status real do banco
    const maintenanceRows = await query(
      'SELECT COUNT(*) as count FROM maintenance_schedules WHERE status = "AGENDADA"'
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
    
    // Get monthly maintenance statistics from database - últimos 6 meses para criar linha conectada
    const monthlyStatsRows = await query(`
      WITH months AS (
        SELECT 
          DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL n.n MONTH), '%b') as month,
          DATE_SUB(CURDATE(), INTERVAL n.n MONTH) as month_date
        FROM (
          SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
        ) n
      )
      SELECT 
        m.month,
        COALESCE(COUNT(DISTINCT so.id), 0) as total_scheduled,
        COALESCE(SUM(CASE WHEN so.status IN ('ATRASADA', 'OVERDUE') THEN 1 ELSE 0 END), 0) as overdue,
        COALESCE(SUM(CASE WHEN so.status IN ('CONCLUIDA', 'COMPLETED') THEN 1 ELSE 0 END), 0) as completed,
        COALESCE(SUM(CASE WHEN so.status IN ('AGENDADA', 'PENDENTE', 'SCHEDULED', 'PENDING', 'EM_ANDAMENTO', 'IN_PROGRESS') THEN 1 ELSE 0 END), 0) as pending,
        COALESCE(SUM(CASE WHEN so.status IN ('CONCLUIDA', 'COMPLETED') THEN COALESCE(so.actual_cost, so.estimated_cost, 0) ELSE 0 END), 0) as completed_cost,
        COALESCE(SUM(CASE WHEN so.status IN ('ATRASADA', 'OVERDUE') THEN COALESCE(so.actual_cost, so.estimated_cost, 0) ELSE 0 END), 0) as overdue_cost
      FROM months m
      LEFT JOIN service_orders so ON 
        YEAR(COALESCE(so.completion_date, so.created_at)) = YEAR(m.month_date) AND 
        MONTH(COALESCE(so.completion_date, so.created_at)) = MONTH(m.month_date)
      GROUP BY m.month, m.month_date
      ORDER BY m.month_date ASC
    `);

    // Get cost analysis by sector from database - usando service_orders para dados reais
    const costAnalysisRows = await query(`
      SELECT 
        s.name as sector_name,
        COALESCE(SUM(so.estimated_cost), 0) as total_estimated_cost,
        COUNT(so.id) as total_service_orders,
        COUNT(DISTINCT e.id) as total_equipments
      FROM sectors s
      LEFT JOIN equipment e ON e.sector_id = s.id AND e.is_active = 1
      LEFT JOIN service_orders so ON so.equipment_id = e.id
      WHERE s.active = 1
      GROUP BY s.id, s.name
      HAVING total_equipments > 0
      ORDER BY total_estimated_cost DESC
      LIMIT 10
    `);

    // Get equipment performance by company from database - usando service_orders
    const performanceRows = await query(`
      SELECT 
        c.name as company_name,
        ROUND(
          (SUM(CASE WHEN so.status IN ('CONCLUIDA', 'COMPLETED') THEN 1 ELSE 0 END) * 100.0) / 
          NULLIF(COUNT(so.id), 0), 
          0
        ) as completion_rate,
        COUNT(so.id) as total_schedules,
        COALESCE(SUM(so.estimated_cost), 0) as total_cost
      FROM companies c
      LEFT JOIN service_orders so ON so.company_id = c.id
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