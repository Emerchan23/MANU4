import express from 'express';
import mysql from 'mysql2/promise';
import dbConfig from '../config/database.js';

const router = express.Router();

// GET /api/notification-settings/:userId - Buscar configurações do usuário
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [settings] = await connection.execute(
      `SELECT notification_type, is_enabled, created_at, updated_at
       FROM notification_settings 
       WHERE user_id = ?
       ORDER BY notification_type`,
      [userId]
    );

    await connection.end();

    // Se não existem configurações, criar padrões
    if (settings.length === 0) {
      return res.json({
        success: true,
        data: {
          equipment_failure: true,
          maintenance_due: true,
          service_order_assigned: true,
          service_order_completed: true,
          system_alerts: true
        }
      });
    }

    // Converter array para objeto
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.notification_type] = setting.is_enabled === 1;
    });

    res.json({
      success: true,
      data: settingsObj
    });

  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/notification-settings/:userId - Atualizar configurações
router.put('/:userId', async (req, res) => {
  const { userId } = req.params;
  const settings = req.body;

  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'Configurações inválidas'
    });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Tipos de notificação válidos
    const validTypes = [
      'equipment_failure',
      'maintenance_due', 
      'service_order_assigned',
      'service_order_completed',
      'system_alerts'
    ];

    // Atualizar cada configuração
    for (const [type, enabled] of Object.entries(settings)) {
      if (!validTypes.includes(type)) {
        continue; // Ignorar tipos inválidos
      }

      const isEnabled = enabled ? 1 : 0;

      // Verificar se já existe
      const [existing] = await connection.execute(
        'SELECT id FROM notification_settings WHERE user_id = ? AND notification_type = ?',
        [userId, type]
      );

      if (existing.length > 0) {
        // Atualizar existente
        await connection.execute(
          'UPDATE notification_settings SET is_enabled = ?, updated_at = NOW() WHERE user_id = ? AND notification_type = ?',
          [isEnabled, userId, type]
        );
      } else {
        // Criar novo
        await connection.execute(
          'INSERT INTO notification_settings (user_id, notification_type, is_enabled, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
          [userId, type, isEnabled]
        );
      }
    }

    await connection.end();

    res.json({
      success: true,
      message: 'Configurações atualizadas com sucesso'
    });

  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/notification-settings/:userId/reset - Resetar para padrões
router.post('/:userId/reset', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Remover configurações existentes
    await connection.execute(
      'DELETE FROM notification_settings WHERE user_id = ?',
      [userId]
    );

    // Criar configurações padrão
    const defaultSettings = [
      { type: 'equipment_failure', enabled: 1 },
      { type: 'maintenance_due', enabled: 1 },
      { type: 'service_order_assigned', enabled: 1 },
      { type: 'service_order_completed', enabled: 1 },
      { type: 'system_alerts', enabled: 1 }
    ];

    for (const setting of defaultSettings) {
      await connection.execute(
        'INSERT INTO notification_settings (user_id, notification_type, is_enabled, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
        [userId, setting.type, setting.enabled]
      );
    }

    await connection.end();

    res.json({
      success: true,
      message: 'Configurações resetadas para padrão'
    });

  } catch (error) {
    console.error('Erro ao resetar configurações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/notification-settings/:userId/check/:type - Verificar se tipo está habilitado
router.get('/:userId/check/:type', async (req, res) => {
  const { userId, type } = req.params;
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const [settings] = await connection.execute(
      'SELECT is_enabled FROM notification_settings WHERE user_id = ? AND notification_type = ?',
      [userId, type]
    );

    await connection.end();

    // Se não existe configuração, assumir habilitado por padrão
    const isEnabled = settings.length > 0 ? settings[0].is_enabled === 1 : true;

    res.json({
      success: true,
      data: {
        type,
        enabled: isEnabled
      }
    });

  } catch (error) {
    console.error('Erro ao verificar configuração:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;