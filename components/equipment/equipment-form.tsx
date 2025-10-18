'use client';

import { useState, useEffect } from 'react';
import { Equipment, EquipmentFormData } from '../../types/equipment';
import { useEquipments } from '../../hooks/useEquipments';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { DateInput } from '../ui/date-input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { formatForHTMLInput, convertBRToISO, formatDateBR } from '@/lib/date-utils';

interface EquipmentFormProps {
  equipment?: Equipment;
  onSave?: (equipment: Equipment) => void;
  onCancel?: () => void;
}

interface Category {
  id: number;
  name: string;
  is_electrical?: boolean;
}

interface Sector {
  id: number;
  name: string;
}

interface Subsector {
  id: number;
  name: string;
  sector_id: number;
}

export default function EquipmentForm({ equipment, onSave, onCancel }: EquipmentFormProps) {
  const { createEquipment, updateEquipment, loading } = useEquipments();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [subsectors, setSubsectors] = useState<Subsector[]>([]);
  const [filteredSubsectors, setFilteredSubsectors] = useState<Subsector[]>([]);
  const [formData, setFormData] = useState<EquipmentFormData>({
    patrimonio_number: equipment?.patrimonio_number || '',
    name: equipment?.name || '',
    manufacturer: equipment?.manufacturer || '',
    model: equipment?.model || '',
    serial_number: equipment?.serial_number || '',
    category_id: equipment?.category_id || 0,
    sector_id: equipment?.sector_id || 0,
    subsector_id: equipment?.subsector_id || 0,
    installation_date: equipment?.installation_date ? equipment.installation_date.split('T')[0] : '',
    maintenance_frequency_days: equipment?.maintenance_frequency_days || 0,
    observations: equipment?.observations || '',
    voltage: equipment?.voltage || '',
    status: 'ativo'
  });

  // Atualizar formData quando equipment prop muda
  useEffect(() => {
    if (equipment) {
      console.log('🔄 Atualizando formData com dados do equipamento:', equipment);
      // Garantir que o patrimonio_number tenha o prefixo PAT
      let patrimonioNumber = equipment.patrimonio_number || '';
      if (patrimonioNumber && !patrimonioNumber.startsWith('PAT')) {
        patrimonioNumber = `PAT${patrimonioNumber}`;
      }
      
      setFormData({
        patrimonio_number: patrimonioNumber,
        name: equipment.name || '',
        manufacturer: equipment.manufacturer || '',
        model: equipment.model || '',
        serial_number: equipment.serial_number || '',
        category_id: equipment.category_id || 0,
        sector_id: equipment.sector_id || 0,
        subsector_id: equipment.subsector_id || 0,
        installation_date: equipment.installation_date ? equipment.installation_date.split('T')[0] : '',
        maintenance_frequency_days: equipment.maintenance_frequency_days || 0,
        observations: equipment.observations || '',
        voltage: equipment.voltage || '',
        status: equipment.status || 'ativo'
      });
    }
  }, [equipment]);

  // Carregar dados auxiliares
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Carregando dados auxiliares...');
        
        // Carregar categorias
        const categoriesResponse = await fetch('/api/categories');
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          console.log('✅ Categorias carregadas:', categoriesData);
          setCategories(categoriesData);
        } else {
          console.error('❌ Erro ao carregar categorias:', categoriesResponse.status);
        }

        // Carregar setores
        const sectorsResponse = await fetch('/api/sectors');
        if (sectorsResponse.ok) {
          const sectorsData = await sectorsResponse.json();
          console.log('✅ Setores carregados:', sectorsData);
          setSectors(sectorsData);
        } else {
          console.error('❌ Erro ao carregar setores:', sectorsResponse.status);
        }

        // Carregar subsetores
        const subsectorsResponse = await fetch('/api/subsectors');
        if (subsectorsResponse.ok) {
          const subsectorsData = await subsectorsResponse.json();
          console.log('✅ Subsetores carregados:', subsectorsData);
          setSubsectors(subsectorsData);
        } else {
          console.error('❌ Erro ao carregar subsetores:', subsectorsResponse.status);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados auxiliares:', error);
      }
    };

    loadData();
  }, []);

  // Atualizar subsetores filtrados quando dados auxiliares são carregados (especial para edição)
  useEffect(() => {
    if (equipment && equipment.sector_id && subsectors.length > 0) {
      const filtered = subsectors.filter(sub => sub.sector_id === equipment.sector_id);
      setFilteredSubsectors(filtered);
      console.log('🔄 Subsetores filtrados para edição:', filtered);
    }
  }, [equipment, subsectors]);

  // Filtrar subsetores baseado no setor selecionado
  useEffect(() => {
    if (formData.sector_id && subsectors.length > 0) {
      const filtered = subsectors.filter(sub => sub.sector_id === formData.sector_id);
      setFilteredSubsectors(filtered);
      
      // Só limpar o subsetor se não for uma edição inicial (quando equipment existe)
      // ou se o subsetor realmente não pertence ao setor
      if (formData.subsector_id && !filtered.find(sub => sub.id === formData.subsector_id)) {
        // Se estamos editando um equipamento, preservar o subsetor inicial
        if (!equipment || equipment.subsector_id !== formData.subsector_id) {
          setFormData(prev => ({ ...prev, subsector_id: 0 }));
        }
      }
    } else if (formData.sector_id) {
      // Se há setor mas ainda não carregou subsetores, aguardar
      setFilteredSubsectors([]);
    } else {
      // Se não há setor selecionado, limpar subsetores
      setFilteredSubsectors([]);
      if (!equipment) { // Só limpar se não estiver editando
        setFormData(prev => ({ ...prev, subsector_id: 0 }));
      }
    }
  }, [formData.sector_id, formData.subsector_id, subsectors, equipment]);

  // Verificar se a categoria selecionada é elétrica
  const selectedCategory = categories.find(cat => cat.id === formData.category_id);
  const isElectricalCategory = selectedCategory?.is_electrical || false;

  const handleInputChange = (field: keyof EquipmentFormData, value: any) => {
    // Tratamento especial para o campo patrimonio_number
    if (field === 'patrimonio_number') {
      // Remove o prefixo PAT se já existir para evitar duplicação
      let cleanValue = value.replace(/^PAT/i, '');
      // Adiciona o prefixo PAT automaticamente
      const finalValue = cleanValue ? `PAT${cleanValue}` : '';
      setFormData(prev => ({ ...prev, [field]: finalValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.name?.trim()) {
      alert('Nome do equipamento é obrigatório');
      return;
    }
    
    if (!formData.patrimonio_number?.trim()) {
      alert('Número do patrimônio é obrigatório');
      return;
    }

    try {
      let success = false;
      
      if (equipment?.id) {
        // Atualizar equipamento existente
        success = await updateEquipment(equipment.id, formData);
      } else {
        // Criar novo equipamento
        success = await createEquipment(formData);
      }

      if (success) {
        if (onSave) {
          // Se há callback, usar ele
          onSave(equipment || {} as Equipment);
        } else {
          // Navegar de volta para a lista
          router.push('/equipamentos');
        }
      }
    } catch (error) {
      console.error('Erro ao salvar equipamento:', error);
      alert('Erro ao salvar equipamento. Tente novamente.');
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/equipamentos');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">
          {equipment ? 'Editar Equipamento' : 'Novo Equipamento'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Equipamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patrimonio_number">Número do Patrimônio *</Label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                    PAT
                  </div>
                  <Input
                    id="patrimonio_number"
                    value={formData.patrimonio_number.replace(/^PAT/i, '')}
                    onChange={(e) => handleInputChange('patrimonio_number', e.target.value)}
                    placeholder="001"
                    className="pl-12"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Digite apenas o número. O prefixo "PAT" será adicionado automaticamente.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Equipamento *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Impressora Laser"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Marca</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                  placeholder="Ex: HP"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  placeholder="Ex: LaserJet Pro"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="serial_number">Número de Série</Label>
                <Input
                  id="serial_number"
                  value={formData.serial_number}
                  onChange={(e) => handleInputChange('serial_number', e.target.value)}
                  placeholder="Ex: SN123456789"
                />
              </div>
            </div>

            {/* Categoria e Voltagem */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category_id">Categoria</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.category_id?.toString()}
                    onValueChange={(value) => handleInputChange('category_id', parseInt(value))}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('/categorias', '_blank')}
                    className="whitespace-nowrap"
                  >
                    + Cadastrar
                  </Button>
                </div>
              </div>
               
              {/* Campo Voltagem - apenas para categorias elétricas */}
              {isElectricalCategory && (
                <div className="space-y-2">
                  <Label htmlFor="voltage">Voltagem</Label>
                  <Select
                    value={formData.voltage}
                    onValueChange={(value) => handleInputChange('voltage', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a voltagem" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="110V">110V</SelectItem>
                      <SelectItem value="220V">220V</SelectItem>
                      <SelectItem value="380V">380V</SelectItem>
                      <SelectItem value="440V">440V</SelectItem>
                      <SelectItem value="Bifásica">Bifásica</SelectItem>
                      <SelectItem value="Trifásica">Trifásica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Setor e Subsetor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sector_id">Setor</Label>
                <Select
                  value={formData.sector_id?.toString()}
                  onValueChange={(value) => handleInputChange('sector_id', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map((sector) => (
                      <SelectItem key={sector.id} value={sector.id.toString()}>
                        {sector.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subsector_id">Subsetor</Label>
                <Select
                  value={formData.subsector_id?.toString()}
                  onValueChange={(value) => handleInputChange('subsector_id', parseInt(value))}
                  disabled={!formData.sector_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um subsetor" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSubsectors.map((subsector) => (
                      <SelectItem key={subsector.id} value={subsector.id.toString()}>
                        {subsector.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Datas e Manutenção */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="installation_date">Data de Instalação</Label>
                <DateInput
                  id="installation_date"
                  placeholder="dd/mm/aaaa"
                  value={formData.installation_date}
                  onChange={(value) => handleInputChange('installation_date', value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maintenance_frequency_days">Frequência de Manutenção (dias)</Label>
                <Input
                  id="maintenance_frequency_days"
                  type="number"
                  min="1"
                  value={formData.maintenance_frequency_days || ''}
                  onChange={(e) => handleInputChange('maintenance_frequency_days', e.target.value ? parseInt(e.target.value) : 0)}
                  placeholder="Ex: 90"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="manutencao">Em Manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) => handleInputChange('observations', e.target.value)}
                placeholder="Observações adicionais sobre o equipamento..."
                rows={4}
              />
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {loading ? 'Salvando...' : 'Salvar Equipamento'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}