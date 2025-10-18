import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Alert {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  severity: 'low' | 'medium' | 'high' | 'critical';
  entity_type?: string;
  entity_id?: number;
  is_read: boolean;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/alerts');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar alertas');
      }
      
      const data = await response.json();
      setAlerts(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async (alertData: Omit<Alert, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar alerta');
      }

      const newAlert = await response.json();
      setAlerts(prev => [...prev, newAlert]);
      toast.success('Alerta criado com sucesso!');
      return newAlert;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar alerta';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateAlert = async (id: number, alertData: Partial<Alert>) => {
    try {
      const response = await fetch(`/api/alerts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar alerta');
      }

      const updatedAlert = await response.json();
      setAlerts(prev => prev.map(alert => alert.id === id ? updatedAlert : alert));
      toast.success('Alerta atualizado com sucesso!');
      return updatedAlert;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar alerta';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteAlert = async (id: number) => {
    try {
      const response = await fetch(`/api/alerts/${id}`, {
        method: 'DELETE',
      });

      if (response.status === 409) {
        const errorData = await response.json();
        const dependencyCount = errorData.dependencyCount || 0;
        
        toast.error(
          `Não é possível excluir este alerta pois ele possui ${dependencyCount} registro(s) vinculado(s).`,
          {
            action: {
              label: 'Ver dependências',
              onClick: () => {
                window.location.href = `/validacao/dependencias/alerts/${id}`;
              }
            }
          }
        );
        return false;
      }

      if (!response.ok) {
        throw new Error('Erro ao excluir alerta');
      }

      setAlerts(prev => prev.filter(alert => alert.id !== id));
      toast.success('Alerta excluído com sucesso!');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir alerta';
      toast.error(errorMessage);
      throw err;
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const response = await fetch(`/api/alerts/${id}/read`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Erro ao marcar alerta como lido');
      }

      const updatedAlert = await response.json();
      setAlerts(prev => prev.map(alert => alert.id === id ? updatedAlert : alert));
      return updatedAlert;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao marcar alerta como lido';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deactivateAlert = async (id: number) => {
    try {
      const response = await fetch(`/api/alerts/${id}/deactivate`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Erro ao desativar alerta');
      }

      const deactivatedAlert = await response.json();
      setAlerts(prev => prev.map(alert => alert.id === id ? deactivatedAlert : alert));
      toast.success('Alerta desativado com sucesso!');
      return deactivatedAlert;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao desativar alerta';
      toast.error(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return {
    alerts,
    loading,
    error,
    refetch: fetchAlerts,
    createAlert,
    updateAlert,
    deleteAlert,
    markAsRead,
    deactivateAlert,
  };
}