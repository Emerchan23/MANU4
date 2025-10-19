import { useState, useEffect } from 'react';

export interface DashboardMetrics {
  equipmentsActive: number;
  pendingMaintenances: number;
  criticalAlerts: number;
  openServiceOrders: number;
}

export interface ChartData {
  monthlyStats: any[];
  costAnalysis: any[];
  companyPerformance: any[];
}

export interface DashboardData {
  metrics: DashboardMetrics;
  charts: ChartData;
}

export function useDashboardMetrics() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/dashboard/metrics');
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard metrics');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchMetrics,
  };
}