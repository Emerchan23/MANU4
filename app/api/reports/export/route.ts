import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hospital_maintenance',
  charset: 'utf8mb4',
  timezone: '+00:00'
};

// Função para executar queries
async function query(sql: string, params: any[] = []) {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [results] = await connection.execute(sql, params);
    return results;
  } finally {
    await connection.end();
  }
}

export async function POST(request: NextRequest) {
  try {
    const { reportType, dateRange = '30', sectorId, format = 'pdf' } = await request.json();

    // Calcular data de início baseada no range
    const daysAgo = parseInt(dateRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    const endDate = new Date();

    // Filtro de setor
    const sectorFilter = sectorId && sectorId !== 'ALL' ? 'AND e.sector_id = ?' : '';
    const sectorParams = sectorId && sectorId !== 'ALL' ? [sectorId] : [];

    let reportData: any = {};
    let reportTitle = '';

    switch (reportType) {
      case 'maintenance-period':
        reportTitle = 'Relatório de Manutenções por Período';
        
        // Query para buscar dados de manutenções
        const maintenanceQuery = `
          SELECT 
            so.id,
            so.order_number,
            so.description,
            so.priority,
            so.status,
            so.requested_date,
            so.scheduled_date,
            so.completion_date,
            so.cost,
            e.name as equipment_name,
            e.model as equipment_model,
            s.nome as sector_name,
            u.name as technician_name
          FROM service_orders so
          LEFT JOIN equipment e ON so.equipment_id = e.id
          LEFT JOIN setores s ON e.sector_id = s.id
          LEFT JOIN users u ON so.assigned_to = u.id
          WHERE so.requested_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
          ${sectorFilter}
          ORDER BY so.requested_date DESC
        `;
        
        const maintenanceData = await query(maintenanceQuery, [parseInt(dateRange), ...sectorParams]);
        
        // Estatísticas resumidas
        const maintenanceStats = {
          total: maintenanceData.length,
          concluidas: maintenanceData.filter((m: any) => m.status === 'concluida').length,
          custoTotal: maintenanceData.reduce((sum: number, m: any) => sum + (m.cost || 0), 0)
        };

        reportData = {
          title: reportTitle,
          period: `Últimos ${dateRange} dias`,
          sector: sectorId === 'ALL' ? 'Todos os setores' : `Setor ${sectorId}`,
          maintenances: maintenanceData,
          summary: maintenanceStats
        };
        break;

      case 'equipment-costs':
        reportTitle = 'Relatório de Custos por Equipamento';
        
        const costQuery = `
          SELECT 
            e.id,
            e.name as equipment_name,
            e.patrimony_number,
            e.model,
            s.nome as sector_name,
            COUNT(so.id) as total_maintenances,
            COALESCE(SUM(so.cost), 0) as total_cost,
            COALESCE(AVG(so.cost), 0) as avg_cost
          FROM equipment e
          LEFT JOIN service_orders so ON e.id = so.equipment_id 
            AND so.requested_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
          LEFT JOIN setores s ON e.sector_id = s.id
          ${sectorFilter}
          GROUP BY e.id, e.name, e.patrimony_number, e.model, s.nome
          ORDER BY total_cost DESC
        `;
        
        const costData = await query(costQuery, [parseInt(dateRange), ...sectorParams]);
        
        const costStats = {
          totalEquipments: costData.length,
          totalCost: costData.reduce((sum: number, e: any) => sum + parseFloat(e.total_cost || 0), 0),
          avgCostPerEquipment: costData.length > 0 ? 
            costData.reduce((sum: number, e: any) => sum + parseFloat(e.total_cost || 0), 0) / costData.length : 0,
          equipmentWithHighestCost: costData[0]?.equipment_name || 'N/A'
        };

        reportData = {
          title: reportTitle,
          period: `Últimos ${dateRange} dias`,
          sector: sectorId === 'ALL' ? 'Todos os setores' : `Setor ${sectorId}`,
          equipment: costData,
          summary: {
            totalEquipment: costData.length,
            totalCost: costData.reduce((sum: number, e: any) => sum + parseFloat(e.total_cost || 0), 0),
            avgCostPerEquipment: costData.length > 0 ? 
              costData.reduce((sum: number, e: any) => sum + parseFloat(e.total_cost || 0), 0) / costData.length : 0,
            mostExpensive: costData[0]?.equipment_name || 'N/A'
          }
        };
        break;

      case 'technician-performance':
        reportTitle = 'Relatório de Performance de Técnicos';
        
        const technicianQuery = `
          SELECT 
            u.id,
            u.name as technician_name,
            u.nick as email,
            COUNT(so.id) as total_orders,
            COUNT(CASE WHEN so.status = 'concluida' THEN 1 END) as completed_orders,
            COUNT(CASE WHEN so.status IN ('aberta', 'em_andamento') THEN 1 END) as open_orders,
            COALESCE(SUM(so.cost), 0) as total_cost,
            COALESCE(AVG(DATEDIFF(so.completion_date, so.requested_date)), 0) as avg_resolution_days,
            COUNT(CASE WHEN so.priority = 'alta' THEN 1 END) as high_priority_orders
          FROM users u
          LEFT JOIN service_orders so ON u.id = so.assigned_to 
            AND so.requested_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
          WHERE u.profile IN ('admin', 'gestor', 'usuario')
          GROUP BY u.id, u.name, u.nick
          HAVING total_orders > 0
          ORDER BY completed_orders DESC, avg_resolution_days ASC
        `;
        
        const technicianRows = await query(technicianQuery, [parseInt(dateRange)]);
        
        reportData = {
          title: reportTitle,
          period: `Últimos ${dateRange} dias`,
          sector: sectorId === 'ALL' ? 'Todos os setores' : `Setor ${sectorId}`,
          technicians: technicianRows,
          summary: {
            totalTechnicians: technicianRows.length,
            totalOrders: technicianRows.reduce((sum: number, t: any) => sum + t.total_orders, 0),
            completedOrders: technicianRows.reduce((sum: number, t: any) => sum + t.completed_orders, 0),
            avgCompletionDays: technicianRows.reduce((sum: number, t: any) => sum + (t.avg_completion_days || 0), 0) / technicianRows.length || 0
          }
        };
        break;

      case 'sla-indicators':
        reportTitle = 'Relatório de Indicadores de SLA';
        
        // Buscar dados de SLA
        const slaQuery = `
          SELECT 
            so.id,
            so.order_number,
            so.priority,
            so.status,
            so.requested_date,
            so.scheduled_date,
            so.completion_date,
            e.name as equipment_name,
            s.nome as sector_name,
            CASE 
              WHEN so.status = 'concluida' AND so.completion_date <= so.scheduled_date THEN 'No Prazo'
              WHEN so.status = 'concluida' AND so.completion_date > so.scheduled_date THEN 'Atrasado'
              WHEN so.status != 'concluida' AND NOW() > so.scheduled_date THEN 'Em Atraso'
              ELSE 'No Prazo'
            END as sla_status,
            CASE 
              WHEN so.status = 'concluida' THEN DATEDIFF(so.completion_date, so.scheduled_date)
              ELSE DATEDIFF(NOW(), so.scheduled_date)
            END as days_difference
          FROM service_orders so
          LEFT JOIN equipment e ON so.equipment_id = e.id
          LEFT JOIN setores s ON e.sector_id = s.id
          WHERE so.requested_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
          ${sectorFilter}
          ORDER BY so.requested_date DESC
        `;
        
        const slaData = await query(slaQuery, [parseInt(dateRange), ...sectorParams]);
        
        const slaStats = {
          totalOrders: slaData.length,
          onTime: slaData.filter((s: any) => s.sla_status === 'NO_PRAZO').length,
          delayed: slaData.filter((s: any) => s.sla_status === 'ATRASADO').length,
          slaCompliance: slaData.length > 0 ? 
            (slaData.filter((s: any) => s.sla_status === 'NO_PRAZO').length / slaData.length) * 100 : 0,
          avgDelayDays: slaData.length > 0 ? 
            slaData.reduce((sum: number, s: any) => sum + Math.max(0, s.days_difference || 0), 0) / slaData.length : 0
        };

        reportData = {
          title: reportTitle,
          period: `Últimos ${dateRange} dias`,
          sector: sectorId === 'ALL' ? 'Todos os setores' : `Setor ${sectorId}`,
          orders: slaData,
          summary: {
            totalOrders: slaData.length,
            onTime: slaData.filter((o: any) => o.sla_status === 'No Prazo').length,
            delayed: slaData.filter((o: any) => o.sla_status === 'Atrasado' || o.sla_status === 'Em Atraso').length,
            slaCompliance: slaData.length > 0 ? 
              (slaData.filter((o: any) => o.sla_status === 'No Prazo').length / slaData.length) * 100 : 0,
            avgDelayDays: slaData.filter((o: any) => o.days_difference > 0)
              .reduce((sum: number, o: any) => sum + o.days_difference, 0) / 
              slaData.filter((o: any) => o.days_difference > 0).length || 0
          }
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Tipo de relatório não suportado' },
          { status: 400 }
        );
    }

    // Gerar PDF real usando o novo sistema
    try {
      const pdfResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/pdf/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'reports',
          data: {
            title: reportTitle,
            subtitle: `${reportData.period} - ${reportData.sector}`,
            data: reportData[Object.keys(reportData).find(key => Array.isArray(reportData[key])) || 'data'] || [],
            summary: reportData.summary,
            filters: {
              'Período': reportData.period,
              'Setor': reportData.sector,
              'Tipo': reportTitle
            },
            reportType: reportType
          }
        })
      });

      if (!pdfResponse.ok) {
        throw new Error('Erro ao gerar PDF');
      }

      const pdfResult = await pdfResponse.json();
      
      return NextResponse.json({
        success: true,
        fileName: pdfResult.fileName,
        downloadUrl: pdfResult.downloadUrl,
        fileSize: pdfResult.fileSize,
        message: `Relatório ${reportTitle} gerado com sucesso`
      });
    } catch (pdfError) {
      console.error('Erro ao gerar PDF:', pdfError);
      
      // Fallback para simulação se PDF falhar
      const fileName = `${reportType}_${dateRange}dias_${Date.now()}.${format}`;
      
      return NextResponse.json({
        success: true,
        fileName,
        reportData,
        downloadUrl: `/api/reports/download/${fileName}`,
        message: `Relatório ${reportTitle} gerado com sucesso (modo simulação)`
      });
    }

  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor ao gerar relatório' },
      { status: 500 }
    );
  }
}