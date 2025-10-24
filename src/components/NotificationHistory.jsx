import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Calendar, Eye, EyeOff, Trash2, RefreshCw, Download, X } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

const NotificationHistory = ({ userId = 1 }) => {
  const {
    notifications,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    clearError
  } = useNotifications(userId);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Tipos de notificação para filtro
  const notificationTypes = [
    { value: 'all', label: 'Todos os tipos' },
    { value: 'equipment_failure', label: 'Falhas de Equipamento' },
    { value: 'maintenance_due', label: 'Manutenção Vencida' },
    { value: 'service_order_assigned', label: 'OS Atribuída' },
    { value: 'service_order_completed', label: 'OS Concluída' },
    { value: 'system_alerts', label: 'Alertas do Sistema' }
  ];

  // Filtros de data
  const dateFilters = [
    { value: 'all', label: 'Todas as datas' },
    { value: 'today', label: 'Hoje' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mês' },
    { value: 'quarter', label: 'Últimos 3 meses' }
  ];

  // Filtrar notificações
  const filteredNotifications = notifications.filter(notification => {
    // Filtro de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (!notification.title.toLowerCase().includes(searchLower) &&
          !notification.message.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    // Filtro de tipo
    if (typeFilter !== 'all' && notification.type !== typeFilter) {
      return false;
    }

    // Filtro de status
    if (statusFilter === 'read' && notification.is_read === 0) return false;
    if (statusFilter === 'unread' && notification.is_read === 1) return false;

    // Filtro de data
    if (dateFilter !== 'all') {
      const notificationDate = new Date(notification.created_at);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          if (notificationDate.toDateString() !== now.toDateString()) return false;
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (notificationDate < weekAgo) return false;
          break;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          if (notificationDate < monthAgo) return false;
          break;
        case 'quarter':
          const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          if (notificationDate < quarterAgo) return false;
          break;
      }
    }

    return true;
  });

  // Ordenar notificações
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    
    switch (sortBy) {
      case 'newest':
        return dateB - dateA;
      case 'oldest':
        return dateA - dateB;
      case 'title':
        return a.title.localeCompare(b.title);
      case 'type':
        return a.type.localeCompare(b.type);
      default:
        return dateB - dateA;
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

  // Atualizar lista
  const refresh = async () => {
    try {
      setPage(1);
      await fetchNotifications(1);
      setHasMore(true);
    } catch (error) {
      console.error('Erro ao atualizar notificações:', error);
    }
  };

  // Exportar histórico
  const exportHistory = () => {
    const csvContent = [
      ['Data', 'Título', 'Mensagem', 'Tipo', 'Status'],
      ...sortedNotifications.map(n => [
        new Date(n.created_at).toLocaleString('pt-BR'),
        n.title,
        n.message,
        n.type,
        n.is_read ? 'Lida' : 'Não lida'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historico-notificacoes-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Formatar data
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obter ícone por tipo
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'equipment_failure': return '⚠️';
      case 'maintenance_due': return '🔧';
      case 'service_order_assigned': return '📋';
      case 'service_order_completed': return '✅';
      case 'system_alerts': return '🔔';
      default: return '📢';
    }
  };

  // Obter cor por tipo
  const getNotificationColor = (type) => {
    switch (type) {
      case 'equipment_failure': return 'text-red-600 bg-red-50';
      case 'maintenance_due': return 'text-yellow-600 bg-yellow-50';
      case 'service_order_assigned': return 'text-blue-600 bg-blue-50';
      case 'service_order_completed': return 'text-green-600 bg-green-50';
      case 'system_alerts': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <History className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            Histórico de Notificações
          </h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={exportHistory}
            disabled={sortedNotifications.length === 0}
            className="flex items-center space-x-1 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </button>
          
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Busca */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título ou mensagem..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filtro de tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {notificationTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="unread">Não lidas</option>
              <option value="read">Lidas</option>
            </select>
          </div>

          {/* Filtro de data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Período
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {dateFilters.map(filter => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ordenação */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigas</option>
              <option value="title">Título</option>
              <option value="type">Tipo</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            {sortedNotifications.length} de {notifications.length} notificações
          </div>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : sortedNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <History className="h-8 w-8 mb-2" />
            <p>Nenhuma notificação encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  notification.is_read === 0 ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Ícone */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-medium ${
                        notification.is_read === 0 ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                      </h3>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.created_at)}
                        </span>
                        
                        {notification.is_read === 0 ? (
                          <EyeOff className="h-4 w-4 text-blue-600" title="Não lida" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" title="Lida" />
                        )}
                      </div>
                    </div>
                    
                    <p className={`text-sm mt-1 ${
                      notification.is_read === 0 ? 'text-gray-700' : 'text-gray-500'
                    }`}>
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {notificationTypes.find(t => t.value === notification.type)?.label || notification.type}
                      </span>
                      
                      {notification.is_read === 0 && (
                        <button
                          onClick={() => markAsRead(notification.id)}
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
            {hasMore && (
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
  );
};

export default NotificationHistory;