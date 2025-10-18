import express from 'express'
import { query } from '../lib/database.js'
// Authentication removed - direct access allowed
const router = express.Router();

// Authentication removed - direct access to all routes

// GET /api/reports/stats - Estatísticas gerais para relatórios
router.get('/stats', async (req, res) => {
  try {
    const { dateRange = '30', sectorId } = req.query;
    
    // Calcular data de início baseada no range
    const daysAgo = parseInt(dateRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    
    // Query base com filtro de setor se especificado
    const sectorFilter = sectorId && sectorId !== 'ALL' ? 'AND e.sector_id = ?' : '';
    const sectorParam = sectorId && sectorId !== 'ALL' ? [sectorId] : [];
    
    // Ordens concluídas no período
    const completedOrdersQuery = `
      SELECT COUNT(*) as count
      FROM service_orders so
      JOIN equipment e ON so.equipment_id = e.id
      WHERE so.status = 'completed'
      AND so.updated_at >= ?
      ${sectorFilter}
    `;
    
    // Custo total no período
    const totalCostQuery = `
      SELECT COALESCE(SUM(so.cost), 0) as total
      FROM service_orders so
      JOIN equipment e ON so.equipment_id = e.id
      WHERE so.status = 'completed'
      AND so.updated_at >= ?
      ${sectorFilter}
    `;
    
    // Tempo médio de resolução
    const avgTimeQuery = `
      SELECT AVG(DATEDIFF(so.updated_at, so.created_at)) as avg_days
      FROM service_orders so
      JOIN equipment e ON so.equipment_id = e.id
      WHERE so.status = 'completed'
      AND so.updated_at >= ?
      ${sectorFilter}
    `;
    
    // SLA cumprido (ordens concluídas dentro do prazo)
    const slaQuery = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN DATEDIFF(so.updated_at, so.created_at) <= 3 THEN 1 ELSE 0 END) as on_time_orders
      FROM service_orders so
      JOIN equipment e ON so.equipment_id = e.id
      WHERE so.status = 'completed'
      AND so.updated_at >= ?
      ${sectorFilter}
    `;
    
    const params = [startDate.toISOString().split('T')[0], ...sectorParam];
    
    const completedOrders = await query(completedOrdersQuery, params);
    const totalCost = await query(totalCostQuery, params);
    const avgTime = await query(avgTimeQuery, params);
    const slaData = await query(slaQuery, params);
    
    // Calcular período anterior para comparação
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - daysAgo);
    const prevEndDate = new Date(startDate);
    
    const prevParams = [prevStartDate.toISOString().split('T')[0], prevEndDate.toISOString().split('T')[0], ...sectorParam];
    
    // Dados do período anterior para comparação
    const prevCompletedQuery = completedOrdersQuery.replace('AND so.updated_at >= ?', 'AND so.updated_at >= ? AND so.updated_at < ?');
    const prevCostQuery = totalCostQuery.replace('AND so.updated_at >= ?', 'AND so.updated_at >= ? AND so.updated_at < ?');
    
    const prevCompleted = await query(prevCompletedQuery, prevParams);
    const prevCost = await query(prevCostQuery, prevParams);
    
    // Calcular mudanças percentuais
    const completedChange = prevCompleted[0].count > 0 
      ? ((completedOrders[0].count - prevCompleted[0].count) / prevCompleted[0].count * 100).toFixed(1)
      : '0';
    
    const costChange = prevCost[0].total > 0
      ? ((totalCost[0].total - prevCost[0].total) / prevCost[0].total * 100).toFixed(1)
      : '0';
    
    const slaPercentage = slaData[0].total_orders > 0
      ? ((slaData[0].on_time_orders / slaData[0].total_orders) * 100).toFixed(1)
      : '0';
    
    const avgDays = avgTime[0].avg_days ? parseFloat(avgTime[0].avg_days).toFixed(1) : '0';
    
    const stats = [
      {
        name: "Ordens Concluídas",
        value: completedOrders[0].count.toString(),
        change: `${completedChange >= 0 ? '+' : ''}${completedChange}%`,
        changeType: completedChange >= 0 ? "positive" : "negative"
      },
      {
        name: "Custo Total",
        value: `R$ ${parseFloat(totalCost[0].total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        change: `${costChange >= 0 ? '+' : ''}${costChange}%`,
        changeType: costChange <= 0 ? "positive" : "negative" // Menor custo é melhor
      },
      {
        name: "Tempo Médio",
        value: `${avgDays} dias`,
        change: "N/A",
        changeType: "neutral"
      },
      {
        name: "SLA Cumprido",
        value: `${slaPercentage}%`,
        change: "N/A",
        changeType: slaPercentage >= 90 ? "positive" : "negative"
      }
    ];
    
    res.json({ stats });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de relatórios:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/reports/maintenance-chart - Dados para gráfico de manutenções
router.get('/maintenance-chart', async (req, res) => {
  try {
    const { dateRange = '30', sectorId } = req.query;
    const daysAgo = parseInt(dateRange);
    
    const sectorFilter = sectorId && sectorId !== 'ALL' ? 'AND e.sector_id = ?' : '';
    const sectorParam = sectorId && sectorId !== 'ALL' ? [sectorId] : [];
    
    const queryStr = `
      SELECT 
        DATE(so.created_at) as date,
        so.status as type,
        COUNT(*) as count
      FROM service_orders so
      JOIN equipment e ON so.equipment_id = e.id
      WHERE so.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ${sectorFilter}
      GROUP BY DATE(so.created_at), so.status
      ORDER BY date DESC
    `;
    
    const results = await query(queryStr, [daysAgo, ...sectorParam]);
    
    res.json({ data: results });
  } catch (error) {
    console.error('Erro ao buscar dados do gráfico de manutenções:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/reports/cost-chart - Dados para gráfico de custos
router.get('/cost-chart', async (req, res) => {
  try {
    const { dateRange = '30', sectorId } = req.query;
    const daysAgo = parseInt(dateRange);
    
    const sectorFilter = sectorId && sectorId !== 'ALL' ? 'AND e.sector_id = ?' : '';
    const sectorParam = sectorId && sectorId !== 'ALL' ? [sectorId] : [];
    
    const queryStr = `
      SELECT 
        DATE(so.updated_at) as date,
        SUM(so.cost) as total_cost,
        COUNT(*) as order_count
      FROM service_orders so
      JOIN equipment e ON so.equipment_id = e.id
      WHERE so.status = 'completed'
      AND so.updated_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ${sectorFilter}
      GROUP BY DATE(so.updated_at)
      ORDER BY date DESC
    `;
    
    const results = await query(queryStr, [daysAgo, ...sectorParam]);
    
    res.json({ data: results });
  } catch (error) {
    console.error('Erro ao buscar dados do gráfico de custos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/reports/sector-performance - Performance por setor
router.get('/sector-performance', async (req, res) => {
  try {
    const { dateRange = '30' } = req.query;
    const daysAgo = parseInt(dateRange);
    
    const queryStr = `
      SELECT 
        s.name as sector_name,
        COUNT(so.id) as total_orders,
        SUM(CASE WHEN so.status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
        AVG(CASE WHEN so.status = 'completed' THEN DATEDIFF(so.updated_at, so.created_at) END) as avg_resolution_time,
        SUM(CASE WHEN so.status = 'completed' THEN so.cost ELSE 0 END) as total_cost
      FROM sectors s
      LEFT JOIN equipment e ON s.id = e.sector_id
      LEFT JOIN service_orders so ON e.id = so.equipment_id 
        AND so.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY s.id, s.name
      ORDER BY total_orders DESC
    `;
    
    const results = await query(queryStr, [daysAgo]);
    
    const data = results.map(row => ({
      sector: row.sector_name,
      totalOrders: row.total_orders || 0,
      completedOrders: row.completed_orders || 0,
      completionRate: row.total_orders > 0 ? ((row.completed_orders / row.total_orders) * 100).toFixed(1) : '0',
      avgResolutionTime: row.avg_resolution_time ? parseFloat(row.avg_resolution_time).toFixed(1) : '0',
      totalCost: parseFloat(row.total_cost || 0)
    }));
    
    res.json({ data });
  } catch (error) {
    console.error('Erro ao buscar performance por setor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/reports/equipment-status - Status dos equipamentos
router.get('/equipment-status', async (req, res) => {
  try {
    const queryStr = `
      SELECT 
        e.status,
        COUNT(*) as count
      FROM equipment e
      GROUP BY e.status
    `;
    
    const results = await query(queryStr);
    
    res.json({ data: results });
  } catch (error) {
    console.error('Erro ao buscar status dos equipamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/reports/priority-alerts - Alertas prioritários
router.get('/priority-alerts', async (req, res) => {
  try {
    const queryStr = `
      SELECT 
        e.name as equipment,
        s.name as sector,
        'Manutenção Vencida' as type,
        'ALTA' as priority,
        DATEDIFF(CURDATE(), e.last_maintenance) as days_overdue
      FROM equipment e
      JOIN sectors s ON e.sector_id = s.id
      WHERE e.last_maintenance IS NOT NULL
      AND DATEDIFF(CURDATE(), e.last_maintenance) > 365
      
      UNION ALL
      
      SELECT 
        e.name as equipment,
        s.name as sector,
        'Calibração Pendente' as type,
        CASE 
          WHEN DATEDIFF(CURDATE(), e.last_calibration) > 180 THEN 'ALTA'
          WHEN DATEDIFF(CURDATE(), e.last_calibration) > 90 THEN 'MEDIA'
          ELSE 'BAIXA'
        END as priority,
        DATEDIFF(CURDATE(), e.last_calibration) as days_overdue
      FROM equipment e
      JOIN sectors s ON e.sector_id = s.id
      WHERE e.last_calibration IS NOT NULL
      AND DATEDIFF(CURDATE(), e.last_calibration) > 90
      
      ORDER BY 
        CASE priority 
          WHEN 'ALTA' THEN 1 
          WHEN 'MEDIA' THEN 2 
          ELSE 3 
        END,
        days_overdue DESC
      LIMIT 10
    `;
    
    const results = await query(queryStr);
    
    res.json({ alerts: results });
  } catch (error) {
    console.error('Erro ao buscar alertas prioritários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router