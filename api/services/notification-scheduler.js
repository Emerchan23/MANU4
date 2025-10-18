import mysql from 'mysql2/promise';
import cron from 'node-cron';
import webpush from 'web-push';

class NotificationScheduler {
  constructor(dbConfig, vapidKeys) {
    this.dbConfig = dbConfig;
    this.vapidKeys = vapidKeys;
    this.jobs = new Map();
    this.isRunning = false;
    
    // Configurar web-push
    if (vapidKeys && vapidKeys.publicKey && vapidKeys.privateKey) {
      webpush.setVapidDetails(
        vapidKeys.subject || 'mailto:admin@sistema-manutencao.com',
        vapidKeys.publicKey,
        vapidKeys.privateKey
      );
    }
  }

  // Iniciar o agendador
  start() {
    if (this.isRunning) return;
    
    console.log('🕐 Iniciando agendador de notificações...');
    
    // Verificar equipamentos com falhas - a cada 5 minutos
    this.scheduleJob('equipment-check', '*/5 * * * *', () => {
      this.checkEquipmentFailures();
    });

    // Verificações de manutenção preventiva desativadas (tabelas removidas)
    // this.scheduleJob('maintenance-check', '0 * * * *', () => {
    //   this.checkOverdueMaintenance();
    // });

    // this.scheduleJob('maintenance-due-check', '0 8 * * *', () => {
    //   this.checkUpcomingMaintenance();
    // });

    // Verificação de ordens de serviço removida (funcionalidade descontinuada)

    // Limpeza de notificações antigas - diariamente às 2h
    this.scheduleJob('cleanup', '0 2 * * *', () => {
      this.cleanupOldNotifications();
    });

    this.isRunning = true;
    console.log('✅ Agendador de notificações iniciado com sucesso');
  }

  // Parar o agendador
  stop() {
    if (!this.isRunning) return;
    
    console.log('🛑 Parando agendador de notificações...');
    
    this.jobs.forEach((job, name) => {
      job.destroy();
      console.log(`  - Job '${name}' parado`);
    });
    
    this.jobs.clear();
    this.isRunning = false;
    console.log('✅ Agendador de notificações parado');
  }

  // Agendar um job
  scheduleJob(name, schedule, task) {
    if (this.jobs.has(name)) {
      this.jobs.get(name).destroy();
    }

    const job = cron.schedule(schedule, async () => {
      try {
        console.log(`🔄 Executando job: ${name}`);
        await task();
        console.log(`✅ Job '${name}' executado com sucesso`);
      } catch (error) {
        console.error(`❌ Erro no job '${name}':`, error);
      }
    }, {
      scheduled: false
    });

    this.jobs.set(name, job);
    job.start();
    console.log(`📅 Job '${name}' agendado: ${schedule}`);
  }

  // Verificar equipamentos com falhas
  async checkEquipmentFailures() {
    const connection = await mysql.createConnection(this.dbConfig);
    
    try {
      // Buscar equipamentos com status de falha que não foram notificados recentemente
      const [equipments] = await connection.execute(`
        SELECT e.id, e.name, e.status, e.updated_at
        FROM equipment e
        LEFT JOIN notifications n ON n.related_id = e.id 
          AND n.type = 'equipment_failure' 
          AND n.created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        WHERE e.status IN ('Quebrado', 'Falha', 'Crítico', 'Inoperante')
          AND n.id IS NULL
        ORDER BY e.updated_at DESC
      `);

      for (const equipment of equipments) {
        await this.createNotification({
          type: 'equipment_failure',
          title: `Falha no Equipamento: ${equipment.name}`,
          message: `O equipamento ${equipment.name} está com status "${equipment.status}". Verificação necessária.`,
          priority: 'high',
          related_id: equipment.id,
          related_type: 'equipment',
          data: {
            equipment_id: equipment.id,
            equipment_name: equipment.name,
            status: equipment.status,
            action_url: `/equipamentos/${equipment.id}`
          }
        });
      }

      if (equipments.length > 0) {
        console.log(`📢 ${equipments.length} notificações de falha de equipamento criadas`);
      }

    } finally {
      await connection.end();
    }
  }

  // Verificar manutenções vencidas
  async checkOverdueMaintenance() {
    // Funcionalidade desativada: tabelas de manutenção preventiva removidas
    return;
  }

  // Verificar manutenções próximas do vencimento
  async checkUpcomingMaintenance() {
    // Funcionalidade desativada: tabelas de manutenção preventiva removidas
    return;
  }

  // Verificar ordens de serviço pendentes
  async checkPendingServiceOrders() {
    // Funcionalidade removida: tabela service_orders descontinuada
    return;
  }

  // Criar notificação
  async createNotification(notificationData) {
    const connection = await mysql.createConnection(this.dbConfig);
    
    try {
      // Buscar usuários que devem receber este tipo de notificação
      const [users] = await connection.execute(`
        SELECT DISTINCT u.id, u.name, u.email, ns.push_enabled
        FROM users u
        LEFT JOIN notification_settings ns ON ns.user_id = u.id AND ns.type = ?
        WHERE u.is_active = 1 
          AND (ns.enabled = 1 OR ns.enabled IS NULL)
      `, [notificationData.type]);

      for (const user of users) {
        // Inserir notificação no banco
        const [result] = await connection.execute(`
          INSERT INTO notifications (
            user_id, type, title, message, 
            related_id, related_type, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        `, [
          user.id,
          notificationData.type,
          notificationData.title,
          notificationData.message,
          notificationData.related_id || null,
          notificationData.related_type || null
        ]);

        const notificationId = result.insertId;

        // Enviar via WebSocket se disponível
        if (global.notificationWS) {
          global.notificationWS.sendToUser(user.id, {
            type: 'new_notification',
            notification: {
              id: notificationId,
              ...notificationData,
              user_id: user.id,
              is_read: 0,
              created_at: new Date().toISOString()
            }
          });
        }

        // Enviar push notification se habilitado
        if (user.push_enabled !== 0) {
          await this.sendPushNotification(user.id, {
            id: notificationId,
            ...notificationData
          });
        }
      }

    } finally {
      await connection.end();
    }
  }

  // Enviar push notification
  async sendPushNotification(userId, notification) {
    const connection = await mysql.createConnection(this.dbConfig);
    
    try {
      // Buscar subscriptions do usuário
      const [subscriptions] = await connection.execute(`
        SELECT endpoint, p256dh_key, auth_key
        FROM push_subscriptions
        WHERE user_id = ? AND active = 1
      `, [userId]);

      const payload = JSON.stringify({
        title: notification.title,
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: `notification-${notification.id}`,
        data: {
          notificationId: notification.id,
          type: notification.type,
          url: notification.data?.action_url || '/',
          ...notification.data
        },
        actions: [
          {
            action: 'view',
            title: 'Ver Detalhes'
          },
          {
            action: 'dismiss',
            title: 'Dispensar'
          }
        ]
      });

      for (const subscription of subscriptions) {
        try {
          await webpush.sendNotification({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh_key,
              auth: subscription.auth_key
            }
          }, payload);
        } catch (error) {
          console.error(`Erro ao enviar push para usuário ${userId}:`, error);
          
          // Se a subscription é inválida, remover do banco
          if (error.statusCode === 410) {
            await connection.execute(`
              UPDATE push_subscriptions 
              SET active = 0 
              WHERE user_id = ? AND endpoint = ?
            `, [userId, subscription.endpoint]);
          }
        }
      }

    } finally {
      await connection.end();
    }
  }

  // Limpeza de notificações antigas
  async cleanupOldNotifications() {
    const connection = await mysql.createConnection(this.dbConfig);
    
    try {
      // Remover notificações lidas com mais de 30 dias
      const [result1] = await connection.execute(`
        DELETE FROM notifications 
        WHERE is_read = 1 
          AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);

      // Remover notificações não lidas com mais de 90 dias
      const [result2] = await connection.execute(`
        DELETE FROM notifications 
        WHERE is_read = 0 
          AND created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
      `);

      // Remover subscriptions inativas há mais de 60 dias
      const [result3] = await connection.execute(`
        DELETE FROM push_subscriptions 
        WHERE active = 0 
          AND updated_at < DATE_SUB(NOW(), INTERVAL 60 DAY)
      `);

      const totalCleaned = result1.affectedRows + result2.affectedRows + result3.affectedRows;
      
      if (totalCleaned > 0) {
        console.log(`🧹 Limpeza concluída: ${totalCleaned} registros removidos`);
      }

    } finally {
      await connection.end();
    }
  }

  // Executar verificação manual
  async runManualCheck(type) {
    console.log(`🔄 Executando verificação manual: ${type}`);
    
    switch (type) {
      case 'equipment':
        await this.checkEquipmentFailures();
        break;
      case 'maintenance':
        // Desativado: manutenção preventiva removida
        break;
      case 'service-orders':
        await this.checkPendingServiceOrders();
        break;
      case 'all':
        await this.checkEquipmentFailures();
        // Desativado: manutenção preventiva removida
        await this.checkPendingServiceOrders();
        break;
      default:
        throw new Error(`Tipo de verificação inválido: ${type}`);
    }
    
    console.log(`✅ Verificação manual '${type}' concluída`);
  }

  // Obter status do agendador
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobs: Array.from(this.jobs.keys()),
      jobCount: this.jobs.size
    };
  }
}

export default NotificationScheduler;