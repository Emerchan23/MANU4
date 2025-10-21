import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database.js'
import rateLimiter from '@/lib/rate-limiter.js'
import healthCheck from '@/lib/health-check.js'
import cacheManager from '@/lib/cache-manager.js';

export async function GET(request: NextRequest) {
  console.log('🔄 [DASHBOARD-METRICS] Iniciando requisição...');
  
  try {
    // Aplicar rate limiting
    const rateLimitResult = rateLimiter.apiMiddleware('/api/dashboard/metrics')(request, NextResponse)
    if (!rateLimitResult) {
      console.log('🚫 [DASHBOARD-METRICS] Rate limit excedido');
      return NextResponse.json({ error: 'Rate limit excedido' }, { status: 429 })
    }
    
    // Verificar health check
    if (!healthCheck.shouldAllowRequest()) {
      console.log('🚫 [DASHBOARD-METRICS] Health check falhou');
      return NextResponse.json({
        error: 'Sistema temporariamente indisponível',
        status: healthCheck.getStats().status
      }, { status: 503 })
    }
    
    console.log('✅ [DASHBOARD-METRICS] Rate limit e health check OK');
  } catch (middlewareError) {
    console.error('❌ [DASHBOARD-METRICS] Erro no middleware:', middlewareError);
    // Continuar mesmo com erro no middleware
  }
  
  // Tentar obter do cache primeiro
  try {
    const cachedResult = await cacheManager.getDashboardMetrics(async () => {
      
      try {
    
    console.log('🔄 [DASHBOARD-METRICS] Iniciando busca de métricas...');
    
    // Get active equipment count
    const equipmentRows = await query(
      'SELECT COUNT(*) as count FROM equipment WHERE status = "ativo"'
    );
    const activeEquipment = equipmentRows[0]?.count || 0;
    
    // Get pending maintenances count
    const maintenanceRows = await query(
      'SELECT COUNT(*) as count FROM maintenance_schedules WHERE status IN ("AGENDADO", "PENDENTE")'
    );
    const pendingMaintenances = maintenanceRows[0]?.count || 0;
    
    // Get open service orders count
    const serviceOrderRows = await query(
      'SELECT COUNT(*) as count FROM service_orders WHERE status IN ("ABERTA", "EM_ANDAMENTO")'
    );
    const openServiceOrders = serviceOrderRows[0]?.count || 0;
    
    // Get critical alerts count
    const alertsRows = await query(
      'SELECT COUNT(*) as count FROM alerts WHERE status = "ATIVO" AND prioridade = "ALTA"'
    );
    const criticalAlerts = alertsRows[0]?.count || 0;
    
    console.log('📊 [DASHBOARD-METRICS] Métricas coletadas:', {
      activeEquipment,
      pendingMaintenances,
      openServiceOrders,
      criticalAlerts
    });
    
    // Get monthly maintenance statistics with sample data (formato correto para o frontend)
    const monthlyStatsRows = [
      { month: 'Jan', total_scheduled: 15, overdue: 3, completed: 12, pending: 0 },
      { month: 'Fev', total_scheduled: 18, overdue: 2, completed: 16, pending: 0 },
      { month: 'Mar', total_scheduled: 22, overdue: 4, completed: 18, pending: 0 },
      { month: 'Abr', total_scheduled: 20, overdue: 1, completed: 19, pending: 0 },
      { month: 'Mai', total_scheduled: 25, overdue: 5, completed: 20, pending: 0 },
      { month: 'Jun', total_scheduled: 28, overdue: 3, completed: 25, pending: 0 },
    ];

    // Get cost analysis by sector with sample data (formato correto para o frontend)
    const costAnalysisRows = [
      { sector_name: 'UTI', total_estimated_cost: 15000, total_maintenances: 12 },
      { sector_name: 'Centro Cirúrgico', total_estimated_cost: 12000, total_maintenances: 8 },
      { sector_name: 'Emergência', total_estimated_cost: 8000, total_maintenances: 6 },
      { sector_name: 'Radiologia', total_estimated_cost: 10000, total_maintenances: 10 },
      { sector_name: 'Laboratório', total_estimated_cost: 7500, total_maintenances: 5 },
    ];

    // Get equipment performance by sector with sample data (formato correto para o frontend)
    const performanceRows = [
      { company_name: 'TechMed Solutions', completion_rate: 95, total_schedules: 25 },
      { company_name: 'MedEquip Service', completion_rate: 88, total_schedules: 18 },
      { company_name: 'Hospital Tech', completion_rate: 92, total_schedules: 22 },
      { company_name: 'BioMed Maintenance', completion_rate: 90, total_schedules: 20 },
      { company_name: 'EquipCare Pro', completion_rate: 85, total_schedules: 15 },
    ];
    
    const response = {
      metrics: {
        activeEquipment: activeEquipment || 0,
        equipmentsActive: activeEquipment || 0, // Frontend compatibility
        pendingMaintenances: pendingMaintenances || 0,
        openServiceOrders: openServiceOrders || 0,
        criticalAlerts: criticalAlerts || 0,
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
        return response;
        
      } catch (error) {
        console.error('❌ [DASHBOARD-METRICS] Erro no banco:', error);
        throw error;
      }
    });
    
    return NextResponse.json(cachedResult);
    
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