// Servidor WebSocket para notificações em tempo real
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

// Função para importar query apenas no servidor
async function getQuery() {
  if (typeof window !== 'undefined') {
    throw new Error('Database operations are not allowed on the client side');
  }
  const dbModule = await import('./database');
  return dbModule.query;
}

export interface NotificationEvent {
  type: 'notification' | 'notification_read' | 'notification_count_update';
  data: any;
  userId?: number;
  timestamp: number;
}

export class NotificationWebSocketServer {
  private io: SocketIOServer;
  private userSockets: Map<number, Set<string>> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://your-domain.com'] 
          : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Cliente conectado:', socket.id);

      // Autenticação do usuário
      socket.on('authenticate', async (data) => {
        try {
          const { userId, token } = data;
          
          if (!userId || !token) {
            socket.emit('auth_error', { message: 'Dados de autenticação inválidos' });
            return;
          }

          // Verificar token de sessão (simplificado - em produção usar JWT)
          const session = await query(
            'SELECT user_id FROM user_sessions WHERE session_token = ? AND expires_at > NOW()',
            [token]
          );

          if (session.length === 0 || session[0].user_id !== userId) {
            socket.emit('auth_error', { message: 'Token inválido ou expirado' });
            return;
          }

          // Associar socket ao usuário
          socket.data.userId = userId;
          
          if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
          }
          this.userSockets.get(userId)!.add(socket.id);

          // Confirmar autenticação
          socket.emit('authenticated', { 
            userId, 
            message: 'Conectado com sucesso',
            timestamp: Date.now()
          });

          // Enviar contagem de notificações não lidas
          const unreadCount = await this.getUnreadNotificationCount(userId);
          socket.emit('notification_count', { count: unreadCount });

          console.log(`Usuário ${userId} autenticado no socket ${socket.id}`);
        } catch (error) {
          console.error('Erro na autenticação:', error);
          socket.emit('auth_error', { message: 'Erro interno de autenticação' });
        }
      });

      // Marcar notificação como lida
      socket.on('mark_notification_read', async (data) => {
        try {
          const { notificationId } = data;
          const userId = socket.data.userId;

          if (!userId) {
            socket.emit('error', { message: 'Usuário não autenticado' });
            return;
          }

          // Marcar como lida no banco
          await query(
            'UPDATE notifications SET is_read = TRUE, read_status = "read" WHERE id = ? AND user_id = ?',
            [notificationId, userId]
          );

          // Confirmar para o cliente
          socket.emit('notification_marked_read', { notificationId });

          // Atualizar contagem
          const unreadCount = await this.getUnreadNotificationCount(userId);
          this.emitToUser(userId, 'notification_count', { count: unreadCount });

          console.log(`Notificação ${notificationId} marcada como lida pelo usuário ${userId}`);
        } catch (error) {
          console.error('Erro ao marcar notificação como lida:', error);
          socket.emit('error', { message: 'Erro ao marcar como lida' });
        }
      });

      // Obter notificações recentes
      socket.on('get_recent_notifications', async (data) => {
        try {
          const { limit = 10 } = data;
          const userId = socket.data.userId;

          if (!userId) {
            socket.emit('error', { message: 'Usuário não autenticado' });
            return;
          }

          const notifications = await query(
            `SELECT * FROM notifications 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT ?`,
            [userId, limit]
          );

          socket.emit('recent_notifications', { notifications });
        } catch (error) {
          console.error('Erro ao obter notificações recentes:', error);
          socket.emit('error', { message: 'Erro ao obter notificações' });
        }
      });

      // Ping/Pong para manter conexão viva
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // Desconexão
      socket.on('disconnect', () => {
        const userId = socket.data.userId;
        if (userId && this.userSockets.has(userId)) {
          this.userSockets.get(userId)!.delete(socket.id);
          if (this.userSockets.get(userId)!.size === 0) {
            this.userSockets.delete(userId);
          }
        }
        console.log('Cliente desconectado:', socket.id);
      });
    });
  }

  // Enviar notificação para usuário específico
  public async sendNotificationToUser(userId: number, notification: any) {
    try {
      const event: NotificationEvent = {
        type: 'notification',
        data: notification,
        userId,
        timestamp: Date.now()
      };

      this.emitToUser(userId, 'new_notification', event);

      // Atualizar contagem de não lidas
      const unreadCount = await this.getUnreadNotificationCount(userId);
      this.emitToUser(userId, 'notification_count', { count: unreadCount });

      console.log(`Notificação enviada via WebSocket para usuário ${userId}`);
    } catch (error) {
      console.error('Erro ao enviar notificação via WebSocket:', error);
    }
  }

  // Enviar para todos os usuários conectados
  public broadcastNotification(notification: any, excludeUserId?: number) {
    const event: NotificationEvent = {
      type: 'notification',
      data: notification,
      timestamp: Date.now()
    };

    this.userSockets.forEach((sockets, userId) => {
      if (excludeUserId && userId === excludeUserId) {
        return; // Pular usuário excluído
      }

      sockets.forEach(socketId => {
        this.io.to(socketId).emit('broadcast_notification', event);
      });
    });

    console.log('Notificação broadcast enviada para todos os usuários conectados');
  }

  // Atualizar contagem de notificações para usuário
  public async updateNotificationCount(userId: number) {
    try {
      const unreadCount = await this.getUnreadNotificationCount(userId);
      this.emitToUser(userId, 'notification_count', { count: unreadCount });
    } catch (error) {
      console.error('Erro ao atualizar contagem de notificações:', error);
    }
  }

  // Notificar sobre mudança de status de equipamento
  public async notifyEquipmentStatusChange(equipmentId: number, status: string, affectedUsers?: number[]) {
    try {
      const query = await getQuery();
      const equipment = await query(
        'SELECT name, sector FROM equipment WHERE id = ?',
        [equipmentId]
      );

      if (equipment.length === 0) return;

      const notification = {
        title: 'Status de Equipamento Alterado',
        message: `${equipment[0].name} (${equipment[0].sector}) mudou para: ${status}`,
        type: 'equipment_alert',
        related_id: equipmentId,
        related_type: 'equipment',
        timestamp: Date.now()
      };

      if (affectedUsers && affectedUsers.length > 0) {
        // Enviar para usuários específicos
        for (const userId of affectedUsers) {
          await this.sendNotificationToUser(userId, notification);
        }
      } else {
        // Broadcast para todos
        this.broadcastNotification(notification);
      }
    } catch (error) {
      console.error('Erro ao notificar mudança de status:', error);
    }
  }

  // Notificar sobre nova ordem de serviço
  public async notifyNewServiceOrder(orderId: number, assignedUserId?: number) {
    try {
      const query = await getQuery();
      const order = await query(
        `SELECT so.*, e.name as equipment_name 
         FROM service_orders so 
         LEFT JOIN equipment e ON so.equipment_id = e.id 
         WHERE so.id = ?`,
        [orderId]
      );

      if (order.length === 0) return;

      const notification = {
        title: 'Nova Ordem de Serviço',
        message: `OS #${orderId} criada para ${order[0].equipment_name}`,
        type: 'service_order_update',
        related_id: orderId,
        related_type: 'service_order',
        timestamp: Date.now()
      };

      if (assignedUserId) {
        await this.sendNotificationToUser(assignedUserId, notification);
      } else {
        this.broadcastNotification(notification);
      }
    } catch (error) {
      console.error('Erro ao notificar nova OS:', error);
    }
  }

  // Notificar sobre manutenção vencida
  public async notifyMaintenanceDue(maintenanceId: number, affectedUsers?: number[]) {
    try {
      const query = await getQuery();
      const maintenance = await query(
        `SELECT pm.*, e.name as equipment_name 
         FROM preventive_maintenances pm 
         LEFT JOIN equipment e ON pm.equipment_id = e.id 
         WHERE pm.id = ?`,
        [maintenanceId]
      );

      if (maintenance.length === 0) return;

      const notification = {
        title: 'Manutenção Vencida',
        message: `Manutenção de ${maintenance[0].equipment_name} está vencida`,
        type: 'maintenance_due',
        related_id: maintenanceId,
        related_type: 'maintenance',
        timestamp: Date.now()
      };

      if (affectedUsers && affectedUsers.length > 0) {
        for (const userId of affectedUsers) {
          await this.sendNotificationToUser(userId, notification);
        }
      } else {
        this.broadcastNotification(notification);
      }
    } catch (error) {
      console.error('Erro ao notificar manutenção vencida:', error);
    }
  }

  // Métodos auxiliares
  private emitToUser(userId: number, event: string, data: any) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      userSockets.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  private async getUnreadNotificationCount(userId: number): Promise<number> {
    try {
      const query = await getQuery();
      const result = await query(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
        [userId]
      );
      return (result[0] as any).count || 0;
    } catch (error) {
      console.error('Erro ao contar notificações não lidas:', error);
      return 0;
    }
  }

  // Obter estatísticas de conexões
  public getConnectionStats() {
    const totalConnections = this.io.engine.clientsCount;
    const authenticatedUsers = this.userSockets.size;
    const totalSockets = Array.from(this.userSockets.values())
      .reduce((total, sockets) => total + sockets.size, 0);

    return {
      totalConnections,
      authenticatedUsers,
      totalSockets,
      userSockets: Object.fromEntries(
        Array.from(this.userSockets.entries()).map(([userId, sockets]) => [
          userId,
          sockets.size
        ])
      )
    };
  }

  // Desconectar usuário específico
  public disconnectUser(userId: number, reason?: string) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      userSockets.forEach(socketId => {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('force_disconnect', { reason: reason || 'Desconectado pelo servidor' });
          socket.disconnect(true);
        }
      });
      this.userSockets.delete(userId);
    }
  }
}

// Instância global do servidor WebSocket
let notificationServer: NotificationWebSocketServer | null = null;

export function initializeWebSocketServer(httpServer: HTTPServer): NotificationWebSocketServer {
  if (!notificationServer) {
    notificationServer = new NotificationWebSocketServer(httpServer);
    console.log('Servidor WebSocket de notificações inicializado');
  }
  return notificationServer;
}

export function getNotificationServer(): NotificationWebSocketServer | null {
  return notificationServer;
}