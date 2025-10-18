import { useState, useEffect, useCallback, useRef } from 'react';
import pushManager from '../../lib/push-notifications';

export const useNotifications = (userId = 1) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [settings, setSettings] = useState({});
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Conectar ao WebSocket
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔌 WebSocket conectado');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;

        // Autenticar usuário
        wsRef.current.send(JSON.stringify({
          type: 'authenticate',
          userId: userId
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('🔌 WebSocket desconectado');
        setIsConnected(false);
        
        // Tentar reconectar
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`🔄 Tentativa de reconexão ${reconnectAttempts.current}/${maxReconnectAttempts}`);
            connectWebSocket();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('Erro WebSocket:', error);
        setError('Erro na conexão WebSocket');
      };

    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error);
      setError('Falha ao conectar WebSocket');
    }
  }, [userId]);

  // Processar mensagens do WebSocket
  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'authenticated':
        console.log('✅ Autenticado no WebSocket');
        break;

      case 'new_notification':
        console.log('🔔 Nova notificação recebida:', data.notification);
        setNotifications(prev => [data.notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Mostrar notificação do navegador se permitido
        if (Notification.permission === 'granted') {
          new Notification(data.notification.title, {
            body: data.notification.message,
            icon: '/icon-192x192.png',
            tag: `notification-${data.notification.id}`
          });
        }
        break;

      case 'unread_count':
        setUnreadCount(data.count);
        break;

      case 'notification_read':
        setNotifications(prev => 
          prev.map(n => 
            n.id === data.notificationId 
              ? { ...n, is_read: 1 }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        break;

      case 'all_marked_read':
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: 1 }))
        );
        setUnreadCount(0);
        break;

      case 'error':
        console.error('Erro WebSocket:', data.message);
        setError(data.message);
        break;

      default:
        console.log('Mensagem WebSocket desconhecida:', data);
    }
  }, []);

  // Buscar notificações da API
  const fetchNotifications = useCallback(async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/notifications/${userId}?page=${page}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        if (page === 1) {
          setNotifications(result.data.notifications);
        } else {
          setNotifications(prev => [...prev, ...result.data.notifications]);
        }
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      setError('Erro ao carregar notificações');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Buscar configurações de notificação
  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch(`/api/notification-settings/${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setSettings(result.data);
        return result.data;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      setError('Erro ao carregar configurações');
      throw error;
    }
  }, [userId]);

  // Marcar notificação como lida
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Atualizar via WebSocket se conectado
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'mark_as_read',
            notificationId: notificationId
          }));
        } else {
          // Atualizar localmente se WebSocket não estiver conectado
          setNotifications(prev => 
            prev.map(n => 
              n.id === notificationId 
                ? { ...n, is_read: 1 }
                : n
            )
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
      setError('Erro ao marcar notificação');
      throw error;
    }
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch(`/api/notifications/${userId}/read-all`, {
        method: 'PUT'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Atualizar via WebSocket se conectado
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'mark_all_read',
            userId: userId
          }));
        } else {
          // Atualizar localmente se WebSocket não estiver conectado
          setNotifications(prev => 
            prev.map(n => ({ ...n, is_read: 1 }))
          );
          setUnreadCount(0);
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      setError('Erro ao marcar todas as notificações');
      throw error;
    }
  }, [userId]);

  // Atualizar configurações
  const updateSettings = useCallback(async (newSettings) => {
    try {
      const response = await fetch(`/api/notification-settings/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSettings)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setSettings(newSettings);
        return true;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      setError('Erro ao salvar configurações');
      throw error;
    }
  }, [userId]);

  // Inicializar notificações push
  const initializePushNotifications = useCallback(async () => {
    try {
      await pushManager.initialize(userId);
      return true;
    } catch (error) {
      console.error('Erro ao inicializar push notifications:', error);
      setError('Erro ao configurar notificações push');
      throw error;
    }
  }, [userId]);

  // Testar notificação
  const testNotification = useCallback(async () => {
    try {
      await pushManager.testLocalNotification();
      return true;
    } catch (error) {
      console.error('Erro ao testar notificação:', error);
      setError('Erro ao testar notificação');
      throw error;
    }
  }, []);

  // Obter status das notificações
  const getNotificationStatus = useCallback(() => {
    return pushManager.getStatus();
  }, []);

  // Efeito para inicializar
  useEffect(() => {
    const initialize = async () => {
      try {
        // Conectar WebSocket
        connectWebSocket();
        
        // Buscar notificações iniciais
        await fetchNotifications();
        
        // Buscar configurações
        await fetchSettings();
        
      } catch (error) {
        console.error('Erro na inicialização:', error);
      }
    };

    initialize();

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket, fetchNotifications, fetchSettings]);

  // Efeito para heartbeat do WebSocket
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // Ping a cada 30 segundos

    return () => clearInterval(interval);
  }, [isConnected]);

  return {
    // Estado
    notifications,
    unreadCount,
    loading,
    error,
    isConnected,
    settings,
    
    // Ações
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    updateSettings,
    initializePushNotifications,
    testNotification,
    getNotificationStatus,
    
    // Utilitários
    clearError: () => setError(null),
    reconnect: connectWebSocket
  };
};