'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import EquipmentForm from '../../../../components/equipment/equipment-form';
import { Equipment } from '../../../../types/equipment';

export default function EditEquipmentPage() {
  const params = useParams();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEquipment = async () => {
      if (params.id) {
        setLoading(true);
        setError(null);
        try {
          console.log('🔍 Carregando equipamento ID:', params.id);
          const response = await fetch(`/api/equipment/${params.id}`);
          console.log('📡 Resposta da API:', response.status, response.statusText);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('📊 Dados recebidos:', data);
          
          if (data.success && data.data) {
            console.log('✅ Equipamento carregado com sucesso');
            setEquipment(data.data);
          } else {
            console.log('❌ Erro na resposta:', data.message);
            setError(data.message || 'Equipamento não encontrado');
          }
        } catch (error) {
          console.error('💥 Erro ao carregar equipamento:', error);
          setError('Erro de conexão ao carregar equipamento');
        } finally {
          setLoading(false);
        }
      }
    };

    loadEquipment();
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center p-8">
          <div className="text-lg">Carregando equipamento...</div>
        </div>
      </div>
    );
  }

  if (error || !equipment) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center p-8">
          <div className="text-red-600">{error || 'Equipamento não encontrado'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <EquipmentForm equipment={equipment} />
    </div>
  );
}