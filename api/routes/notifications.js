import express from 'express';
import mysql from 'mysql2/promise';
import webpush from 'web-push';
import { validateVAPIDKeys } from '../../lib/vapid-keys.js';
import dbConfig from '../config/database.js';

const router = express.Router();

// Configurar VAPID keys
const vapidKeys = validateVAPIDKeys();
webpush.setVapidDetails(
  vapidKeys.subject,
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Middleware para validar dados
const validateSubscription = (req, res, next) => {
  const { userId, subscription } = req.body;
  
  if (!userId || !subscription) {
    return res.status(400).json({
      success: false,
      message: 'userId e subscription são obrigatórios'
    });
  }

  if (!subscription.endpoint || !subscription.keys) {
    return res.status(400).json({
      success: false,
      message: 'Subscription inválida'
    });
  }

  next();
};

// POST /api/notifications/subscribe - Registrar subscription push
router.post('/subscribe', validateSubscription, async (req, res) => {
  const { userId, subscription } = req.body;
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Verificar se já existe subscription para este usuário
    const [existing] = await connection.execute(
      'SELECT id FROM push_subscriptions WHERE user_id = ?',
      [userId]
    );

    if (existing.length > 0) {
      // Atualizar subscription existente
      await connection.execute(
        `UPDATE push_subscriptions 
         SET endpoint = ?, p256dh_key = ?, auth_key = ?, updated_at = NOW()
         WHERE user_id = ?`,
        [
          subscription.endpoint,
          subscription.keys.p256dh,
          subscription.keys.auth,
          userId
        ]
      );
    } else {
      // Criar nova subscription
      await connection.execute(
        `INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(), NOW())`,
        [
          userId,
          subscription.endpoint,
          subscription.keys.p256dh,
          subscription.keys.auth
        ]
      );
    }

    await connection.end();

    res.json({
      success: true,
      message: 'Subscription registrada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao registrar subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/notifications/unsubscribe - Cancelar subscription
router.delete('/unsubscribe/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    await connection.execute(
      'DELETE FROM push_subscriptions WHERE user_id = ?',
      [userId]
    );

    await connection.end();

    res.json({
      success: true,
      message: 'Subscription cancelada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao cancelar subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/notifications/send - Enviar notificação push
router.post('/send', async (req, res) => {
  const { 
    userId, 
    title, 
    body, 
    icon, 
    badge, 
    data = {}, 
    actions = [],
    requireInteraction = false 
  } = req.body;

  if (!userId || !title || !body) {
    return res.status(400).json({
      success: false,
      message: 'userId, title e body são obrigatórios'
    });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Buscar subscription do usuário
    const [subscriptions] = await connection.execute(
      'SELECT endpoint, p256dh_key, auth_key FROM push_subscriptions WHERE user_id = ?',
      [userId]
    );

    if (subscriptions.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Nenhuma subscription encontrada para este usuário'
      });
    }

    const subscription = subscriptions[0];
    
    // Preparar payload da notificação
    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/icon-192x192.png',
      badge: badge || '/badge-72x72.png',
      data: {
        ...data,
        timestamp: Date.now(),
        url: data.url || '/'
      },
      actions,
      requireInteraction,
      tag: data.tag || `notification-${Date.now()}`
    });

    // Configurar subscription para web-push
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh_key,
        auth: subscription.auth_key
      }
    };

    // Enviar notificação push
    await webpush.sendNotification(pushSubscription, payload);

    // Salvar notificação no banco
    await connection.execute(
      `INSERT INTO notifications (user_id, title, message, type, created_at)
       VALUES (?, ?, ?, 'push', NOW())`,
      [userId, title, body]
    );

    await connection.end();

    res.json({
      success: true,
      message: 'Notificação enviada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    
    // Verificar se é erro de subscription inválida
    if (error.statusCode === 410) {
      // Subscription expirada, remover do banco
      try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
          'DELETE FROM push_subscriptions WHERE user_id = ?',
          [userId]
        );
        await connection.end();
      } catch (dbError) {
        console.error('Erro ao remover subscription expirada:', dbError);
      }
      
      return res.status(410).json({
        success: false,
        message: 'Subscription expirada'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro ao enviar notificação'
    });
  }
});

// POST /api/notifications/send-bulk - Enviar notificação para múltiplos usuários
router.post('/send-bulk', async (req, res) => {
  const { 
    userIds, 
    title, 
    body, 
    icon, 
    badge, 
    data = {}, 
    actions = [],
    requireInteraction = false 
  } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'userIds deve ser um array não vazio'
    });
  }

  if (!title || !body) {
    return res.status(400).json({
      success: false,
      message: 'title e body são obrigatórios'
    });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Buscar subscriptions dos usuários
    const placeholders = userIds.map(() => '?').join(',');
    const [subscriptions] = await connection.execute(
      `SELECT user_id, endpoint, p256dh_key, auth_key 
       FROM push_subscriptions 
       WHERE user_id IN (${placeholders})`,
      userIds
    );

    if (subscriptions.length === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        message: 'Nenhuma subscription encontrada'
      });
    }

    // Preparar payload da notificação
    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/icon-192x192.png',
      badge: badge || '/badge-72x72.png',
      data: {
        ...data,
        timestamp: Date.now(),
        url: data.url || '/'
      },
      actions,
      requireInteraction,
      tag: data.tag || `notification-${Date.now()}`
    });

    const results = {
      sent: 0,
      failed: 0,
      expired: []
    };

    // Enviar notificações
    const promises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key
          }
        };

        await webpush.sendNotification(pushSubscription, payload);
        
        // Salvar notificação no banco
        await connection.execute(
          `INSERT INTO notifications (user_id, title, message, type, created_at)
           VALUES (?, ?, ?, 'push', NOW())`,
          [sub.user_id, title, body]
        );

        results.sent++;
      } catch (error) {
        console.error(`Erro ao enviar para usuário ${sub.user_id}:`, error);
        
        if (error.statusCode === 410) {
          // Subscription expirada
          results.expired.push(sub.user_id);
          await connection.execute(
            'DELETE FROM push_subscriptions WHERE user_id = ?',
            [sub.user_id]
          );
        } else {
          results.failed++;
        }
      }
    });

    await Promise.all(promises);
    await connection.end();

    res.json({
      success: true,
      message: 'Notificações processadas',
      results
    });

  } catch (error) {
    console.error('Erro ao enviar notificações em lote:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/notifications/:userId - Buscar notificações do usuário
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20, type } = req.query;
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    let whereClause = 'WHERE user_id = ?';
    let params = [userId];
    
    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }
    
    const offset = (page - 1) * limit;
    
    // Buscar notificações
    const [notifications] = await connection.execute(
      `SELECT id, title, message, type, is_read, created_at
       FROM notifications 
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Contar total
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM notifications ${whereClause}`,
      params
    );

    await connection.end();

    res.json({
      success: true,
      data: {
        notifications: notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/notifications/:id/read - Marcar notificação como lida
router.put('/:id/read', async (req, res) => {
  const { id } = req.params;
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    await connection.execute(
      'UPDATE notifications SET is_read = 1 WHERE id = ?',
      [id]
    );

    await connection.end();

    res.json({
      success: true,
      message: 'Notificação marcada como lida'
    });

  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PUT /api/notifications/:userId/read-all - Marcar todas como lidas
router.put('/:userId/read-all', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    await connection.execute(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    );

    await connection.end();

    res.json({
      success: true,
      message: 'Todas as notificações marcadas como lidas'
    });

  } catch (error) {
    console.error('Erro ao marcar todas como lidas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

export default router;