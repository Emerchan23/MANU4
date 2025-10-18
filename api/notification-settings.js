import express from 'express'
import { query } from '../lib/database.js'
// import { requireAuth } from '../lib/auth.js' // Authentication removed

const router = express.Router()

// Get user notification settings
router.get('/', async (req, res) => { // Authentication removed
  try {
    const userId = 1 // Authentication removed - hardcoded user ID
    
    const result = await query(
      'SELECT setting_value FROM user_settings WHERE user_id = ? AND setting_key = ?',
      [userId, 'notification-settings']
    )
    
    if (result.length === 0) {
      // Return default settings in component format
      const defaultSettings = {
        pushEnabled: true,
        maintenanceAlerts: true,
        criticalEquipmentAlerts: true,
        overdueMaintenanceAlerts: true,
        calibrationReminders: true,
        systemAlerts: false
      }
      
      res.json(defaultSettings)
    } else {
      // Convert stored format to component format
      const storedSettings = JSON.parse(result[0].setting_value)
      const componentSettings = {
        pushEnabled: storedSettings.pushNotifications !== undefined ? storedSettings.pushNotifications : true,
        maintenanceAlerts: storedSettings.maintenanceAlerts !== undefined ? storedSettings.maintenanceAlerts : true,
        criticalEquipmentAlerts: storedSettings.equipmentFailures !== undefined ? storedSettings.equipmentFailures : true,
        overdueMaintenanceAlerts: storedSettings.preventiveMaintenance !== undefined ? storedSettings.preventiveMaintenance : true,
        calibrationReminders: storedSettings.calibrationReminders !== undefined ? storedSettings.calibrationReminders : true,
        systemAlerts: storedSettings.systemAlerts !== undefined ? storedSettings.systemAlerts : false
      }
      res.json(componentSettings)
    }
  } catch (error) {
    console.error('Error fetching notification settings:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

// Save user notification settings
router.post('/', async (req, res) => { // Authentication removed
  try {
    const userId = 1 // Authentication removed - hardcoded user ID
    const { settings } = req.body
    
    // Validate required fields from component format
    const requiredFields = [
      'pushEnabled',
      'maintenanceAlerts',
      'criticalEquipmentAlerts',
      'overdueMaintenanceAlerts',
      'calibrationReminders',
      'systemAlerts'
    ]
    
    for (const field of requiredFields) {
      if (settings[field] === undefined) {
        return res.status(400).json({ error: `Campo obrigatório: ${field}` })
      }
    }
    
    // Convert component format to storage format
    const storageSettings = {
      pushNotifications: settings.pushEnabled,
      emailNotifications: false,
      smsNotifications: false,
      maintenanceAlerts: settings.maintenanceAlerts,
      equipmentFailures: settings.criticalEquipmentAlerts,
      preventiveMaintenance: settings.overdueMaintenanceAlerts,
      serviceOrderUpdates: settings.maintenanceAlerts,
      systemAlerts: settings.systemAlerts,
      calibrationReminders: settings.calibrationReminders,
      frequency: 'immediate',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    }
    
    // Check if settings already exist
    const existingSettings = await query(
      'SELECT id FROM user_settings WHERE user_id = ? AND setting_key = ?',
      [userId, 'notification-settings']
    )
    
    if (existingSettings.length > 0) {
      // Update existing settings
      await query(
        'UPDATE user_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND setting_key = ?',
        [JSON.stringify(storageSettings), userId, 'notification-settings']
      )
    } else {
      // Insert new settings
      await query(
        'INSERT INTO user_settings (user_id, setting_key, setting_value) VALUES (?, ?, ?)',
        [userId, 'notification-settings', JSON.stringify(storageSettings)]
      )
    }
    
    console.log(`Notification settings saved for user ${userId}:`, storageSettings)
    
    res.json({ 
      success: true, 
      message: 'Configurações de notificação salvas com sucesso',
      settings: settings
    })
    
  } catch (error) {
    console.error('Error saving notification settings:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  }
})

export default router