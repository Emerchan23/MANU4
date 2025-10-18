import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';

interface ReportStat {
  name: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
}

interface MaintenanceChartData {
  date: string;
  PREVENTIVA: number;
  CORRETIVA: number;
  CALIBRACAO: number;
  INSTALACAO: number;
}

interface CostChartData {
  equipmentCosts: Array<{
    name: string;
    equipment_id: number;
    sector: string;
    cost: number;
    maintenances: number;
  }>;
  periodCosts: Array<{
    date: string;
    cost: number;
    orders: number;
  }>;
  sectorCosts: Array<{
    name: string;
    sector_id: number;
    cost: number;
    maintenances: number;
    equipments: number;
  }>;
  summary: {
    totalCost: number;
    averageCostPerEquipment: number;
    averageCostPerMaintenance: number;
    totalMaintenances: number;
    period: string;
    sector: string;
  };
}

interface SectorPerformanceData {
  sectorPerformance: Array<{
    sector_id: number;
    sector_name: string;
    total_equipment: number;
    total_orders: number;
    completed_orders: number;
    open_orders: number;
    in_progress_orders: number;
    high_priority_orders: number;
    completion_rate: number;
    avg_resolution_time_hours: number;
    total_cost: number;
    preventive_count: number;
    corrective_count: number;
    preventive_ratio: number;
  }>;
  technicianPerformance: any;
  summary: {
    totalEquipment: number;
    totalOrders: number;
    totalCompletedOrders: number;
    overallCompletionRate: number;
    totalCost: number;
    avgResolutionTime: number;
    bestPerformingSector: string;
    worstPerformingSector: string;
    period: string;
    sector: string;
  };
}

interface EquipmentStatusData {
  equipmentList: Array<{
    id: number;
    name: string;
    model: string;
    serial_number: string;
    status: string;
    location: string;
    sector_name: string;
    sector_id: number;
    total_orders: number;
    open_orders: number;
    in_progress_orders: number;
    completed_orders: number;
    high_priority_orders: number;
    last_maintenance_date: string | null;
    total_cost: number;
    preventive_count: number;
    corrective_count: number;
    health_score: number;
  }>;
  statusSummary: Array<{
    status: string;
    count: number;
    with_open_orders: number;
    with_high_priority: number;
  }>;
  criticalEquipment: Array<{
    id: number;
    name: string;
    status: string;
    sector_name: string;
    total_issues: number;
    open_issues: number;
    high_priority_issues: number;
    total_cost: number;
    last_issue_date: string | null;
    criticality_score: number;
  }>;
  summary: {
    totalEquipment: number;
    activeEquipment: number;
    inactiveEquipment: number;
    maintenanceEquipment: number;
    equipmentWithIssues: number;
    totalCost: number;
    averageHealthScore: number;
    activePercentage: number;
    period: string;
    sector: string;
  };
}

interface PriorityAlert {
  equipment: string;
  sector: string;
  type: string;
  priority: string;
  days_overdue: number;
}

// Hook para estatísticas de relatórios
export function useReportsStats(dateRange: string = '30', sectorId: string = 'ALL') {
  const [stats, setStats] = useState<ReportStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams({
          dateRange,
          ...(sectorId !== 'ALL' && { sectorId })
        });
        
        const data = await apiCall(`/api/reports/stats?${params}`);
        
        // Validar se os dados necessários existem
        if (!data || !data.currentPeriod || !data.comparison) {
          throw new Error('Dados de estatísticas incompletos recebidos da API');
        }
        
        // Transformar dados da API para o formato esperado pelo componente
        const transformedStats: ReportStat[] = [
          {
            name: 'Total de Equipamentos',
            value: (data.currentPeriod?.totalEquipment || 0).toString(),
            change: data.comparison?.equipmentChange || '0%',
            changeType: (data.comparison?.equipmentChange || '').startsWith('+') ? 'positive' : 
                       (data.comparison?.equipmentChange || '').startsWith('-') ? 'negative' : 'neutral'
          },
          {
            name: 'Ordens Abertas',
            value: (data.currentPeriod?.openOrders || 0).toString(),
            change: data.comparison?.ordersChange || '0%',
            changeType: (data.comparison?.ordersChange || '').startsWith('+') ? 'negative' : 
                       (data.comparison?.ordersChange || '').startsWith('-') ? 'positive' : 'neutral'
          },
          {
            name: 'Custo Total',
            value: `R$ ${(data.currentPeriod?.totalCost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            change: data.comparison?.costChange || '0%',
            changeType: (data.comparison?.costChange || '').startsWith('+') ? 'negative' : 
                       (data.comparison?.costChange || '').startsWith('-') ? 'positive' : 'neutral'
          },
          {
            name: 'Tempo Médio (horas)',
            value: (data.currentPeriod?.avgResolutionTime || 0).toFixed(1),
            change: data.comparison?.timeChange || '0%',
            changeType: (data.comparison?.timeChange || '').startsWith('+') ? 'negative' : 
                       (data.comparison?.timeChange || '').startsWith('-') ? 'positive' : 'neutral'
          }
        ];
        
        setStats(transformedStats);
      } catch (err) {
        console.error('Erro ao buscar estatísticas de relatórios:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [dateRange, sectorId]);

  return { stats, loading, error };
}

// Hook para dados do gráfico de manutenções
export function useMaintenanceChart(dateRange: string = '30', sectorId: string = 'ALL') {
  const [data, setData] = useState<MaintenanceChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams({
          dateRange,
          ...(sectorId !== 'ALL' && { sectorId })
        });
        
        const result = await apiCall(`/api/reports/maintenance-chart?${params}`);
        setData(result.data || []);
      } catch (err) {
        console.error('Erro ao buscar dados do gráfico de manutenções:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, sectorId]);

  return { data, loading, error };
}

// Hook para dados do gráfico de custos
export function useCostChart(dateRange: string = '30', sectorId: string = 'ALL') {
  const [data, setData] = useState<CostChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams({
          dateRange,
          ...(sectorId !== 'ALL' && { sectorId })
        });
        
        const result = await apiCall(`/api/reports/cost-chart?${params}`);
        setData(result);
      } catch (err) {
        console.error('Erro ao buscar dados do gráfico de custos:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, sectorId]);

  return { data, loading, error };
}

// Hook para performance por setor
export function useSectorPerformance(dateRange: string = '30', sectorId: string = 'ALL') {
  const [data, setData] = useState<SectorPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams({
          dateRange,
          ...(sectorId !== 'ALL' && { sectorId })
        });
        
        const result = await apiCall(`/api/reports/sector-performance?${params}`);
        setData(result);
      } catch (err) {
        console.error('Erro ao buscar performance por setor:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, sectorId]);

  return { data, loading, error };
}

// Hook para status dos equipamentos
export function useEquipmentStatus(dateRange: string = '30', sectorId: string = 'ALL') {
  const [data, setData] = useState<EquipmentStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const params = new URLSearchParams({
          dateRange,
          ...(sectorId !== 'ALL' && { sectorId })
        });
        
        const result = await apiCall(`/api/reports/equipment-status?${params}`);
        setData(result);
      } catch (err) {
        console.error('Erro ao buscar status dos equipamentos:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateRange, sectorId]);

  return { data, loading, error };
}

// Hook para alertas prioritários
export function usePriorityAlerts() {
  const [alerts, setAlerts] = useState<PriorityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Usar a API de alertas existente para buscar alertas prioritários
        const result = await apiCall('/alerts?priority=ALTA&status=ATIVO&limit=10');
        
        // Transformar dados da API de alertas para o formato esperado
        const transformedAlerts: PriorityAlert[] = (result.data || []).map((alert: any) => ({
          equipment: alert.equipment_name || 'N/A',
          sector: alert.sector_name || 'N/A',
          type: alert.tipo || 'MANUTENCAO',
          priority: alert.prioridade || 'ALTA',
          days_overdue: alert.dias_atraso || 0
        }));
        
        setAlerts(transformedAlerts);
      } catch (err) {
        console.error('Erro ao buscar alertas prioritários:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  return { alerts, loading, error };
}