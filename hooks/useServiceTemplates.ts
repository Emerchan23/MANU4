import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface ServiceTemplate {
  id: number;
  name: string;
  description?: string;
  category_id: number;
  estimated_duration?: number;
  instructions?: string;
  required_specialties?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useServiceTemplates() {
  const [serviceTemplates, setServiceTemplates] = useState<ServiceTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServiceTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/service-templates');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar templates de serviço');
      }
      
      const result = await response.json();
      setServiceTemplates(result.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createServiceTemplate = async (templateData: Omit<ServiceTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('/api/service-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar template de serviço');
      }

      const newTemplate = await response.json();
      setServiceTemplates(prev => [...prev, newTemplate]);
      toast.success('Template de serviço criado com sucesso!');
      return newTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar template de serviço';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateServiceTemplate = async (id: number, templateData: Partial<ServiceTemplate>) => {
    try {
      const response = await fetch(`/api/service-templates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar template de serviço');
      }

      const updatedTemplate = await response.json();
      setServiceTemplates(prev => prev.map(template => template.id === id ? updatedTemplate : template));
      toast.success('Template de serviço atualizado com sucesso!');
      return updatedTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar template de serviço';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteServiceTemplate = async (id: number) => {
    try {
      const response = await fetch(`/api/service-templates/${id}`, {
        method: 'DELETE',
      });

      if (response.status === 409) {
        const errorData = await response.json();
        const dependencyCount = errorData.dependencyCount || 0;
        
        toast.error(
          `Não é possível excluir este template pois ele possui ${dependencyCount} registro(s) vinculado(s).`,
          {
            action: {
              label: 'Ver dependências',
              onClick: () => {
                window.location.href = `/validacao/dependencias/service_templates/${id}`;
              }
            }
          }
        );
        return false;
      }

      if (!response.ok) {
        throw new Error('Erro ao excluir template de serviço');
      }

      setServiceTemplates(prev => prev.filter(template => template.id !== id));
      toast.success('Template de serviço excluído com sucesso!');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir template de serviço';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deactivateServiceTemplate = async (id: number) => {
    try {
      const response = await fetch(`/api/service-templates/${id}/deactivate`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Erro ao desativar template de serviço');
      }

      const deactivatedTemplate = await response.json();
      setServiceTemplates(prev => prev.map(template => template.id === id ? deactivatedTemplate : template));
      toast.success('Template de serviço desativado com sucesso!');
      return deactivatedTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao desativar template de serviço';
      toast.error(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchServiceTemplates();
  }, []);

  return {
    serviceTemplates,
    loading,
    error,
    refetch: fetchServiceTemplates,
    createServiceTemplate,
    updateServiceTemplate,
    deleteServiceTemplate,
    deactivateServiceTemplate,
  };
}