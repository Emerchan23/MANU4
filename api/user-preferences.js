import express from 'express'
import { query } from '../lib/database.js'

const router = express.Router()

// Get user preferences
router.get('/', async (req, res) => {
  try {
    // Authentication removed - using default user ID
    const userId = req.query.user_id || 1

    const preferences = await query(`
      SELECT * FROM user_preferences 
      WHERE user_id = ?
    `, [userId])

    if (preferences.length === 0) {
      // Return default preferences if none exist
      const defaultPreferences = {
        user_id: userId,
        sidebar_collapsed: false,
        show_tooltips: true,
        auto_save: true,
        sound_notifications: false,
        compact_mode: false,
        show_grid_lines: true,
        default_view: 'list',
        quick_actions: JSON.stringify(['create_order', 'view_equipment', 'notifications']),
        favorite_filters: JSON.stringify([])
      }
      res.json(defaultPreferences)
    } else {
      // Parse JSON fields
      const pref = preferences[0]
      if (pref.quick_actions && typeof pref.quick_actions === 'string') {
        try {
          pref.quick_actions = JSON.parse(pref.quick_actions)
        } catch (e) {
          pref.quick_actions = []
        }
      }
      if (pref.favorite_filters && typeof pref.favorite_filters === 'string') {
        try {
          pref.favorite_filters = JSON.parse(pref.favorite_filters)
        } catch (e) {
          pref.favorite_filters = []
        }
      }
      res.json(pref)
    }
  } catch (error) {
    console.error('Get user preferences error:', error)
    res.status(500).json({ error: 'Erro ao buscar preferências do usuário' })
  }
})

// Get preferences by user ID
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    const preferences = await query(`
      SELECT * FROM user_preferences 
      WHERE user_id = ?
    `, [userId])

    if (preferences.length === 0) {
      return res.status(404).json({ error: 'Preferências não encontradas' })
    }

    // Parse JSON fields
    const pref = preferences[0]
    if (pref.quick_actions && typeof pref.quick_actions === 'string') {
      try {
        pref.quick_actions = JSON.parse(pref.quick_actions)
      } catch (e) {
        pref.quick_actions = []
      }
    }
    if (pref.favorite_filters && typeof pref.favorite_filters === 'string') {
      try {
        pref.favorite_filters = JSON.parse(pref.favorite_filters)
      } catch (e) {
        pref.favorite_filters = []
      }
    }

    res.json(pref)
  } catch (error) {
    console.error('Get user preferences by ID error:', error)
    res.status(500).json({ error: 'Erro ao buscar preferências do usuário' })
  }
})

// Update user preferences
router.put('/', async (req, res) => {
  try {
    const userId = req.body.user_id || 1
    const {
      sidebar_collapsed,
      show_tooltips,
      auto_save,
      sound_notifications,
      compact_mode,
      show_grid_lines,
      default_view,
      quick_actions,
      favorite_filters,
      // Personalization fields
      theme,
      language,
      notifications_enabled,
      dashboard_layout,
      primary_color,
      interface_size,
      border_radius,
      show_animations,
      compact_sidebar,
      show_breadcrumbs,
      high_contrast
    } = req.body

    // Check if preferences exist
    const existing = await query('SELECT id FROM user_preferences WHERE user_id = ?', [userId])

    if (existing.length === 0) {
      // Create new preferences
      const result = await query(`
        INSERT INTO user_preferences (
          user_id, sidebar_collapsed, show_tooltips, auto_save, 
          sound_notifications, compact_mode, show_grid_lines, 
          default_view, quick_actions, favorite_filters,
          theme, language, notifications_enabled, dashboard_layout,
          primary_color, interface_size, border_radius, show_animations,
          compact_sidebar, show_breadcrumbs, high_contrast
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId,
        sidebar_collapsed !== undefined ? sidebar_collapsed : false,
        show_tooltips !== undefined ? show_tooltips : true,
        auto_save !== undefined ? auto_save : true,
        sound_notifications !== undefined ? sound_notifications : false,
        compact_mode !== undefined ? compact_mode : false,
        show_grid_lines !== undefined ? show_grid_lines : true,
        default_view || 'list',
        quick_actions ? JSON.stringify(quick_actions) : JSON.stringify(['create_order', 'view_equipment', 'notifications']),
        favorite_filters ? JSON.stringify(favorite_filters) : JSON.stringify([]),
        theme || 'light',
        language || 'pt-BR',
        notifications_enabled !== undefined ? notifications_enabled : true,
        dashboard_layout ? JSON.stringify(dashboard_layout) : null,
        primary_color || 'blue',
        interface_size || 'comfortable',
        border_radius !== undefined ? border_radius : 10,
        show_animations !== undefined ? show_animations : true,
        compact_sidebar !== undefined ? compact_sidebar : false,
        show_breadcrumbs !== undefined ? show_breadcrumbs : true,
        high_contrast !== undefined ? high_contrast : false
      ])

      res.status(201).json({
        id: result.insertId,
        message: 'Preferências criadas com sucesso'
      })
    } else {
      // Update existing preferences
      const updateFields = []
      const updateValues = []

      if (sidebar_collapsed !== undefined) {
        updateFields.push('sidebar_collapsed = ?')
        updateValues.push(sidebar_collapsed)
      }

      if (show_tooltips !== undefined) {
        updateFields.push('show_tooltips = ?')
        updateValues.push(show_tooltips)
      }

      if (auto_save !== undefined) {
        updateFields.push('auto_save = ?')
        updateValues.push(auto_save)
      }

      if (sound_notifications !== undefined) {
        updateFields.push('sound_notifications = ?')
        updateValues.push(sound_notifications)
      }

      if (compact_mode !== undefined) {
        updateFields.push('compact_mode = ?')
        updateValues.push(compact_mode)
      }

      if (show_grid_lines !== undefined) {
        updateFields.push('show_grid_lines = ?')
        updateValues.push(show_grid_lines)
      }

      if (default_view !== undefined) {
        updateFields.push('default_view = ?')
        updateValues.push(default_view)
      }

      if (quick_actions !== undefined) {
        updateFields.push('quick_actions = ?')
        updateValues.push(JSON.stringify(quick_actions))
      }

      if (favorite_filters !== undefined) {
        updateFields.push('favorite_filters = ?')
        updateValues.push(JSON.stringify(favorite_filters))
      }

      // Personalization fields
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

      if (dashboard_layout !== undefined) {
        updateFields.push('dashboard_layout = ?')
        updateValues.push(JSON.stringify(dashboard_layout))
      }

      if (primary_color !== undefined) {
        updateFields.push('primary_color = ?')
        updateValues.push(primary_color)
      }

      if (interface_size !== undefined) {
        updateFields.push('interface_size = ?')
        updateValues.push(interface_size)
      }

      if (border_radius !== undefined) {
        updateFields.push('border_radius = ?')
        updateValues.push(border_radius)
      }

      if (show_animations !== undefined) {
        updateFields.push('show_animations = ?')
        updateValues.push(show_animations)
      }

      if (compact_sidebar !== undefined) {
        updateFields.push('compact_sidebar = ?')
        updateValues.push(compact_sidebar)
      }

      if (show_breadcrumbs !== undefined) {
        updateFields.push('show_breadcrumbs = ?')
        updateValues.push(show_breadcrumbs)
      }

      if (high_contrast !== undefined) {
        updateFields.push('high_contrast = ?')
        updateValues.push(high_contrast)
      }

      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar' })
      }

      updateFields.push('updated_at = NOW()')
      updateValues.push(userId)

      await query(`
        UPDATE user_preferences SET ${updateFields.join(', ')}
        WHERE user_id = ?
      `, updateValues)

      res.json({ message: 'Preferências atualizadas com sucesso' })
    }
  } catch (error) {
    console.error('Update user preferences error:', error)
    res.status(500).json({ error: 'Erro ao atualizar preferências do usuário' })
  }
})

// Reset user preferences to default
router.post('/reset', async (req, res) => {
  try {
    const userId = req.body.user_id || 1

    await query(`
      UPDATE user_preferences SET 
        sidebar_collapsed = false,
        show_tooltips = true,
        auto_save = true,
        sound_notifications = false,
        compact_mode = false,
        show_grid_lines = true,
        default_view = 'list',
        quick_actions = ?,
        favorite_filters = ?,
        updated_at = NOW()
      WHERE user_id = ?
    `, [
      JSON.stringify(['create_order', 'view_equipment', 'notifications']),
      JSON.stringify([]),
      userId
    ])

    res.json({ message: 'Preferências resetadas para o padrão' })
  } catch (error) {
    console.error('Reset user preferences error:', error)
    res.status(500).json({ error: 'Erro ao resetar preferências do usuário' })
  }
})

export default router