import React, { useState, useEffect } from 'react';
import { Bell, X, Check, AlertTriangle, Clock, Wrench, CheckCircle } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'manutencao_vencida' | 'manutencao_proxima' | 'sistema' | 'alerta';
  priority: 'baixa' | 'media' | 'alta' | 'critica';
  user_id?: number;
  equipment_id?: number;
  maintenance_schedule_id?: number;
  read_at?: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  equipment_name?: string;
  maintenance_date?: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  overdue_maintenance: number;
  upcoming_maintenance: number;
  high_priority: number;
  critical_priority: number;
}

interface NotificationCenterProps {
  userId?: number;
  compact?: boolean;
  maxItems?: number;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  userId,
  compact = false,
  maxItems = 10
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<{
    type?: string;
    priority?: string;
    read?: boolean;
  }>({});

  // Buscar notificações
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (userId) params.append('user_id', userId.toString());
      if (filter.type) params.append('type', filter.type);
      if (filter.priority) params.append('priority', filter.priority);
      if (filter.read !== undefined) params.append('read', filter.read.toString());
      params.append('limit', maxItems.toString());

      const response = await fetch(`/api/notifications?${params}`);
      const data = await response.json();

      if (data.success) {
        setNotifications(data.data.notifications);
      } else {
        setError(data.message || 'Erro ao carregar notificações');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      console.error('Erro ao buscar notificações:', err);
    } finally {
      setLoading(false);
    }
  };

  // Buscar estatísticas
  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId.toString());

      const response = await fetch(`/api/notifications/stats?${params}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
    }
  };

  // Marcar como lida
  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, read_at: new Date().toISOString() }
              : n
          )
        );
        fetchStats(); // Atualizar estatísticas
      }
    } catch (err) {
      console.error('Erro ao marcar como lida:', err);
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.read_at)
        .map(n => n.id);

      if (unreadIds.length === 0) return;

      const response = await fetch('/api/notifications/read-multiple', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: unreadIds })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
        );
        fetchStats();
      }
    } catch (err) {
      console.error('Erro ao marcar todas como lidas:', err);
    }
  };

  // Deletar notificação
  const deleteNotification = async (notificationId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        fetchStats();
      }
    } catch (err) {
      console.error('Erro ao deletar notificação:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, [userId, filter, maxItems]);

  // Ícone baseado no tipo
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'manutencao_vencida':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'manutencao_proxima':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'sistema':
        return <Bell className="w-4 h-4 text-blue-500" />;
      default:
        return <Wrench className="w-4 h-4 text-gray-500" />;
    }
  };

  // Cor baseada na prioridade
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critica':
        return 'border-l-red-600 bg-red-50';
      case 'alta':
        return 'border-l-orange-500 bg-orange-50';
      case 'media':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'baixa':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-400 bg-gray-50';
    }
  };

  // Formatação de data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Agora há pouco';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h atrás`;
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Bell className="w-5 h-5" />
          {stats && stats.unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {stats.unread > 99 ? '99+' : stats.unread}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notificações</h3>
                <div className="flex items-center gap-2">
                  {stats && stats.unread > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Marcar todas como lidas
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  Carregando...
                </div>
              ) : error ? (
                <div className="p-4 text-center text-red-500">
                  {error}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Nenhuma notificação
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-l-4 hover:bg-gray-50 ${getPriorityColor(notification.priority)} ${
                      !notification.read_at ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getTypeIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-1 ml-2">
                            {!notification.read_at && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Marcar como lida"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Excluir"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatDate(notification.created_at)}
                          </span>
                          {notification.equipment_name && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {notification.equipment_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t bg-gray-50">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Aqui poderia abrir uma página completa de notificações
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800"
                >
                  Ver todas as notificações
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Versão completa
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Notificações</h2>
          <div className="flex items-center gap-4">
            {stats && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Total: {stats.total}</span>
                <span className="text-red-600">Não lidas: {stats.unread}</span>
                <span className="text-orange-600">Alta prioridade: {stats.high_priority}</span>
              </div>
            )}
            {stats && stats.unread > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-4 mt-4">
          <select
            value={filter.type || ''}
            onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value || undefined }))}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="">Todos os tipos</option>
            <option value="manutencao_vencida">Manutenção Vencida</option>
            <option value="manutencao_proxima">Manutenção Próxima</option>
            <option value="sistema">Sistema</option>
            <option value="alerta">Alerta</option>
          </select>

          <select
            value={filter.priority || ''}
            onChange={(e) => setFilter(prev => ({ ...prev, priority: e.target.value || undefined }))}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="">Todas as prioridades</option>
            <option value="critica">Crítica</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>

          <select
            value={filter.read === undefined ? '' : filter.read.toString()}
            onChange={(e) => setFilter(prev => ({ 
              ...prev, 
              read: e.target.value === '' ? undefined : e.target.value === 'true' 
            }))}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="">Todas</option>
            <option value="false">Não lidas</option>
            <option value="true">Lidas</option>
          </select>
        </div>
      </div>

      <div className="divide-y">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Carregando notificações...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            {error}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma notificação encontrada</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 border-l-4 hover:bg-gray-50 ${getPriorityColor(notification.priority)} ${
                !notification.read_at ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {getTypeIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      {notification.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        notification.priority === 'critica' ? 'bg-red-100 text-red-800' :
                        notification.priority === 'alta' ? 'bg-orange-100 text-orange-800' :
                        notification.priority === 'media' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
                      </span>
                      {!notification.read_at && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                          title="Marcar como lida"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
                        title="Excluir"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 mt-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{formatDate(notification.created_at)}</span>
                      {notification.equipment_name && (
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          📱 {notification.equipment_name}
                        </span>
                      )}
                      {notification.maintenance_date && (
                        <span className="bg-blue-100 px-2 py-1 rounded">
                          📅 {new Date(notification.maintenance_date).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                    {notification.read_at && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Lida
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationCenter;