import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/users');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar usuários');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar usuário');
      }

      const newUser = await response.json();
      setUsers(prev => [...prev, newUser]);
      toast.success('Usuário criado com sucesso!');
      return newUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar usuário';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateUser = async (id: number, userData: Partial<User>) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar usuário');
      }

      const updatedUser = await response.json();
      setUsers(prev => prev.map(user => user.id === id ? updatedUser : user));
      toast.success('Usuário atualizado com sucesso!');
      return updatedUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar usuário';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteUser = async (id: number) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      if (response.status === 409) {
        const errorData = await response.json();
        const dependencyCount = errorData.dependencyCount || 0;
        
        toast.error(
          `Não é possível excluir este usuário pois ele possui ${dependencyCount} registro(s) vinculado(s).`,
          {
            action: {
              label: 'Ver dependências',
              onClick: () => {
                window.location.href = `/validacao/dependencias/users/${id}`;
              }
            }
          }
        );
        return false;
      }

      if (!response.ok) {
        throw new Error('Erro ao excluir usuário');
      }

      setUsers(prev => prev.filter(user => user.id !== id));
      toast.success('Usuário excluído com sucesso!');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir usuário';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deactivateUser = async (id: number) => {
    try {
      const response = await fetch(`/api/users/${id}/deactivate`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Erro ao desativar usuário');
      }

      const deactivatedUser = await response.json();
      setUsers(prev => prev.map(user => user.id === id ? deactivatedUser : user));
      toast.success('Usuário desativado com sucesso!');
      return deactivatedUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao desativar usuário';
      toast.error(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    deactivateUser,
  };
}