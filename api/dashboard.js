import express from 'express'
import { query } from '../lib/database.js'
// Authentication removed - direct access allowed

const router = express.Router()

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Get equipment count
    const equipmentResult = await query('SELECT COUNT(*) as total FROM equipment WHERE status = "ativo"')
    const totalEquipment = equipmentResult[0].total

    // Get service orders statistics
    const openOrdersResult = await query(`
      SELECT COUNT(*) as total 
      FROM service_orders 
      WHERE status IN ('aberta', 'em_andamento', 'aprovada')
    `)
    const openOrders = openOrdersResult[0].total

    // Get completed orders today
    const completedTodayResult = await query(`
      SELECT COUNT(*) as total 
      FROM service_orders 
      WHERE status = 'concluida' 
      AND DATE(completion_date) = CURDATE()
    `)
    const completedToday = completedTodayResult[0].total

    // Get active notifications count
    const notificationsResult = await query(`
      SELECT COUNT(*) as total 
      FROM notifications 
      WHERE read_status = 0
    `)
    const activeNotifications = notificationsResult[0].total

    // Get equipment needing maintenance (next 30 days)
    const maintenanceAlertsResult = await query(`
      SELECT COUNT(*) as total 
      FROM equipment 
      WHERE next_preventive_maintenance IS NOT NULL 
      AND next_preventive_maintenance <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      AND status = 'ativo'
    `)
    const maintenanceAlerts = maintenanceAlertsResult[0].total

    // Calculate changes (mock data for now - would need historical data)
    const stats = {
      totalEquipment: {
        value: totalEquipment,
        change: '+2%',
        changeType: 'positive'
      },
      openOrders: {
        value: openOrders,
        change: openOrders > 10 ? '-5%' : '+3%',
        changeType: openOrders > 10 ? 'negative' : 'positive'
      },
      activeAlerts: {
        value: maintenanceAlerts,
        change: maintenanceAlerts > 5 ? '+2' : '0',
        changeType: maintenanceAlerts > 5 ? 'neutral' : 'positive'
      },
      completedToday: {
        value: completedToday,
        change: '+8%',
        changeType: 'positive'
      },
      notifications: {
        value: activeNotifications,
        change: activeNotifications > 0 ? '+' + activeNotifications : '0',
        changeType: activeNotifications > 0 ? 'neutral' : 'positive'
      }
    }

    res.json(stats)
  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Endpoint de ordens recentes removido: funcionalidade descontinuada

// Get priority alerts
router.get('/priority-alerts', async (req, res) => { // Authentication removed
  try {
    const alerts = await query(`
      SELECT 
        e.id,
        e.name as equipment_name,
        e.model,
        e.next_preventive_maintenance as next_maintenance_date,
        s.nome as sector_name,
        DATEDIFF(e.next_preventive_maintenance, CURDATE()) as days_until_maintenance,
        CASE 
          WHEN DATEDIFF(e.next_preventive_maintenance, CURDATE()) <= 7 THEN 'Alta'
          WHEN DATEDIFF(e.next_preventive_maintenance, CURDATE()) <= 30 THEN 'Média'
          ELSE 'Baixa'
        END as priority
      FROM equipment e
      LEFT JOIN setores s ON e.sector_id = s.id
      WHERE e.next_preventive_maintenance IS NOT NULL 
      AND e.next_preventive_maintenance <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      AND e.status = 'ativo'
      ORDER BY e.next_preventive_maintenance ASC
      LIMIT 10
    `)

    const formattedAlerts = alerts.map(alert => ({
      id: alert.id,
      equipment: `${alert.equipment_name} ${alert.model || ''}`.trim(),
      sector: alert.sector_name || 'Setor não especificado',
      priority: alert.priority,
      daysUntil: alert.days_until_maintenance,
      maintenanceDate: alert.next_maintenance_date
    }))

    res.json(formattedAlerts)
  } catch (error) {
    console.error('Erro ao buscar alertas prioritários:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date()
  const past = new Date(date)
  const diffInMs = now - past
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInDays > 0) {
    return `${diffInDays}d atrás`
  } else if (diffInHours > 0) {
    return `${diffInHours}h atrás`
  } else {
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
    return `${diffInMinutes}min atrás`
  }
}

export default router