import { query } from './database.js'
import { createNotification } from '../api/notifications.js'

// Check for overdue service orders
async function checkOverdueServiceOrders() {
  try {
    // Get service orders that are overdue
    const serviceOrders = await query(`
      SELECT so.*, e.name as equipment_name, e.sector_id,
             DATEDIFF(CURDATE(), so.scheduled_date) as days_overdue
      FROM service_orders so
      LEFT JOIN equipment e ON so.equipment_id = e.id
      WHERE so.status IN ('aberta', 'em_andamento')
        AND so.scheduled_date < CURDATE()
    `)

    for (const so of serviceOrders) {
      // Get users from the equipment's sector  
      const users = await query("SELECT id FROM users WHERE sector_id = ? AND active = 1", [so.sector_id])

      if (users.length > 0) {
        const userIds = users.map((user) => user.id)
        const title = "Ordem de Serviço Atrasada"
        const message = `A ordem de serviço ${so.order_number} para o equipamento "${so.equipment_name}" está atrasada há ${so.days_overdue} dia(s).`

        await createNotificationsForUsers(userIds, title, message, "servico_atrasado", so.id, "service_order")
      }
    }

    console.log(`Checked ${serviceOrders.length} overdue service orders`)
  } catch (error) {
    console.error("Check overdue service orders error:", error)
  }
}

// Run all notification checks
async function runNotificationChecks() {
  console.log("Running notification checks...")
  await checkOverdueServiceOrders()
  console.log("Notification checks completed")
}

// Schedule notification checks to run every hour
function startNotificationScheduler() {
  // Run immediately
  runNotificationChecks()

  // Then run every hour
  setInterval(runNotificationChecks, 60 * 60 * 1000)

  console.log("Notification scheduler started")
}

export {
  checkOverdueServiceOrders,
  runNotificationChecks,
  startNotificationScheduler,
}
