"use client"
// Painel principal de notificações
import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Settings, Filter, MoreVertical, X, Check, CheckCheck, Trash2 } from 'lucide-react';
import { useNotificationWebSocket } from '../../lib/websocket-client';
import { NotificationItem } from './NotificationItem';
import { NotificationSettings } from './NotificationSettings';
import { NotificationFilters } from './NotificationFilters';

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'equipment_alert' | 'service_order_update' | 'maintenance_due' | 'maintenance_overdue' | 'system_alert';
  priority: 'low' | 'medium' | 'high' | 'critical';
  related_id: number;
  related_type: string;
  read_status: 'sent' | 'delivered' | 'read';
  is_read: boolean;
  created_at: string;
}

export interface NotificationFilters {
  type?: string;
  priority?: string;
  read_status?: string;
  date_from?: string;
  date_to?: string;
}

interface NotificationPanelProps {
  userId: number;
  token: string;
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ userId, token, isOpen, onClose }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'notifications' | 'settings'>('notifications');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<number>>(new Set());

  // Hook do WebSocket
  const { 
    isConnected, 
    unreadCount, 
    notifications: wsNotifications,
    markAsRead,
    getRecentNotifications 
  } = useNotificationWebSocket(userId, token);

  // Carregar notificações da API
  const loadNotifications = useCallback(async (pageNum: number = 1, resetList: boolean = true) => {
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        ...filters
      });

      const response = await fetch(`/api/notifications?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar notificações');
      }

      const data = await response.json();
      
      if (resetList) {
        setNotifications(data.notifications || []);
      } else {
        setNotifications(prev => [...prev, ...(data.notifications || [])]);
      }
      
      setHasMore(data.hasMore || false);
      setPage(pageNum);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [loading, filters, token]);

  // Marcar notificação como lida
  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const response = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationId })
      });

      if (response.ok) {
        // Atualizar estado local
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, is_read: true, read_status: 'read' as const }
              : n
          )
        );

        // Marcar via WebSocket também
        markAsRead(notificationId);
      }
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  // Marcar todas como lidas
  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true, read_status: 'read' as const }))
        );
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  // Excluir notificações selecionadas
  const handleDeleteSelected = async () => {
    if (selectedNotifications.size === 0) return;

    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          notificationIds: Array.from(selectedNotifications) 
        })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.filter(n => !selectedNotifications.has(n.id))
        );
        setSelectedNotifications(new Set());
      }
    } catch (error) {
      console.error('Erro ao excluir notificações:', error);
    }
  };

  // Aplicar filtros
  const handleApplyFilters = (newFilters: NotificationFilters) => {
    setFilters(newFilters);
    setPage(1);
    loadNotifications(1, true);
  };

  // Carregar mais notificações
  const loadMore = () => {
    if (hasMore && !loading) {
      loadNotifications(page + 1, false);
    }
  };

  // Toggle seleção de notificação
  const toggleSelection = (notificationId: number) => {
    const newSelection = new Set(selectedNotifications);
    if (newSelection.has(notificationId)) {
      newSelection.delete(notificationId);
    } else {
      newSelection.add(notificationId);
    }
    setSelectedNotifications(newSelection);
  };

  // Selecionar todas visíveis
  const selectAllVisible = () => {
    const visibleIds = notifications.map(n => n.id);
    setSelectedNotifications(new Set(visibleIds));
  };

  // Limpar seleção
  const clearSelection = () => {
    setSelectedNotifications(new Set());
  };

  // Efeitos
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  useEffect(() => {
    // Adicionar notificações do WebSocket à lista
    if (wsNotifications.length > 0) {
      const newNotifications = wsNotifications.filter(
        wsNotif => !notifications.some(n => n.id === wsNotif.id)
      );
      
      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev]);
      }
    }
  }, [wsNotifications, notifications]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Bell className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold">Notificações</h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-1">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-500">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('notifications')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  activeTab === 'notifications'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Notificações
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'notifications' ? (
            <div className="h-full flex flex-col">
              {/* Toolbar */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        showFilters
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Filter className="w-4 h-4" />
                      <span>Filtros</span>
                    </button>

                    {selectedNotifications.size > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {selectedNotifications.size} selecionada(s)
                        </span>
                        <button
                          onClick={handleDeleteSelected}
                          className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Excluir</span>
                        </button>
                        <button
                          onClick={clearSelection}
                          className="text-sm text-gray-500 hover:text-gray-700"
                        >
                          Limpar
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={selectAllVisible}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Selecionar todas
                    </button>
                    <button
                      onClick={handleMarkAllAsRead}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>Marcar todas como lidas</span>
                    </button>
                  </div>
                </div>

                {/* Filtros */}
                {showFilters && (
                  <div className="mt-3">
                    <NotificationFilters
                      filters={filters}
                      onApplyFilters={handleApplyFilters}
                    />
                  </div>
                )}
              </div>

              {/* Lista de notificações */}
              <div className="flex-1 overflow-y-auto">
                {error && (
                  <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
                    {error}
                  </div>
                )}

                {loading && notifications.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                    <Bell className="w-12 h-12 mb-2 opacity-50" />
                    <p>Nenhuma notificação encontrada</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        isSelected={selectedNotifications.has(notification.id)}
                        onToggleSelection={() => toggleSelection(notification.id)}
                        onMarkAsRead={() => handleMarkAsRead(notification.id)}
                      />
                    ))}

                    {/* Load more */}
                    {hasMore && (
                      <div className="p-4 text-center">
                        <button
                          onClick={loadMore}
                          disabled={loading}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Carregando...' : 'Carregar mais'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <NotificationSettings userId={userId} token={token} />
          )}
        </div>
      </div>
    </div>
  );
}