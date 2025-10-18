import { WebSocketServer, WebSocket } from 'ws';
import mysql from 'mysql2/promise';
import dbConfig from '../config/database.js';

class NotificationWebSocketServer {
  constructor(server) {
    this.wss = new WebSocketServer({ server });
    this.clients = new Map(); // userId -> WebSocket connection
    this.setupWebSocketServer();
    console.log('🔌 WebSocket server para notificações iniciado');
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      console.log('Nova conexão WebSocket estabelecida');

      // Aguardar autenticação do cliente
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message);
          await this.handleMessage(ws, data);
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Formato de mensagem inválido'
          }));
        }
      });

      ws.on('close', () => {
        // Remover cliente da lista quando desconectar
        for (const [userId, client] of this.clients.entries()) {
          if (client === ws) {
            this.clients.delete(userId);
            console.log(`Cliente ${userId} desconectado`);
            break;
          }
        }
      });

      ws.on('error', (error) => {
        console.error('Erro na conexão WebSocket:', error);
      });

      // Enviar mensagem de boas-vindas
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Conectado ao servidor de notificações'
      }));
    });
  }

  async handleMessage(ws, data) {
    const { type, userId, ...payload } = data;

    switch (type) {
      case 'authenticate':
        await this.authenticateClient(ws, userId);
        break;

      case 'get_unread_count':
        await this.sendUnreadCount(ws, userId);
        break;

      case 'mark_as_read':
        await this.markAsRead(payload.notificationId);
        break;

      case 'mark_all_read':
        await this.markAllAsRead(userId);
        break;

      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;

      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: `Tipo de mensagem desconhecido: ${type}`
        }));
    }
  }

  async authenticateClient(ws, userId) {
    if (!userId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'userId é obrigatório para autenticação'
      }));
      return;
    }

    // Verificar se usuário existe (opcional - pode ser implementado conforme necessário)
    try {
      // Registrar cliente
      this.clients.set(userId, ws);
      
      ws.send(JSON.stringify({
        type: 'authenticated',
        userId: userId,
        message: 'Autenticado com sucesso'
      }));

      // Enviar contador de não lidas
      await this.sendUnreadCount(ws, userId);

      console.log(`Cliente ${userId} autenticado`);
    } catch (error) {
      console.error('Erro na autenticação:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Erro na autenticação'
      }));
    }
  }

  async sendUnreadCount(ws, userId) {
    try {
      const connection = await mysql.createConnection(dbConfig);
      
      const [result] = await connection.execute(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
        [userId]
      );

      await connection.end();

      ws.send(JSON.stringify({
        type: 'unread_count',
        count: result[0].count
      }));
    } catch (error) {
      console.error('Erro ao buscar contador de não lidas:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Erro ao buscar contador'
      }));
    }
  }

  async markAsRead(notificationId) {
    try {
      const connection = await mysql.createConnection(dbConfig);
      
      await connection.execute(
        'UPDATE notifications SET is_read = 1 WHERE id = ?',
        [notificationId]
      );

      await connection.end();

      // Notificar todos os clientes conectados sobre a atualização
      this.broadcastToAll({
        type: 'notification_read',
        notificationId: notificationId
      });
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  }

  async markAllAsRead(userId) {
    try {
      const connection = await mysql.createConnection(dbConfig);
      
      await connection.execute(
        'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
        [userId]
      );

      await connection.end();

      // Notificar cliente específico
      const client = this.clients.get(userId);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'all_marked_read',
          message: 'Todas as notificações marcadas como lidas'
        }));
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  }

  // Enviar notificação em tempo real para usuário específico
  async sendNotificationToUser(userId, notification) {
    const client = this.clients.get(userId);
    
    if (client && client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify({
          type: 'new_notification',
          notification: notification
        }));

        // Atualizar contador de não lidas
        await this.sendUnreadCount(client, userId);
        
        console.log(`Notificação enviada via WebSocket para usuário ${userId}`);
        return true;
      } catch (error) {
        console.error(`Erro ao enviar notificação WebSocket para ${userId}:`, error);
        return false;
      }
    }
    
    console.log(`Cliente ${userId} não está conectado via WebSocket`);
    return false;
  }

  // Enviar notificação para múltiplos usuários
  async sendNotificationToUsers(userIds, notification) {
    const results = {
      sent: 0,
      failed: 0
    };

    for (const userId of userIds) {
      const success = await this.sendNotificationToUser(userId, notification);
      if (success) {
        results.sent++;
      } else {
        results.failed++;
      }
    }

    return results;
  }

  // Broadcast para todos os clientes conectados
  broadcastToAll(message) {
    this.clients.forEach((client, userId) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(message));
        } catch (error) {
          console.error(`Erro ao enviar broadcast para ${userId}:`, error);
        }
      }
    });
  }

  // Broadcast para usuários específicos
  broadcastToUsers(userIds, message) {
    userIds.forEach(userId => {
      const client = this.clients.get(userId);
      if (client && client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(message));
        } catch (error) {
          console.error(`Erro ao enviar broadcast para ${userId}:`, error);
        }
      }
    });
  }

  // Obter estatísticas do servidor
  getStats() {
    return {
      connectedClients: this.clients.size,
      totalConnections: this.wss.clients.size,
      clients: Array.from(this.clients.keys())
    };
  }

  // Fechar todas as conexões
  close() {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });
    this.wss.close();
    console.log('WebSocket server fechado');
  }
}

export default NotificationWebSocketServer;