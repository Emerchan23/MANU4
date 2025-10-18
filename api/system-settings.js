import express from 'express'
import { query, queryDirect } from '../lib/database.js'

const router = express.Router()

// Get all system settings
router.get('/', async (req, res) => {
  try {
    console.log('🔍 [API] Buscando configurações globais do sistema...')
    
    const settings = await query(`
      SELECT setting_key, setting_value, description, category 
      FROM system_settings 
      WHERE category = 'personalization'
      ORDER BY setting_key
    `)

    console.log('📊 [API] Configurações encontradas:', settings.length)
    res.json(settings)
  } catch (error) {
    console.error('❌ [API] Erro ao buscar configurações do sistema:', error)
    res.status(500).json({ 
      error: 'Erro ao buscar configurações do sistema',
      details: error.message 
    })
  }
})

// Get specific system setting by key
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params
    console.log(`🔍 [API] Buscando configuração específica: ${key}`)
    
    const setting = await query(`
      SELECT setting_key, setting_value, description, category 
      FROM system_settings 
      WHERE setting_key = ?
    `, [key])

    if (setting.length === 0) {
      return res.status(404).json({ error: 'Configuração não encontrada' })
    }

    res.json(setting[0])
  } catch (error) {
    console.error('❌ [API] Erro ao buscar configuração específica:', error)
    res.status(500).json({ 
      error: 'Erro ao buscar configuração',
      details: error.message 
    })
  }
})

// Update system settings (bulk update)
router.put('/', async (req, res) => {
  try {
    const { settings } = req.body
    console.log('🔄 [API] Atualizando configurações globais:', settings)

    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({ 
        error: 'Formato inválido. Esperado: { settings: [{ key, value }, ...] }' 
      })
    }

    // Process settings without transaction for MariaDB compatibility
    for (const setting of settings) {
      const { key, value } = setting
      
      if (!key || value === undefined) {
        return res.status(400).json({ 
          error: `Configuração inválida: ${JSON.stringify(setting)}` 
        })
      }

      console.log(`📝 [API] Atualizando ${key} = ${value}`)

      // Check if setting exists
      const existing = await query(`
        SELECT id FROM system_settings 
        WHERE setting_key = ? AND category = 'personalization'
      `, [key])

      if (existing.length === 0) {
        // Insert new setting using direct connection
        await queryDirect(`
          INSERT INTO system_settings (setting_key, setting_value, category, description)
          VALUES (?, ?, 'personalization', ?)
        `, [key, value, `Configuração de personalização: ${key}`])
        console.log(`✅ [API] Nova configuração criada: ${key}`)
      } else {
        // Update existing setting using direct connection
        await queryDirect(`
          UPDATE system_settings 
          SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
          WHERE setting_key = ? AND category = 'personalization'
        `, [value, key])
        console.log(`✅ [API] Configuração atualizada: ${key}`)
      }
    }

    console.log('🎉 [API] Todas as configurações foram salvas com sucesso!')

    res.json({
      success: true,
      message: 'Configurações atualizadas com sucesso',
      updated_count: settings.length
    })
  } catch (error) {
    console.error('❌ [API] Erro ao atualizar configurações:', error)
    res.status(500).json({ 
      error: 'Erro ao atualizar configurações do sistema',
      details: error.message 
    })
  }
})

// Update single system setting
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params
    const { value } = req.body
    
    console.log(`🔄 [API] Atualizando configuração individual: ${key} = ${value}`)

    if (value === undefined) {
      return res.status(400).json({ error: 'Valor da configuração é obrigatório' })
    }

    // Check if setting exists
    const existing = await query(`
      SELECT id FROM system_settings 
      WHERE setting_key = ? AND category = 'personalization'
    `, [key])

    if (existing.length === 0) {
      // Insert new setting using direct connection
      const result = await queryDirect(`
        INSERT INTO system_settings (setting_key, setting_value, category, description)
        VALUES (?, ?, 'personalization', ?)
      `, [key, value, `Configuração de personalização: ${key}`])
      
      res.status(201).json({
        id: result.insertId,
        message: 'Nova configuração criada com sucesso'
      })
    } else {
      // Update existing setting using direct connection
      await queryDirect(`
        UPDATE system_settings 
        SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE setting_key = ? AND category = 'personalization'
      `, [value, key])
      
      res.json({
        success: true,
        message: 'Configuração atualizada com sucesso'
      })
    }
  } catch (error) {
    console.error('❌ [API] Erro ao atualizar configuração individual:', error)
    res.status(500).json({ 
      error: 'Erro ao atualizar configuração',
      details: error.message 
    })
  }
})

// Reset system settings to defaults
router.post('/reset', async (req, res) => {
  try {
    console.log('🔄 [API] Resetando configurações para padrões...')
    
    const defaultSettings = [
      { key: 'primary_color', value: '#3b82f6' },
      { key: 'interface_density', value: 'comfortable' },
      { key: 'border_radius', value: '10' },
      { key: 'animations_enabled', value: 'true' },
      { key: 'sidebar_compact', value: 'false' },
      { key: 'show_breadcrumbs', value: 'true' },
      { key: 'high_contrast', value: 'false' }
    ]

    // Process default settings without transaction for MariaDB compatibility
    for (const setting of defaultSettings) {
      // Check if setting exists
      const existing = await query(`
        SELECT id FROM system_settings 
        WHERE setting_key = ? AND category = 'personalization'
      `, [setting.key])

      if (existing.length === 0) {
        // Insert new setting using direct connection
        await queryDirect(`
          INSERT INTO system_settings (setting_key, setting_value, category, description)
          VALUES (?, ?, 'personalization', ?)
        `, [setting.key, setting.value, `Configuração de personalização: ${setting.key}`])
      } else {
        // Update existing setting using direct connection
        await queryDirect(`
          UPDATE system_settings 
          SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
          WHERE setting_key = ? AND category = 'personalization'
        `, [setting.value, setting.key])
      }
    }

    console.log('✅ [API] Configurações resetadas para padrões!')

    res.json({
      success: true,
      message: 'Configurações resetadas para os valores padrão',
      defaults: defaultSettings
    })
  } catch (error) {
    console.error('❌ [API] Erro ao resetar configurações:', error)
    res.status(500).json({ 
      error: 'Erro ao resetar configurações',
      details: error.message 
    })
  }
})

export default router