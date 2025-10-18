// Componente de badge de notificações
import React, { useState, useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useNotificationWebSocket } from '../../lib/websocket-client';

interface NotificationBadgeProps {
  userId: number;
  token: string;
  onClick?: () => void;
  className?: string;
}

export function NotificationBadge({ userId, token, onClick, className = '' }: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [loading, setLoading] = useState(true);

  // WebSocket para atualizações em tempo real
  const { 
    isConnected, 
    unreadCount: wsUnreadCount,
    hasNewNotification: wsHasNewNotification 
  } = useNotificationWebSocket(userId, token);

  // Carregar contador inicial
  const loadUnreadCount = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/notifications?unread_only=true&count_only=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Erro ao carregar contador de notificações:', err);
    } finally {
      setLoading(false);
    }
  };

  // Atualizar contador via WebSocket
  useEffect(() => {
    if (isConnected && wsUnreadCount !== undefined) {
      setUnreadCount(wsUnreadCount);
    }
  }, [isConnected, wsUnreadCount]);

  // Atualizar indicador de nova notificação
  useEffect(() => {
    if (wsHasNewNotification) {
      setHasNewNotification(true);
      
      // Remover indicador após alguns segundos
      const timer = setTimeout(() => {
        setHasNewNotification(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [wsHasNewNotification]);

  // Carregar contador inicial
  useEffect(() => {
    loadUnreadCount();
  }, []);

  // Lidar com clique
  const handleClick = () => {
    setHasNewNotification(false);
    onClick?.();
  };

  // Formatear contador
  const formatCount = (count: number): string => {
    if (count === 0) return '';
    if (count > 99) return '99+';
    return count.toString();
  };

  return (
    <button
      onClick={handleClick}
      className={`relative p-2 text-gray-600 hover:text-gray-900 transition-colors ${className}`}
      title={`${unreadCount} notificação(ões) não lida(s)`}
    >
      {/* Ícone */}
      <div className="relative">
        {hasNewNotification ? (
          <BellRing className={`w-6 h-6 ${hasNewNotification ? 'animate-pulse text-blue-600' : ''}`} />
        ) : (
          <Bell className="w-6 h-6" />
        )}
        
        {/* Indicador de conexão WebSocket */}
        <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-400' : 'bg-gray-400'
        }`} />
      </div>

      {/* Badge de contador */}
      {unreadCount > 0 && (
        <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-xs font-medium text-white rounded-full ${
          hasNewNotification ? 'bg-red-500 animate-bounce' : 'bg-red-500'
        }`}>
          {loading ? (
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          ) : (
            formatCount(unreadCount)
          )}
        </span>
      )}

      {/* Indicador de nova notificação (pulso) */}
      {hasNewNotification && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75" />
      )}
    </button>
  );
}