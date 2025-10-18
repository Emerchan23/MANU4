import React, { useState, useEffect } from 'react';
import { Bell, Settings, X, Check, CheckCheck, Filter, Trash2, RefreshCw } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

const NotificationPanel = ({ isOpen, onClose, userId = 1 }) => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    isConnected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearError
  } = useNotifications(userId);

  const [filter, setFilter] = useState('all'); // all, unread, read
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filtrar notificações
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return notification.is_read === 0;
      case 'read':
        return notification.is_read === 1;
      default:
        return true;
    }
  });

  // Carregar mais notificações
  const loadMore = async () => {
    try {
      const result = await fetchNotifications(page + 1);
      setPage(prev => prev + 1);
      setHasMore(result.pagination.page < result.pagination.pages);
    } catch (error) {
      console.error('Erro ao carregar mais notificações:', error);
    }
  };

  // Atualizar notificações
  const refresh = async () => {
    try {
      setPage(1);
      await fetchNotifications(1);
      setHasMore(true);
    } catch (error) {
      console.error('Erro ao atualizar notificações:', error);
    }
  };

  // Formatar data
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d atrás`;
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Obter ícone por tipo de notificação
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'equipment_failure':
        return '⚠️';
      case 'maintenance_due':
        return '🔧';
      case 'service_order_assigned':
        return '📋';
      case 'service_order_completed':
        return '✅';
      case 'system_alerts':
        return '🔔';
      default:
        return '📢';
    }
  };

  // Obter cor por tipo
  const getNotificationColor = (type) => {
    switch (type) {
      case 'equipment_failure':
        return 'text-red-600 bg-red-50';
      case 'maintenance_due':
        return 'text-yellow-600 bg-yellow-50';
      case 'service_order_assigned':
        return 'text-blue-600 bg-blue-50';
      case 'service_order_completed':
        return 'text-green-600 bg-green-50';
      case 'system_alerts':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Notificações
            </h2>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Status de conexão */}
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
                 title={isConnected ? 'Conectado' : 'Desconectado'} />
            
            {/* Botão de atualizar */}
            <button
              onClick={refresh}
              disabled={loading}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              title="Atualizar"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            {/* Botão de fechar */}
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filtros e ações */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex space-x-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-md ${
                  filter === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 text-sm rounded-md ${
                  filter === 'unread'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Não lidas ({unreadCount})
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`px-3 py-1 text-sm rounded-md ${
                  filter === 'read'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Lidas
              </button>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <CheckCheck className="h-4 w-4" />
              <span>Marcar todas como lidas</span>
            </button>
          )}
        </div>

        {/* Erro */}
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Lista de notificações */}
        <div className="flex-1 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <Bell className="h-8 w-8 mb-2" />
              <p className="text-sm">
                {filter === 'unread' 
                  ? 'Nenhuma notificação não lida'
                  : filter === 'read'
                  ? 'Nenhuma notificação lida'
                  : 'Nenhuma notificação'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    notification.is_read === 0 ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    if (notification.is_read === 0) {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex items-start space-x-3">
                    {/* Ícone */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-medium ${
                          notification.is_read === 0 ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h4>
                        {notification.is_read === 0 && (
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                      </div>
                      
                      <p className={`text-sm mt-1 ${
                        notification.is_read === 0 ? 'text-gray-700' : 'text-gray-500'
                      }`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {formatDate(notification.created_at)}
                        </span>
                        
                        {notification.is_read === 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Marcar como lida
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Carregar mais */}
              {hasMore && filteredNotifications.length > 0 && (
                <div className="p-4 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    {loading ? 'Carregando...' : 'Carregar mais'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;