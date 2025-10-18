// Componente de histórico de notificações
import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  Eye, 
  EyeOff, 
  Trash2, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
  BarChart3
} from 'lucide-react';
import { NotificationItem } from './NotificationItem';
import { NotificationFilters } from './NotificationFilters';

interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read_status: 'sent' | 'delivered' | 'read';
  is_read: boolean;
  related_id?: number;
  related_type?: string;
  created_at: string;
  read_at?: string;
}

interface NotificationFilters {
  type?: string;
  priority?: string;
  read_status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

interface NotificationHistoryProps {
  userId: number;
  token: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface NotificationStats {
  total: number;
  read: number;
  unread: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  last7Days: number;
  last30Days: number;
}

export function NotificationHistory({ userId, token }: NotificationHistoryProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Carregar notificações
  const loadNotifications = async (page = 1, newFilters = filters) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...newFilters
      });

      if (searchTerm) {
        params.set('search', searchTerm);
      }

      const response = await fetch(`/api/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar histórico');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
      setPagination({
        page: data.page || 1,
        limit: data.limit || 20,
        total: data.total || 0,
        totalPages: data.totalPages || 0
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Carregar estatísticas
  const loadStats = async () => {
    try {
      const response = await fetch('/api/notifications/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  // Marcar como lida
  const markAsRead = async (notificationIds: number[]) => {
    try {
      const response = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationIds })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            notificationIds.includes(n.id) 
              ? { ...n, is_read: true, read_status: 'read' as const, read_at: new Date().toISOString() }
              : n
          )
        );
        setSelectedNotifications([]);
      }
    } catch (err) {
      setError('Erro ao marcar como lida');
    }
  };

  // Marcar como não lida
  const markAsUnread = async (notificationIds: number[]) => {
    try {
      const response = await fetch('/api/notifications/unread', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationIds })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            notificationIds.includes(n.id) 
              ? { ...n, is_read: false, read_status: 'delivered' as const, read_at: undefined }
              : n
          )
        );
        setSelectedNotifications([]);
      }
    } catch (err) {
      setError('Erro ao marcar como não lida');
    }
  };

  // Excluir notificações
  const deleteNotifications = async (notificationIds: number[]) => {
    if (!confirm(`Deseja excluir ${notificationIds.length} notificação(ões)?`)) {
      return;
    }

    try {
      const response = await fetch('/api/notifications/delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationIds })
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)));
        setSelectedNotifications([]);
      }
    } catch (err) {
      setError('Erro ao excluir notificações');
    }
  };

  // Exportar histórico
  const exportHistory = async () => {
    try {
      const params = new URLSearchParams({
        export: 'true',
        ...filters
      });

      if (searchTerm) {
        params.set('search', searchTerm);
      }

      const response = await fetch(`/api/notifications/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `historico-notificacoes-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      setError('Erro ao exportar histórico');
    }
  };

  // Aplicar filtros
  const applyFilters = (newFilters: NotificationFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    loadNotifications(1, newFilters);
  };

  // Limpar filtros
  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
    loadNotifications(1, {});
  };

  // Buscar
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadNotifications(1, filters);
  };

  // Selecionar/deselecionar notificação
  const toggleSelection = (id: number) => {
    setSelectedNotifications(prev => 
      prev.includes(id) 
        ? prev.filter(nId => nId !== id)
        : [...prev, id]
    );
  };

  // Selecionar/deselecionar todas
  const toggleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  // Navegar páginas
  const goToPage = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    loadNotifications(page, filters);
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Efeitos
  useEffect(() => {
    loadNotifications();
    loadStats();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <History className="w-6 h-6 mr-2" />
            Histórico de Notificações
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Visualize e gerencie todas as suas notificações
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            title="Estatísticas"
          >
            <BarChart3 className="w-5 h-5" />
          </button>
          
          <button
            onClick={exportHistory}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            title="Exportar"
          >
            <Download className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => loadNotifications(pagination.page)}
            disabled={loading}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
            title="Recarregar"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      {showStats && stats && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Estatísticas</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.read}</div>
              <div className="text-sm text-gray-600">Lidas</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.unread}</div>
              <div className="text-sm text-gray-600">Não Lidas</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.last7Days}</div>
              <div className="text-sm text-gray-600">Últimos 7 dias</div>
            </div>
          </div>
        </div>
      )}

      {/* Barra de busca e filtros */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1 flex">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar notificações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
            >
              Buscar
            </button>
          </div>
          
          {/* Botões de filtro */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-3 py-2 border rounded-lg transition-colors ${
                showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filtros</span>
            </button>
            
            {Object.keys(filters).length > 0 && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
        
        {/* Filtros expandidos */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t">
            <NotificationFilters
              filters={filters}
              onFiltersChange={applyFilters}
            />
          </div>
        )}
      </div>

      {/* Ações em lote */}
      {selectedNotifications.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedNotifications.length} notificação(ões) selecionada(s)
            </span>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => markAsRead(selectedNotifications)}
                className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>Marcar como Lida</span>
              </button>
              
              <button
                onClick={() => markAsUnread(selectedNotifications)}
                className="flex items-center space-x-1 px-3 py-1 bg-orange-100 text-orange-700 rounded text-sm hover:bg-orange-200 transition-colors"
              >
                <EyeOff className="w-4 h-4" />
                <span>Marcar como Não Lida</span>
              </button>
              
              <button
                onClick={() => deleteNotifications(selectedNotifications)}
                className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Lista de notificações */}
      <div className="bg-white border rounded-lg">
        {/* Header da lista */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">Selecionar todas</span>
              </label>
              
              <span className="text-sm text-gray-600">
                {pagination.total} notificação(ões) encontrada(s)
              </span>
            </div>
            
            <div className="text-sm text-gray-600">
              Página {pagination.page} de {pagination.totalPages}
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma notificação encontrada</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div key={notification.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={() => toggleSelection(notification.id)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  
                  <div className="flex-1">
                    <NotificationItem
                      notification={notification}
                      onMarkAsRead={() => markAsRead([notification.id])}
                      onDelete={() => deleteNotifications([notification.id])}
                      showActions={false}
                    />
                    
                    {/* Informações adicionais */}
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Criada: {formatDate(notification.created_at)}</span>
                      </div>
                      
                      {notification.read_at && (
                        <div className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>Lida: {formatDate(notification.read_at)}</span>
                        </div>
                      )}
                      
                      <span className={`px-2 py-1 rounded text-xs ${
                        notification.read_status === 'read' ? 'bg-green-100 text-green-700' :
                        notification.read_status === 'delivered' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {notification.read_status === 'read' ? 'Lida' :
                         notification.read_status === 'delivered' ? 'Entregue' : 'Enviada'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginação */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} resultados
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {/* Números das páginas */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, pagination.page - 2)) + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        pageNum === pagination.page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}