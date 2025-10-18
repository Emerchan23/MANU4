import express from 'express'
import { query } from '../lib/database.js'

const router = express.Router()

// Get user settings
router.get('/', async (req, res) => {
  try {
    // Authentication removed - using default user ID
    const userId = req.query.user_id || 1

    const settings = await query(`
      SELECT * FROM user_settings 
      WHERE user_id = ?
    `, [userId])

    if (settings.length === 0) {
      // Return default settings if none exist
      const defaultSettings = {
        user_id: userId,
        theme: 'light',
        language: 'pt-BR',
        notifications_enabled: true,
        email_notifications: true,
        dashboard_layout: 'default',
        items_per_page: 10,
        timezone: 'America/Sao_Paulo'
      }
      res.json(defaultSettings)
    } else {
      res.json(settings[0])
    }
  } catch (error) {
    console.error('Get user settings error:', error)
    res.status(500).json({ error: 'Erro ao buscar configurações do usuário' })
  }
})

// Get settings by user ID
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    const settings = await query(`
      SELECT * FROM user_settings 
      WHERE user_id = ?
    `, [userId])

    if (settings.length === 0) {
      return res.status(404).json({ error: 'Configurações não encontradas' })
    }

    res.json(settings[0])
  } catch (error) {
    console.error('Get user settings by ID error:', error)
    res.status(500).json({ error: 'Erro ao buscar configurações do usuário' })
  }
})

// Update user settings
router.put('/', async (req, res) => {
  try {
    const userId = req.body.user_id || 1
    const {
      theme,
      language,
      notifications_enabled,
      email_notifications,
      dashboard_layout,
      items_per_page,
      timezone
    } = req.body

    // Check if settings exist
    const existing = await query('SELECT id FROM user_settings WHERE user_id = ?', [userId])

    if (existing.length === 0) {
      // Create new settings
      const result = await query(`
        INSERT INTO user_settings (
          user_id, theme, language, notifications_enabled, 
          email_notifications, dashboard_layout, items_per_page, timezone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        theme || 'light',
        language || 'pt-BR',
        notifications_enabled !== undefined ? notifications_enabled : true,
        email_notifications !== undefined ? email_notifications : true,
        dashboard_layout || 'default',
        items_per_page || 10,
        timezone || 'America/Sao_Paulo'
      ])

      res.status(201).json({
        id: result.insertId,
        message: 'Configurações criadas com sucesso'
      })
    } else {
      // Update existing settings
      const updateFields = []
      const updateValues = []

      if (theme !== undefined) {
        updateFields.push('theme = ?')
        updateValues.push(theme)
      }

      if (language !== undefined) {
        updateFields.push('language = ?')
        updateValues.push(language)
      }

      if (notifications_enabled !== undefined) {
        updateFields.push('notifications_enabled = ?')
        updateValues.push(notifications_enabled)
      }

      if (email_notifications !== undefined) {
        updateFields.push('email_notifications = ?')
        updateValues.push(email_notifications)
      }

      if (dashboard_layout !== undefined) {
        updateFields.push('dashboard_layout = ?')
        updateValues.push(dashboard_layout)
      }

      if (items_per_page !== undefined) {
        updateFields.push('items_per_page = ?')
        updateValues.push(items_per_page)
      }

      if (timezone !== undefined) {
        updateFields.push('timezone = ?')
        updateValues.push(timezone)
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar' })
      }

      updateFields.push('updated_at = NOW()')
      updateValues.push(userId)

      await query(`
        UPDATE user_settings SET ${updateFields.join(', ')}
        WHERE user_id = ?
      `, updateValues)

      res.json({ message: 'Configurações atualizadas com sucesso' })
    }
  } catch (error) {
    console.error('Update user settings error:', error)
    res.status(500).json({ error: 'Erro ao atualizar configurações do usuário' })
  }
})

// Reset user settings to default
router.post('/reset', async (req, res) => {
  try {
    const userId = req.body.user_id || 1

    await query(`
      UPDATE user_settings SET 
        theme = 'light',
        language = 'pt-BR',
        notifications_enabled = true,
        email_notifications = true,
        dashboard_layout = 'default',
        items_per_page = 10,
        timezone = 'America/Sao_Paulo',
        updated_at = NOW()
      WHERE user_id = ?
    `, [userId])

    res.json({ message: 'Configurações resetadas para o padrão' })
  } catch (error) {
    console.error('Reset user settings error:', error)
    res.status(500).json({ error: 'Erro ao resetar configurações do usuário' })
  }
})

export default router