// Cliente WebSocket para notificações em tempo real
import { io, Socket } from 'socket.io-client';

// Configuração de feature toggle e URL do servidor
const WS_ENABLED = process.env.NEXT_PUBLIC_WS_ENABLED === 'true'
const WS_URL = process.env.NEXT_PUBLIC_WS_URL

export interface NotificationEvent {
  type: 'notification' | 'notification_read' | 'notification_count_update';
  data: any;
  userId?: number;
  timestamp: number;
}

export interface NotificationClientCallbacks {
  onNewNotification?: (notification: any) => void;
  onNotificationCount?: (count: number) => void;
  onNotificationRead?: (notificationId: number) => void;
  onBroadcastNotification?: (notification: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  onAuthError?: (error: any) => void;
}

export class NotificationWebSocketClient {
  private socket: Socket | null = null;
  private callbacks: NotificationClientCallbacks = {};
  private userId: number | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 1000;
  private isConnecting = false;

  constructor(callbacks: NotificationClientCallbacks = {}) {
    this.callbacks = callbacks;
  }

  // Conectar ao servidor WebSocket
  public connect(userId: number, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Evitar conectar quando desativado por configuração
      if (!WS_ENABLED) {
        console.info('WebSocket de notificações desativado (NEXT_PUBLIC_WS_ENABLED != "true").')
        this.isConnecting = false
        resolve()
        return
      }

      if (this.isConnecting || (this.socket && this.socket.connected)) {
        resolve();
        return;
      }

      this.isConnecting = true;
      this.userId = userId;
      this.token = token;

      // Determinar URL do servidor de forma robusta
      const defaultUrl = typeof window !== 'undefined'
        ? (window.location.protocol === 'https:' ? 'wss://' : 'ws://') + window.location.host
        : 'ws://localhost:3000'
      const serverUrl = WS_URL || defaultUrl

      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      // Eventos de conexão
      this.socket.on('connect', () => {
        console.log('Conectado ao servidor WebSocket');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        
        // Autenticar automaticamente
        this.authenticate();
        
        if (this.callbacks.onConnect) {
          this.callbacks.onConnect();
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Desconectado do WebSocket:', reason);
        this.isConnecting = false;
        
        if (this.callbacks.onDisconnect) {
          this.callbacks.onDisconnect();
        }

        // Tentar reconectar se não foi desconexão intencional
        if (reason !== 'io client disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      });

      // Eventos de autenticação
      this.socket.on('authenticated', (data) => {
        console.log('Autenticado com sucesso:', data);
        resolve();
      });

      this.socket.on('auth_error', (error) => {
        console.error('Erro de autenticação:', error);
        this.isConnecting = false;
        
        if (this.callbacks.onAuthError) {
          this.callbacks.onAuthError(error);
        }
        reject(error);
      });

      // Eventos de notificação
      this.socket.on('new_notification', (event: NotificationEvent) => {
        console.log('Nova notificação recebida:', event);
        if (this.callbacks.onNewNotification) {
          this.callbacks.onNewNotification(event.data);
        }
      });

      this.socket.on('broadcast_notification', (event: NotificationEvent) => {
        console.log('Notificação broadcast recebida:', event);
        if (this.callbacks.onBroadcastNotification) {
          this.callbacks.onBroadcastNotification(event.data);
        }
      });

      this.socket.on('notification_count', (data: { count: number }) => {
        console.log('Contagem de notificações atualizada:', data.count);
        if (this.callbacks.onNotificationCount) {
          this.callbacks.onNotificationCount(data.count);
        }
      });

      this.socket.on('notification_marked_read', (data: { notificationId: number }) => {
        console.log('Notificação marcada como lida:', data.notificationId);
        if (this.callbacks.onNotificationRead) {
          this.callbacks.onNotificationRead(data.notificationId);
        }
      });

      this.socket.on('recent_notifications', (data: { notifications: any[] }) => {
        console.log('Notificações recentes recebidas:', data.notifications.length);
        // Pode ser usado para atualizar lista local
      });

      // Eventos de erro
      this.socket.on('error', (error) => {
        console.error('Erro no WebSocket:', error);
        if (this.callbacks.onError) {
          this.callbacks.onError(error);
        }
      });

      this.socket.on('connect_error', (error) => {
        console.warn('Falha ao conectar ao WebSocket:', (error as any)?.message || error);
        this.isConnecting = false;
        
        if (this.callbacks.onError) {
          this.callbacks.onError(error);
        }

        // Backoff com tentativas limitadas para evitar ruído
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          // Parar após limite; não spam de erros
          console.info('Reconexão ao WebSocket pausada após múltiplas tentativas.');
        }

        // Informar a falha inicial ao chamador
        if (this.reconnectAttempts === 0) {
          reject(error);
        }
      });

      // Ping/Pong para manter conexão
      this.socket.on('pong', (data) => {
        console.log('Pong recebido:', data.timestamp);
      });

      // Desconexão forçada
      this.socket.on('force_disconnect', (data) => {
        console.log('Desconexão forçada:', data.reason);
        this.disconnect();
      });
    });
  }

  // Autenticar com o servidor
  private authenticate() {
    if (this.socket && this.userId && this.token) {
      this.socket.emit('authenticate', {
        userId: this.userId,
        token: this.token
      });
    }
  }

  // Marcar notificação como lida
  public markNotificationAsRead(notificationId: number) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('mark_notification_read', { notificationId });
    }
  }

  // Obter notificações recentes
  public getRecentNotifications(limit: number = 10) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('get_recent_notifications', { limit });
    }
  }

  // Enviar ping
  public ping() {
    if (this.socket && this.socket.connected) {
      this.socket.emit('ping');
    }
  }

  // Desconectar
  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  // Verificar se está conectado
  public isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }

  // Agendar reconexão
  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts} em ${delay}ms`);
    
    setTimeout(() => {
      if (this.userId && this.token) {
        this.connect(this.userId, this.token).catch(console.error);
      }
    }, delay);
  }

  // Atualizar callbacks
  public updateCallbacks(callbacks: NotificationClientCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Obter estatísticas de conexão
  public getConnectionInfo() {
    return {
      connected: this.isConnected(),
      connecting: this.isConnecting,
      reconnectAttempts: this.reconnectAttempts,
      userId: this.userId,
      socketId: this.socket?.id || null
    };
  }
}

// Hook React para usar o cliente WebSocket
import { useEffect, useRef, useState } from 'react';

export function useNotificationWebSocket(userId: number | null, token: string | null) {
  const clientRef = useRef<NotificationWebSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!userId || !token) {
      return;
    }

    // Criar cliente se não existir
    if (!clientRef.current) {
      clientRef.current = new NotificationWebSocketClient({
        onConnect: () => {
          setIsConnected(true);
          console.log('WebSocket conectado');
        },
        onDisconnect: () => {
          setIsConnected(false);
          console.log('WebSocket desconectado');
        },
        onNewNotification: (notification) => {
          setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Manter apenas 50 mais recentes
          // Tocar som ou mostrar toast se necessário
        },
        onBroadcastNotification: (notification) => {
          setNotifications(prev => [notification, ...prev.slice(0, 49)]);
        },
        onNotificationCount: (count) => {
          setUnreadCount(count);
        },
        onNotificationRead: (notificationId) => {
          setNotifications(prev => 
            prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
          );
        },
        onError: (error) => {
          console.error('Erro no WebSocket:', error);
        },
        onAuthError: (error) => {
          console.error('Erro de autenticação WebSocket:', error);
        }
      });
    }

    // Conectar
    clientRef.current.connect(userId, token).catch(console.error);

    // Cleanup na desmontagem
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [userId, token]);

  // Funções para interagir com o WebSocket
  const markAsRead = (notificationId: number) => {
    if (clientRef.current) {
      clientRef.current.markNotificationAsRead(notificationId);
    }
  };

  const getRecentNotifications = (limit?: number) => {
    if (clientRef.current) {
      clientRef.current.getRecentNotifications(limit);
    }
  };

  const disconnect = () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      setIsConnected(false);
    }
  };

  return {
    isConnected,
    unreadCount,
    notifications,
    markAsRead,
    getRecentNotifications,
    disconnect,
    client: clientRef.current
  };
}

// Instância global do cliente (singleton)
let globalNotificationClient: NotificationWebSocketClient | null = null;

export function getGlobalNotificationClient(): NotificationWebSocketClient | null {
  return globalNotificationClient;
}

export function initializeGlobalNotificationClient(callbacks: NotificationClientCallbacks = {}): NotificationWebSocketClient {
  if (!globalNotificationClient) {
    globalNotificationClient = new NotificationWebSocketClient(callbacks);
  }
  return globalNotificationClient;
}

export function destroyGlobalNotificationClient() {
  if (globalNotificationClient) {
    globalNotificationClient.disconnect();
    globalNotificationClient = null;
  }
}