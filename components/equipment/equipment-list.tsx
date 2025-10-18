'use client';

import { useState, useMemo } from 'react';
import { Equipment } from '../../types/equipment';
import { useEquipments } from '../../hooks/useEquipments';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Edit, Trash2, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePersonalization } from '@/components/personalization-context';
import { useUserPreferences } from '@/contexts/user-preferences-context';
import { formatDateBR } from '@/lib/date-utils';

interface EquipmentListProps {
  onEdit?: (equipment: Equipment) => void;
}

export default function EquipmentList({ onEdit }: EquipmentListProps) {
  console.log('🔍 EquipmentList component rendered');
  console.log('🔍 onEdit prop received:', onEdit);
  const { equipments, loading, error, deleteEquipment } = useEquipments();
  const { settings } = usePersonalization();
  const { preferences } = useUserPreferences();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [subsectorFilter, setSubsectorFilter] = useState('all');
  const router = useRouter();
  
  const itemsPerPage = preferences.itemsPerPage;
  
  console.log('📊 EquipmentList state:', { equipments, loading, error });

  // Filtrar equipamentos baseado na busca
  const filteredEquipments = useMemo(() => {
    if (!equipments) return [];
    return equipments.filter(equipment => {
      const matchesSearch = !searchTerm || 
        equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (equipment.patrimonio_number && equipment.patrimonio_number.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesSector = sectorFilter === 'all' || equipment.sector_name === sectorFilter;
      const matchesSubsector = subsectorFilter === 'all' || equipment.subsector_name === subsectorFilter;
      
      return matchesSearch && matchesSector && matchesSubsector;
    });
  }, [equipments, searchTerm, sectorFilter, subsectorFilter]);

  // Paginação
  const totalPages = Math.ceil(filteredEquipments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEquipments = filteredEquipments.slice(startIndex, startIndex + itemsPerPage);

  // Extrair setores e subsetores únicos
  const uniqueSectors = useMemo(() => {
    if (!equipments) return [];
    const sectors = equipments.map(eq => eq.sector_name).filter(Boolean);
    return [...new Set(sectors)];
  }, [equipments]);

  const uniqueSubsectors = useMemo(() => {
    if (!equipments) return [];
    const subsectors = equipments.map(eq => eq.subsector_name).filter(Boolean);
    return [...new Set(subsectors)];
  }, [equipments]);

  // Reset página quando filtros mudam
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este equipamento?')) {
      setDeletingId(id);
      const success = await deleteEquipment(id);
      if (success) {
        // Equipamento deletado com sucesso
      }
      setDeletingId(null);
    }
  };

  const handleEdit = (equipment: Equipment) => {
    console.log('🔧 handleEdit called with equipment:', equipment);
    console.log('🔧 onEdit prop:', onEdit);
    console.log('🔧 router:', router);
    
    if (onEdit) {
      console.log('🔧 Using onEdit callback');
      onEdit(equipment);
    } else {
      const editUrl = `/equipamentos/${equipment.id}/editar`;
      console.log('🔧 Navigating to:', editUrl);
      router.push(editUrl);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      // Status de equipamentos
      case 'ativo':
        return <Badge className="bg-green-100 text-green-800">Ativo</Badge>;
      case 'inativo':
        return <Badge className="bg-red-100 text-red-800">Inativo</Badge>;
      case 'manutencao':
        return <Badge className="bg-amber-100 text-amber-800">Manutenção</Badge>;
      // Status de ordens de serviço (caso sejam exibidos aqui)
      case 'aberta':
        return <Badge className="bg-blue-100 text-blue-800">Aberta</Badge>;
      case 'em_andamento':
        return <Badge className="bg-amber-100 text-amber-800">Em Andamento</Badge>;
      case 'concluida':
        return <Badge className="bg-green-100 text-green-800">Concluída</Badge>;
      case 'cancelada':
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Indefinido</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Carregando equipamentos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-red-600">Erro: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${settings.highContrast ? 'dark:text-white font-semibold' : ''}`}>Equipamentos</h2>
        <Button onClick={() => router.push('/equipamentos/novo')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Equipamento
        </Button>
      </div>

      {/* Filtros de busca */}
      <Card>
        <CardHeader>
          <CardTitle className={`text-lg flex items-center gap-2 ${settings.highContrast ? 'dark:text-white font-semibold' : ''}`}>
            <Search className="h-5 w-5" />
            Buscar Equipamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Buscar por nome ou patrimônio..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  handleFilterChange();
                }}
              />
            </div>
            <div>
              <Select value={sectorFilter} onValueChange={(value) => {
                setSectorFilter(value);
                handleFilterChange();
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os setores</SelectItem>
                  {uniqueSectors.map(sector => (
                    <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={subsectorFilter} onValueChange={(value) => {
                setSubsectorFilter(value);
                handleFilterChange();
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por subsetor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os subsetores</SelectItem>
                  {uniqueSubsectors.map(subsector => (
                    <SelectItem key={subsector} value={subsector}>{subsector}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSectorFilter('all');
                  setSubsectorFilter('all');
                  setCurrentPage(1);
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
          <div className={`mt-4 text-sm ${settings.highContrast ? 'dark:text-gray-100' : 'text-gray-600'}`}>
            Mostrando {paginatedEquipments.length} de {filteredEquipments.length} equipamentos
          </div>
        </CardContent>
      </Card>

      {/* Lista de equipamentos */}
      {filteredEquipments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className={`${settings.highContrast ? 'dark:text-gray-200' : 'text-gray-500'}`}>
              {equipments.length === 0 
                ? "Nenhum equipamento encontrado." 
                : "Nenhum equipamento encontrado com os filtros aplicados."}
            </p>
            {equipments.length === 0 && (
              <Button 
                onClick={() => router.push('/equipamentos/novo')} 
                className="mt-4"
              >
                Cadastrar Primeiro Equipamento
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-2">
            {paginatedEquipments.map((equipment) => (
              <Card key={equipment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-bold text-sm truncate dark:text-white ${settings.highContrast ? 'font-black' : ''}`}>{equipment.name}</h3>
                          {getStatusBadge(equipment.status)}
                          {equipment.patrimonio_number && (
                            <Badge variant="outline" className={`text-xs font-semibold dark:text-gray-100 dark:border-gray-300 ${settings.highContrast ? 'font-bold' : ''}`}>#{equipment.patrimonio_number}</Badge>
                          )}
                        </div>
                      </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          console.log('🔧 Edit button clicked!', e);
                          handleEdit(equipment);
                        }}
                        className="h-7 w-7 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(equipment.id!)}
                        disabled={deletingId === equipment.id}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Seção de Informações Principais */}
                  <div className="space-y-3">
                    {/* Linha 1: Informações Básicas */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                      {equipment.patrimonio_number && (
                        <div className="min-w-0">
                          <span className={`font-semibold dark:text-gray-100 ${settings.highContrast ? 'font-bold' : 'text-gray-700'}`}>Patrimônio:</span>
                          <p className={`truncate font-medium dark:text-white ${settings.highContrast ? 'font-semibold' : 'text-gray-900'}`}>{equipment.patrimonio_number}</p>
                        </div>
                      )}
                      {equipment.manufacturer && (
                        <div className="min-w-0">
                          <span className={`font-semibold dark:text-gray-100 ${settings.highContrast ? 'font-bold' : 'text-gray-700'}`}>Marca:</span>
                          <p className={`truncate font-medium dark:text-white ${settings.highContrast ? 'font-semibold' : 'text-gray-900'}`}>{equipment.manufacturer}</p>
                        </div>
                      )}
                      {equipment.model && (
                        <div className="min-w-0">
                          <span className={`font-semibold dark:text-gray-100 ${settings.highContrast ? 'font-bold' : 'text-gray-700'}`}>Modelo:</span>
                          <p className={`truncate font-medium dark:text-white ${settings.highContrast ? 'font-semibold' : 'text-gray-900'}`}>{equipment.model}</p>
                        </div>
                      )}
                      {equipment.voltage && (
                        <div className="min-w-0">
                          <span className={`font-semibold dark:text-gray-100 ${settings.highContrast ? 'font-bold' : 'text-gray-700'}`}>Voltagem:</span>
                          <p className={`truncate font-medium dark:text-white ${settings.highContrast ? 'font-semibold' : 'text-gray-900'}`}>{equipment.voltage}</p>
                        </div>
                      )}
                    </div>

                    {/* Linha 2: Identificação e Localização */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
                      {equipment.serial_number && (
                        <div className="min-w-0">
                          <span className={`font-semibold dark:text-gray-100 ${settings.highContrast ? 'font-bold' : 'text-gray-700'}`}>Nº Série:</span>
                          <p className={`truncate font-medium dark:text-white ${settings.highContrast ? 'font-semibold' : 'text-gray-900'}`}>{equipment.serial_number}</p>
                        </div>
                      )}
                      {equipment.category_name && (
                        <div className="min-w-0">
                          <span className={`font-semibold dark:text-gray-100 ${settings.highContrast ? 'font-bold' : 'text-gray-700'}`}>Categoria:</span>
                          <p className={`truncate font-medium dark:text-white ${settings.highContrast ? 'font-semibold' : 'text-gray-900'}`}>{equipment.category_name}</p>
                        </div>
                      )}
                      {equipment.sector_name && (
                        <div className="min-w-0">
                          <span className={`font-semibold dark:text-gray-100 ${settings.highContrast ? 'font-bold' : 'text-gray-700'}`}>Setor:</span>
                          <p className={`truncate font-medium dark:text-white ${settings.highContrast ? 'font-semibold' : 'text-gray-900'}`}>{equipment.sector_name}</p>
                        </div>
                      )}
                      {equipment.subsector_name && (
                        <div className="min-w-0">
                          <span className={`font-semibold dark:text-gray-100 ${settings.highContrast ? 'font-bold' : 'text-gray-700'}`}>Subsetor:</span>
                          <p className={`truncate font-medium dark:text-white ${settings.highContrast ? 'font-semibold' : 'text-gray-900'}`}>{equipment.subsector_name}</p>
                        </div>
                      )}
                    </div>

                    {/* Linha 3: Datas e Manutenção */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      {equipment.installation_date && (
                        <div className="min-w-0">
                          <span className={`font-semibold dark:text-gray-100 ${settings.highContrast ? 'font-bold' : 'text-gray-700'}`}>Data de Instalação:</span>
                          <p className={`truncate font-medium dark:text-white ${settings.highContrast ? 'font-semibold' : 'text-gray-900'}`}>{formatDateBR(new Date(equipment.installation_date))}</p>
                        </div>
                      )}
                      {equipment.maintenance_frequency_days && (
                        <div className="min-w-0">
                          <span className={`font-semibold dark:text-gray-100 ${settings.highContrast ? 'font-bold' : 'text-gray-700'}`}>Frequência Manutenção:</span>
                          <p className={`truncate font-medium dark:text-white ${settings.highContrast ? 'font-semibold' : 'text-gray-900'}`}>{equipment.maintenance_frequency_days} dias</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {equipment.observations && (
                    <div className="mt-2 pt-2 border-t">
                      <span className={`font-semibold text-xs dark:text-gray-100 ${settings.highContrast ? 'font-bold' : 'text-gray-700'}`}>Observações:</span>
                      <p className={`mt-1 text-xs line-clamp-1 font-medium dark:text-white ${settings.highContrast ? 'font-semibold' : 'text-gray-900'}`}>{equipment.observations}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className={`text-sm ${settings.highContrast ? 'dark:text-gray-100' : 'text-gray-600'}`}>
                    Página {currentPage} de {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {/* Botões de página */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="h-8 w-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}