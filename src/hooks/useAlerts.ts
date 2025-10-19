import { useState, useEffect } from 'react';

export interface Alert {
  id: number;
  type: string;
  priority: string;
  description: string;
  dueDate: string;
  daysOverdue: number;
  status: string;
  equipment: {
    name: string;
    code: string;
  };
  sector: string;
}

export interface AlertStatistics {
  total: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  overdue: number;
}

export interface AlertsData {
  alerts: Alert[];
  statistics: AlertStatistics;
}

export function useAlerts() {
  const [data, setData] = useState<AlertsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/dashboard/alerts');
      
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
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
    fetchAlerts();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchAlerts,
  };
}