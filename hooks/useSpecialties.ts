import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Specialty {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useSpecialties() {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSpecialties = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/specialties');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar especialidades');
      }
      
      const data = await response.json();
      setSpecialties(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createSpecialty = async (specialtyData: Omit<Specialty, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('/api/specialties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(specialtyData),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar especialidade');
      }

      const newSpecialty = await response.json();
      setSpecialties(prev => [...prev, newSpecialty]);
      toast.success('Especialidade criada com sucesso!');
      return newSpecialty;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar especialidade';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateSpecialty = async (id: number, specialtyData: Partial<Specialty>) => {
    try {
      const response = await fetch(`/api/specialties/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(specialtyData),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar especialidade');
      }

      const updatedSpecialty = await response.json();
      setSpecialties(prev => prev.map(specialty => specialty.id === id ? updatedSpecialty : specialty));
      toast.success('Especialidade atualizada com sucesso!');
      return updatedSpecialty;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar especialidade';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteSpecialty = async (id: number) => {
    try {
      const response = await fetch(`/api/specialties/${id}`, {
        method: 'DELETE',
      });

      if (response.status === 409) {
        const errorData = await response.json();
        const dependencyCount = errorData.dependencyCount || 0;
        
        toast.error(
          `Não é possível excluir esta especialidade pois ela possui ${dependencyCount} registro(s) vinculado(s).`,
          {
            action: {
              label: 'Ver dependências',
              onClick: () => {
                window.location.href = `/validacao/dependencias/specialties/${id}`;
              }
            }
          }
        );
        return false;
      }

      if (!response.ok) {
        throw new Error('Erro ao excluir especialidade');
      }

      setSpecialties(prev => prev.filter(specialty => specialty.id !== id));
      toast.success('Especialidade excluída com sucesso!');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir especialidade';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deactivateSpecialty = async (id: number) => {
    try {
      const response = await fetch(`/api/specialties/${id}/deactivate`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Erro ao desativar especialidade');
      }

      const deactivatedSpecialty = await response.json();
      setSpecialties(prev => prev.map(specialty => specialty.id === id ? deactivatedSpecialty : specialty));
      toast.success('Especialidade desativada com sucesso!');
      return deactivatedSpecialty;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao desativar especialidade';
      toast.error(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchSpecialties();
  }, []);

  return {
    specialties,
    loading,
    error,
    refetch: fetchSpecialties,
    createSpecialty,
    updateSpecialty,
    deleteSpecialty,
    deactivateSpecialty,
  };
}