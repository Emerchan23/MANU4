import { query } from '../lib/database.js';
import express from 'express';
const router = express.Router();

// Listar notificações
const getNotifications = async (req, res) => {
  try {
    const { 
      user_id, 
      type, 
      priority, 
      read = null, 
      limit = 50, 
      offset = 0 
    } = req.query;

    console.log(`🔔 [NOTIFICATIONS] Buscando notificações...`);

    // Construir query com filtros
    let whereConditions = ['1=1'];
    let queryParams = [];

    if (user_id) {
      whereConditions.push('n.user_id = ?');
      queryParams.push(user_id);
    }

    if (type) {
      whereConditions.push('n.type = ?');
      queryParams.push(type);
    }

    if (priority) {
      whereConditions.push('n.priority = ?');
      queryParams.push(priority);
    }

    if (read !== null) {
      whereConditions.push('n.read_at IS ' + (read === 'true' ? 'NOT NULL' : 'NULL'));
    }

    const notificationsQuery = `
      SELECT 
        n.id,
        n.title,
        n.message,
        n.type,
        n.priority,
        n.user_id,
        n.equipment_id,
        n.maintenance_schedule_id,
        n.read_at,
        n.created_at,
        n.updated_at,
        u.name as user_name,
        e.name as equipment_name,
        ms.scheduled_date as maintenance_date
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      LEFT JOIN equipment e ON n.equipment_id = e.id
      LEFT JOIN maintenance_schedules ms ON n.maintenance_schedule_id = ms.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `;

    queryParams.push(parseInt(limit), parseInt(offset));

    const notifications = await query(notificationsQuery, queryParams);

    // Contar total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM notifications n
      WHERE ${whereConditions.join(' AND ')}
    `;

    const countParams = queryParams.slice(0, -2); // Remove limit e offset
    const [countResult] = await query(countQuery, countParams);

    console.log(`📊 [NOTIFICATIONS] Encontradas ${notifications.length} notificações de ${countResult.total} total`);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total: countResult.total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < countResult.total
        }
      }
    });

  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Erro ao buscar notificações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Criar nova notificação
const createNotification = async (req, res) => {
  try {
    const {
      title,
      message,
      type,
      priority = 'media',
      user_id,
      equipment_id,
      maintenance_schedule_id
    } = req.body;

    console.log(`🔔 [NOTIFICATIONS] Criando nova notificação...`);

    // Validações básicas
    if (!title || !message || !type) {
      return res.status(400).json({
        success: false,
        message: 'Título, mensagem e tipo são obrigatórios'
      });
    }

    const insertQuery = `
      INSERT INTO notifications (
        title, message, type, priority, user_id, 
        equipment_id, maintenance_schedule_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const result = await query(insertQuery, [
      title,
      message,
      type,
      priority,
      user_id || null,
      equipment_id || null,
      maintenance_schedule_id || null
    ]);

    // Buscar a notificação criada
    const [newNotification] = await query(
      'SELECT * FROM notifications WHERE id = ?',
      [result.insertId]
    );

    console.log(`✅ [NOTIFICATIONS] Notificação criada com ID ${result.insertId}`);

    res.status(201).json({
      success: true,
      data: newNotification,
      message: 'Notificação criada com sucesso'
    });

  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Erro ao criar notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Marcar notificação como lida
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔔 [NOTIFICATIONS] Marcando notificação ${id} como lida...`);

    // Verificar se a notificação existe
    const [notification] = await query('SELECT id FROM notifications WHERE id = ?', [id]);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }

    await query(
      'UPDATE notifications SET read_at = NOW(), updated_at = NOW() WHERE id = ?',
      [id]
    );

    console.log(`✅ [NOTIFICATIONS] Notificação ${id} marcada como lida`);

    res.json({
      success: true,
      message: 'Notificação marcada como lida'
    });

  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Erro ao marcar como lida:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Marcar múltiplas notificações como lidas
const markMultipleAsRead = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'IDs das notificações são obrigatórios'
      });
    }

    console.log(`🔔 [NOTIFICATIONS] Marcando ${ids.length} notificações como lidas...`);

    const placeholders = ids.map(() => '?').join(',');
    await query(
      `UPDATE notifications SET read_at = NOW(), updated_at = NOW() WHERE id IN (${placeholders})`,
      ids
    );

    console.log(`✅ [NOTIFICATIONS] ${ids.length} notificações marcadas como lidas`);

    res.json({
      success: true,
      message: `${ids.length} notificações marcadas como lidas`
    });

  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Erro ao marcar múltiplas como lidas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Deletar notificação
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🔔 [NOTIFICATIONS] Deletando notificação ${id}...`);

    // Verificar se a notificação existe
    const [notification] = await query('SELECT id FROM notifications WHERE id = ?', [id]);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }

    await query('DELETE FROM notifications WHERE id = ?', [id]);

    console.log(`✅ [NOTIFICATIONS] Notificação ${id} deletada`);

    res.json({
      success: true,
      message: 'Notificação deletada com sucesso'
    });

  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Erro ao deletar notificação:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Obter estatísticas de notificações
const getNotificationStats = async (req, res) => {
  try {
    const { user_id } = req.query;

    console.log(`📊 [NOTIFICATIONS] Calculando estatísticas...`);

    let whereCondition = '1=1';
    let queryParams = [];

    if (user_id) {
      whereCondition = 'user_id = ?';
      queryParams.push(user_id);
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN read_at IS NULL THEN 1 END) as unread,
        COUNT(CASE WHEN read_at IS NOT NULL THEN 1 END) as read,
        COUNT(CASE WHEN type = 'manutencao_vencida' THEN 1 END) as overdue_maintenance,
        COUNT(CASE WHEN type = 'manutencao_proxima' THEN 1 END) as upcoming_maintenance,
        COUNT(CASE WHEN priority = 'alta' THEN 1 END) as high_priority,
        COUNT(CASE WHEN priority = 'critica' THEN 1 END) as critical_priority
      FROM notifications
      WHERE ${whereCondition}
    `;

    const [stats] = await query(statsQuery, queryParams);

    console.log(`✅ [NOTIFICATIONS] Estatísticas calculadas`);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Erro ao calcular estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Função para criar notificações automáticas de manutenção
const createMaintenanceNotifications = async () => {
  try {
    console.log('🔔 [NOTIFICATIONS] Verificando manutenções para notificação...');

    // Buscar manutenções vencidas (não concluídas e data passou)
    const overdueQuery = `
      SELECT 
        ms.id,
        ms.equipment_id,
        ms.scheduled_date,
        e.name as equipment_name,
        mt.name as maintenance_type
      FROM maintenance_schedules ms
      JOIN equipment e ON ms.equipment_id = e.id
      JOIN maintenance_types mt ON ms.maintenance_type_id = mt.id
      WHERE ms.status IN ('agendada', 'em_andamento')
        AND ms.scheduled_date < NOW()
        AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.maintenance_schedule_id = ms.id 
            AND n.type = 'manutencao_vencida'
            AND n.created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
        )
    `;

    const overdueMaintenances = await query(overdueQuery);

    // Criar notificações para manutenções vencidas
    for (const maintenance of overdueMaintenances) {
      await query(`
        INSERT INTO notifications (
          title, message, type, priority, equipment_id, 
          maintenance_schedule_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        'Manutenção Vencida',
        `A manutenção ${maintenance.maintenance_type} do equipamento ${maintenance.equipment_name} está vencida desde ${new Date(maintenance.scheduled_date).toLocaleDateString('pt-BR')}.`,
        'manutencao_vencida',
        'alta',
        maintenance.equipment_id,
        maintenance.id
      ]);
    }

    // Buscar manutenções próximas (próximos 7 dias)
    const upcomingQuery = `
      SELECT 
        ms.id,
        ms.equipment_id,
        ms.scheduled_date,
        e.name as equipment_name,
        mt.name as maintenance_type
      FROM maintenance_schedules ms
      JOIN equipment e ON ms.equipment_id = e.id
      JOIN maintenance_types mt ON ms.maintenance_type_id = mt.id
      WHERE ms.status = 'agendada'
        AND ms.scheduled_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
        AND NOT EXISTS (
          SELECT 1 FROM notifications n 
          WHERE n.maintenance_schedule_id = ms.id 
            AND n.type = 'manutencao_proxima'
            AND n.created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
        )
    `;

    const upcomingMaintenances = await query(upcomingQuery);

    // Criar notificações para manutenções próximas
    for (const maintenance of upcomingMaintenances) {
      await query(`
        INSERT INTO notifications (
          title, message, type, priority, equipment_id, 
          maintenance_schedule_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        'Manutenção Próxima',
        `A manutenção ${maintenance.maintenance_type} do equipamento ${maintenance.equipment_name} está agendada para ${new Date(maintenance.scheduled_date).toLocaleDateString('pt-BR')}.`,
        'manutencao_proxima',
        'media',
        maintenance.equipment_id,
        maintenance.id
      ]);
    }

    console.log(`✅ [NOTIFICATIONS] Criadas ${overdueMaintenances.length} notificações de vencimento e ${upcomingMaintenances.length} de proximidade`);

  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Erro ao criar notificações automáticas:', error);
  }
};

// Configurar rotas
router.get('/', getNotifications);
router.get('/stats', getNotificationStats);
router.post('/', createNotification);
router.put('/:id/read', markAsRead);
router.put('/read-multiple', markMultipleAsRead);
router.delete('/:id', deleteNotification);

export {
  getNotifications,
  createNotification,
  markAsRead,
  markMultipleAsRead,
  deleteNotification,
  getNotificationStats,
  createMaintenanceNotifications
};

export default router;