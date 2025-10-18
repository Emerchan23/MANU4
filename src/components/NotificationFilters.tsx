// Componente de filtros para notificações
import React, { useState } from 'react';
import { Filter, X, Calendar, Tag, AlertCircle } from 'lucide-react';
import { DateInput } from '@/components/ui/date-input';
import { formatDateBR } from '@/lib/date-utils';

export interface NotificationFilters {
  type?: string;
  priority?: string;
  read_status?: string;
  date_from?: string;
  date_to?: string;
}

interface NotificationFiltersProps {
  filters: NotificationFilters;
  onApplyFilters: (filters: NotificationFilters) => void;
}

export function NotificationFilters({ filters, onApplyFilters }: NotificationFiltersProps) {
  const [localFilters, setLocalFilters] = useState<NotificationFilters>(filters);

  const notificationTypes = [
    { value: 'equipment_alert', label: 'Alerta de Equipamento' },
    { value: 'service_order_update', label: 'Ordem de Serviço' },
    { value: 'maintenance_due', label: 'Manutenção Programada' },
    { value: 'maintenance_overdue', label: 'Manutenção Vencida' },
    { value: 'system_alert', label: 'Alerta do Sistema' }
  ];

  const priorities = [
    { value: 'critical', label: 'Crítica', color: 'text-red-600' },
    { value: 'high', label: 'Alta', color: 'text-orange-600' },
    { value: 'medium', label: 'Média', color: 'text-yellow-600' },
    { value: 'low', label: 'Baixa', color: 'text-blue-600' }
  ];

  const readStatuses = [
    { value: 'sent', label: 'Enviada' },
    { value: 'delivered', label: 'Entregue' },
    { value: 'read', label: 'Lida' }
  ];

  const handleFilterChange = (key: keyof NotificationFilters, value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
  };

  const handleClear = () => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    onApplyFilters(clearedFilters);
  };

  const hasActiveFilters = Object.values(localFilters).some(value => value);

  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <h3 className="font-medium text-gray-900">Filtros</h3>
          {hasActiveFilters && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              Ativo
            </span>
          )}
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
          >
            <X className="w-3 h-3" />
            <span>Limpar</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Tag className="w-4 h-4 inline mr-1" />
            Tipo
          </label>
          <select
            value={localFilters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os tipos</option>
            {notificationTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Prioridade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Prioridade
          </label>
          <select
            value={localFilters.priority || ''}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas as prioridades</option>
            {priorities.map(priority => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status de leitura */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={localFilters.read_status || ''}
            onChange={(e) => handleFilterChange('read_status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os status</option>
            <option value="unread">Não lidas</option>
            <option value="read">Lidas</option>
            {readStatuses.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Data inicial */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="w-4 h-4 inline mr-1" />
            Data inicial
          </label>
          <DateInput
            placeholder="dd/mm/aaaa"
            value={localFilters.date_from || ''}
            onChange={(value) => handleFilterChange('date_from', value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Data final */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="w-4 h-4 inline mr-1" />
            Data final
          </label>
          <DateInput
            placeholder="dd/mm/aaaa"
            value={localFilters.date_to || ''}
            onChange={(value) => handleFilterChange('date_to', value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex items-center justify-end space-x-3 pt-2 border-t">
        <button
          onClick={handleClear}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Limpar
        </button>
        <button
          onClick={handleApply}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Aplicar Filtros
        </button>
      </div>

      {/* Resumo dos filtros ativos */}
      {hasActiveFilters && (
        <div className="pt-2 border-t">
          <div className="flex flex-wrap gap-2">
            {localFilters.type && (
              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Tipo: {notificationTypes.find(t => t.value === localFilters.type)?.label}
                <button
                  onClick={() => handleFilterChange('type', '')}
                  className="ml-1 hover:text-blue-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {localFilters.priority && (
              <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                Prioridade: {priorities.find(p => p.value === localFilters.priority)?.label}
                <button
                  onClick={() => handleFilterChange('priority', '')}
                  className="ml-1 hover:text-orange-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {localFilters.read_status && (
              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Status: {localFilters.read_status === 'unread' ? 'Não lidas' : 
                        localFilters.read_status === 'read' ? 'Lidas' :
                        readStatuses.find(s => s.value === localFilters.read_status)?.label}
                <button
                  onClick={() => handleFilterChange('read_status', '')}
                  className="ml-1 hover:text-green-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {localFilters.date_from && (
              <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                De: {new Date(localFilters.date_from).toLocaleDateString('pt-BR')}
                <button
                  onClick={() => handleFilterChange('date_from', '')}
                  className="ml-1 hover:text-purple-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {localFilters.date_to && (
              <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                Até: {new Date(localFilters.date_to).toLocaleDateString('pt-BR')}
                <button
                  onClick={() => handleFilterChange('date_to', '')}
                  className="ml-1 hover:text-purple-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}