'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Filter,
  Eye,
  ChevronDown,
  ChevronUp,
  Activity,
  Wrench,
  BarChart3
} from 'lucide-react';

interface MaintenanceRecord {
  id: number;
  scheduled_date: string;
  completed_at?: string;
  status: 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';
  priority: 'baixa' | 'media' | 'alta' | 'critica';
  estimated_cost?: number;
  actual_cost?: number;
  actual_duration_hours?: number;
  completion_notes?: string;
  issues_found?: string;
  recommendations?: string;
  maintenance_type: string;
  maintenance_category: 'preventiva' | 'corretiva' | 'calibracao';
  company_name?: string;
  technician_name?: string;
  completed_by_name?: string;
}

interface EquipmentStats {
  equipment_id: number;
  total_maintenances: number;
  preventive_count: number;
  corrective_count: number;
  predictive_count: number;
  total_cost: number;
  average_cost: number;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  average_interval_days?: number;
  success_rate: number;
  downtime_hours: number;
  mttr_hours?: number;
}

interface EquipmentHistoryProps {
  equipmentId: number;
  equipmentName?: string;
  mode?: 'compact' | 'full';
  showFilters?: boolean;
  maxItems?: number;
  onViewFullHistory?: () => void;
  className?: string;
}

interface FilterState {
  type: string;
  status: string;
  startDate: string;
  endDate: string;
}

const EquipmentHistory: React.FC<EquipmentHistoryProps> = ({
  equipmentId,
  equipmentName,
  mode = 'compact',
  showFilters = false,
  maxItems = 5,
  onViewFullHistory,
  className = ''
}) => {
  const [history, setHistory] = useState<MaintenanceRecord[]>([]);
  const [stats, setStats] = useState<EquipmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    type: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  // Buscar dados do equipamento
  useEffect(() => {
    if (!equipmentId) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Buscar histórico e estatísticas em paralelo
        const [historyResponse, statsResponse] = await Promise.all([
          fetch(`/api/equipment/${equipmentId}/history?limit=${maxItems}&${new URLSearchParams(filters)}`),
          fetch(`/api/equipment/${equipmentId}/stats`)
        ]);

        if (!historyResponse.ok || !statsResponse.ok) {
          throw new Error('Erro ao carregar dados do equipamento');
        }

        const historyData = await historyResponse.json();
        const statsData = await statsResponse.json();

        if (historyData.success) {
          setHistory(historyData.data.history);
        }

        if (statsData.success) {
          setStats(statsData.data.stats);
        }

      } catch (err) {
        console.error('Erro ao carregar histórico:', err);
        setError('Erro ao carregar histórico do equipamento');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [equipmentId, maxItems, filters]);

  // Função para obter cor baseada no status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'em_andamento':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'agendada':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'cancelada':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Função para obter cor baseada na prioridade
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critica':
        return 'text-red-700 bg-red-100';
      case 'alta':
        return 'text-orange-700 bg-orange-100';
      case 'media':
        return 'text-yellow-700 bg-yellow-100';
      case 'baixa':
        return 'text-green-700 bg-green-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  // Função para obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluida':
        return <CheckCircle className="w-4 h-4" />;
      case 'em_andamento':
        return <Activity className="w-4 h-4" />;
      case 'agendada':
        return <Clock className="w-4 h-4" />;
      case 'cancelada':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Função para aplicar filtros
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Renderizar estatísticas resumidas
  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total</p>
              <p className="text-2xl font-bold text-blue-700">{stats.total_maintenances}</p>
            </div>
            <Wrench className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Taxa Sucesso</p>
              <p className="text-2xl font-bold text-green-700">{stats.success_rate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Custo Total</p>
              <p className="text-2xl font-bold text-yellow-700">
                R$ {stats.total_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Intervalo Médio</p>
              <p className="text-2xl font-bold text-purple-700">
                {stats.average_interval_days ? `${stats.average_interval_days}d` : 'N/A'}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>
    );
  };

  // Renderizar filtros
  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <div className="mb-4">
        <button
          onClick={() => setShowFiltersPanel(!showFiltersPanel)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filtros
          {showFiltersPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showFiltersPanel && (
          <div className="mt-3 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="preventiva">Preventiva</option>
                  <option value="corretiva">Corretiva</option>
                  <option value="calibracao">Calibração</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="agendada">Agendada</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluida">Concluída</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Início
                </label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Fim
                </label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Renderizar timeline de manutenções
  const renderTimeline = () => {
    if (history.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Nenhuma manutenção encontrada</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {history.map((record, index) => (
          <div key={record.id} className="relative">
            {/* Linha da timeline */}
            {index < history.length - 1 && (
              <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200"></div>
            )}
            
            <div className="flex items-start gap-4">
              {/* Ícone do status */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${getStatusColor(record.status)}`}>
                {getStatusIcon(record.status)}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{record.maintenance_type}</h4>
                      <p className="text-sm text-gray-600">
                        {format(new Date(record.scheduled_date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(record.priority)}`}>
                        {record.priority.charAt(0).toUpperCase() + record.priority.slice(1)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                        {record.status.replace('_', ' ').charAt(0).toUpperCase() + record.status.replace('_', ' ').slice(1)}
                      </span>
                    </div>
                  </div>

                  {mode === 'full' && (
                    <div className="space-y-2 text-sm text-gray-600">
                      {record.company_name && (
                        <p><span className="font-medium">Empresa:</span> {record.company_name}</p>
                      )}
                      {record.technician_name && (
                        <p><span className="font-medium">Técnico:</span> {record.technician_name}</p>
                      )}
                      {record.actual_cost && (
                        <p><span className="font-medium">Custo:</span> R$ {record.actual_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      )}
                      {record.actual_duration_hours && (
                        <p><span className="font-medium">Duração:</span> {record.actual_duration_hours}h</p>
                      )}
                      {record.completion_notes && (
                        <p><span className="font-medium">Observações:</span> {record.completion_notes}</p>
                      )}
                      {record.issues_found && (
                        <p><span className="font-medium text-red-600">Problemas:</span> {record.issues_found}</p>
                      )}
                      {record.recommendations && (
                        <p><span className="font-medium text-blue-600">Recomendações:</span> {record.recommendations}</p>
                      )}
                    </div>
                  )}

                  {mode === 'compact' && record.actual_cost && (
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        R$ {record.actual_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      {record.actual_duration_hours && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {record.actual_duration_hours}h
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-20 rounded-lg"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1 bg-gray-200 h-24 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Histórico de Manutenção
          </h3>
          {equipmentName && (
            <p className="text-sm text-gray-600">{equipmentName}</p>
          )}
        </div>
        
        {onViewFullHistory && mode === 'compact' && (
          <button
            onClick={onViewFullHistory}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            Ver Histórico Completo
          </button>
        )}
      </div>

      {/* Estatísticas */}
      {renderStats()}

      {/* Filtros */}
      {renderFilters()}

      {/* Timeline */}
      {renderTimeline()}
    </div>
  );
};

export default EquipmentHistory;