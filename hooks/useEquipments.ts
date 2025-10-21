import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Equipment, EquipmentFormData } from '../types/equipment';

export const useEquipments = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar todos os equipamentos
  const fetchEquipments = async () => {
    console.log('🔍 Iniciando busca de equipamentos...');
    setLoading(true);
    setError(null);
    try {
      console.log('📡 Fazendo requisição para /api/equipment');
      const response = await fetch('/api/equipment');
      console.log('📥 Resposta recebida:', response.status, response.statusText);
      const data = await response.json();
      console.log('📊 Dados recebidos:', data);
      
      if (data.success) {
        console.log('✅ Equipamentos carregados:', data.data.length, 'itens');
        setEquipments(data.data);
      } else {
        console.log('❌ Erro na resposta:', data.message);
        setError(data.message || 'Erro ao carregar equipamentos');
        toast.error('Erro ao carregar equipamentos');
      }
    } catch (err) {
      console.log('💥 Erro de conexão:', err);
      setError('Erro de conexão');
      toast.error('Erro ao carregar equipamentos');
      console.error('Erro ao buscar equipamentos:', err);
    } finally {
      setLoading(false);
      console.log('🏁 Busca de equipamentos finalizada');
    }
  };

  // Buscar equipamento por ID
  const fetchEquipmentById = async (id: number): Promise<Equipment | null> => {
    console.log('🔍 Buscando equipamento por ID:', id);
    try {
      const response = await fetch(`/api/equipment/${id}`);
      console.log('📡 Resposta da API:', response.status);
      const data = await response.json();
      console.log('📊 Dados recebidos:', data);
      
      if (data.success && data.data) {
        console.log('✅ Equipamento encontrado:', data.data);
        return data.data;
      } else {
        console.log('❌ Equipamento não encontrado:', data.message);
        setError(data.message || 'Equipamento não encontrado');
        return null;
      }
    } catch (err) {
      console.error('💥 Erro ao buscar equipamento:', err);
      setError('Erro de conexão');
      return null;
    }
  };

  // Criar novo equipamento
  const createEquipment = async (equipmentData: EquipmentFormData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/equipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(equipmentData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Equipamento criado com sucesso!');
        await fetchEquipments(); // Recarregar lista
        return true;
      } else {
        setError(data.message || 'Erro ao criar equipamento');
        toast.error(data.message || 'Erro ao criar equipamento');
        return false;
      }
    } catch (err) {
      setError('Erro de conexão');
      toast.error('Erro ao criar equipamento');
      console.error('Erro ao criar equipamento:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Atualizar equipamento
  const updateEquipment = async (id: number, equipmentData: EquipmentFormData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Enviando dados para atualização:', equipmentData);
      
      const response = await fetch(`/api/equipment/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(equipmentData),
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);
      
      if (!response.ok) {
        console.error('❌ Response não OK:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseText = await response.text();
      console.log('📄 Response text:', responseText);
      
      if (!responseText) {
        throw new Error('Resposta vazia do servidor');
      }
      
      const data = JSON.parse(responseText);
      console.log('📊 Dados parseados:', data);
      
      if (data.success) {
        toast.success('Equipamento atualizado com sucesso!');
        await fetchEquipments(); // Recarregar lista
        return true;
      } else {
        setError(data.message || 'Erro ao atualizar equipamento');
        toast.error(data.message || 'Erro ao atualizar equipamento');
        return false;
      }
    } catch (err) {
      setError('Erro de conexão');
      toast.error('Erro ao atualizar equipamento');
      console.error('Erro ao atualizar equipamento:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Deletar equipamento
  const deleteEquipment = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/equipment/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Equipamento excluído com sucesso!');
        await fetchEquipments(); // Recarregar lista
        return true;
      } else {
        // Handle referential integrity conflicts
        if (response.status === 409) {
          const dependencyCount = data.dependencyCount || 0;
          toast.error(`Não é possível excluir o equipamento. Existem ${dependencyCount} registros vinculados.`, {
            action: {
              label: 'Ver Dependências',
              onClick: () => window.open(`/validacao/dependencias/equipment/${id}`, '_blank')
            }
          });
          return false;
        }
        
        setError(data.message || 'Erro ao deletar equipamento');
        toast.error(data.message || 'Erro ao deletar equipamento');
        return false;
      }
    } catch (err) {
      setError('Erro de conexão');
      toast.error('Erro ao deletar equipamento');
      console.error('Erro ao deletar equipamento:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Carregar equipamentos na inicialização
  useEffect(() => {
    fetchEquipments();
  }, []);

  return {
    equipments,
    loading,
    error,
    fetchEquipments,
    fetchEquipmentById,
    createEquipment,
    updateEquipment,
    deleteEquipment,
  };
};