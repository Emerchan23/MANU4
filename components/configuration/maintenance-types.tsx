"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { PlusIcon, PencilIcon, TrashIcon, WrenchScrewdriverIcon } from "@heroicons/react/24/outline"
import type { MaintenanceType } from "@/types/maintenance-types"

// Interface para o tipo de manutenção da API (com camelCase)
interface ApiMaintenanceType {
  id: number;
  name: string;
  description?: string;
  category: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Função para converter dados da API para o formato do frontend
const convertApiToFrontend = (apiType: ApiMaintenanceType): MaintenanceType => ({
  id: apiType.id.toString(),
  name: apiType.name,
  description: apiType.description || '',
  category: apiType.category as MaintenanceType['category'],
  isActive: apiType.isActive,
  createdAt: apiType.createdAt ? new Date(apiType.createdAt) : new Date(),
  updatedAt: apiType.updatedAt ? new Date(apiType.updatedAt) : new Date(),
});

// Função para converter dados do frontend para o formato da API
const convertFrontendToApi = (frontendType: Partial<MaintenanceType>) => ({
  name: frontendType.name,
  isActive: frontendType.isActive,
});

const categoryColors = {
  preventiva: "bg-blue-100 text-blue-800",
  corretiva: "bg-red-100 text-red-800",
  calibracao: "bg-green-100 text-green-800",
  instalacao: "bg-purple-100 text-purple-800",
  desinstalacao: "bg-orange-100 text-orange-800",
  consultoria: "bg-yellow-100 text-yellow-800",
}

const categoryLabels = {
  preventiva: "Preventiva",
  corretiva: "Corretiva",
  calibracao: "Calibração",
  instalacao: "Instalação",
  desinstalacao: "Desinstalação",
  consultoria: "Consultoria",
}

export function MaintenanceTypes() {
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingType, setEditingType] = useState<MaintenanceType | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [formData, setFormData] = useState({
    name: "",
    isActive: true,
  })

  // Carregar tipos de manutenção da API
  const loadMaintenanceTypes = async (filter: 'all' | 'active' | 'inactive' = statusFilter) => {
    try {
      setLoading(true);
      console.log('🔍 Carregando tipos de manutenção com filtro:', filter);
      const response = await fetch(`/api/maintenance-types?status=${filter}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📊 Resposta da API:', result);
        
        if (result.success && result.data) {
          const convertedTypes = result.data.map(convertApiToFrontend);
          console.log('✅ Tipos convertidos:', convertedTypes);
          setMaintenanceTypes(convertedTypes);
        } else {
          console.error('❌ Resposta da API sem dados válidos:', result);
          setMaintenanceTypes([]);
        }
      } else {
        const errorData = await response.json();
        console.error('❌ Erro na resposta da API:', errorData.error);
        setMaintenanceTypes([]);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar tipos de manutenção:', error);
      setMaintenanceTypes([]);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados ao montar o componente e quando o filtro mudar
  useEffect(() => {
    loadMaintenanceTypes();
  }, []);

  // Recarregar quando o filtro de status mudar
  useEffect(() => {
    loadMaintenanceTypes(statusFilter);
  }, [statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const apiData = convertFrontendToApi(formData);
      
      if (editingType) {
        // Update existing type
        const response = await fetch('/api/maintenance-types', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: parseInt(editingType.id), ...apiData }),
        });
        
        if (response.ok) {
          const result: ApiMaintenanceType = await response.json();
          const updatedType = convertApiToFrontend(result);
          setMaintenanceTypes((prev) =>
            prev.map((type) => (type.id === editingType.id ? updatedType : type))
          );
        } else {
          const errorData = await response.json();
          alert('Erro ao atualizar tipo de manutenção: ' + (errorData.error || 'Erro desconhecido'));
          return;
        }
      } else {
        // Create new type
        const response = await fetch('/api/maintenance-types', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiData),
        });
        
        if (response.ok) {
          const result: ApiMaintenanceType = await response.json();
          const newType = convertApiToFrontend(result);
          setMaintenanceTypes((prev) => [...prev, newType]);
        } else {
          const errorData = await response.json();
          alert('Erro ao criar tipo de manutenção: ' + (errorData.error || 'Erro desconhecido'));
          return;
        }
      }
      
      // Reset form
      setFormData({ name: "", description: "", category: "" as MaintenanceType["category"], isActive: true });
      setEditingType(null);
      setShowForm(false);
    } catch (error) {
      console.error('Erro ao salvar tipo de manutenção:', error);
      alert('Erro ao salvar tipo de manutenção. Tente novamente.');
    }
  }

  const handleEdit = (type: MaintenanceType) => {
    setEditingType(type)
    setFormData({
      name: type.name,
      isActive: type.isActive,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este tipo de manutenção?")) {
      try {
        const response = await fetch(`/api/maintenance-types?id=${id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setMaintenanceTypes((prev) => prev.filter((type) => type.id !== id));
        } else {
          const errorData = await response.json();
          alert('Erro ao excluir tipo de manutenção: ' + (errorData.error || 'Erro desconhecido'));
        }
      } catch (error) {
        console.error('Erro ao excluir tipo de manutenção:', error);
        alert('Erro ao excluir tipo de manutenção. Tente novamente.');
      }
    }
  };

  const toggleActive = async (id: string) => {
    try {
      const currentType = maintenanceTypes.find(type => type.id === id);
      if (!currentType) return;
      
      const updatedData = {
        id: parseInt(id),
        name: currentType.name,
        isActive: !currentType.isActive,
      };
      
      const response = await fetch('/api/maintenance-types', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      
      if (response.ok) {
        const result: ApiMaintenanceType = await response.json();
        const updatedType = convertApiToFrontend(result);
        setMaintenanceTypes((prev) =>
          prev.map((type) => (type.id === id ? updatedType : type))
        );
      } else {
        const errorData = await response.json();
        alert('Erro ao atualizar status: ' + (errorData.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status. Tente novamente.');
    }
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {editingType ? "Editar Tipo de Manutenção" : "Novo Tipo de Manutenção"}
            </h2>
            <p className="text-muted-foreground">
              {editingType ? "Modifique as informações do tipo de manutenção" : "Cadastre um novo tipo de manutenção"}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setShowForm(false)
              setEditingType(null)
              setFormData({ name: "", description: "", category: "" as MaintenanceType["category"], isActive: true })
            }}
          >
            Voltar
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WrenchScrewdriverIcon className="h-5 w-5" />
              Informações do Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Manutenção Preventiva Mensal"
                  required
                />
              </div>



              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Tipo ativo</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit">{editingType ? "Atualizar" : "Cadastrar"}</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingType(null)
                    setFormData({
                      name: "",
                      isActive: true,
                    })
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Tipos de Manutenção</h2>
          <p className="text-muted-foreground">Gerencie os tipos de serviços e categorias de manutenção</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Novo Tipo
        </Button>
      </div>

      {/* Filtros de Status */}
      <div className="flex gap-2">
        <Button 
          variant={statusFilter === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          Todos ({maintenanceTypes.length})
        </Button>
        <Button 
          variant={statusFilter === 'active' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setStatusFilter('active')}
        >
          Ativos ({maintenanceTypes.filter(t => t.isActive).length})
        </Button>
        <Button 
          variant={statusFilter === 'inactive' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setStatusFilter('inactive')}
        >
          Inativos ({maintenanceTypes.filter(t => !t.isActive).length})
        </Button>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando tipos de manutenção...</p>
            </CardContent>
          </Card>
        ) : maintenanceTypes.length > 0 ? (
          maintenanceTypes.map((type) => (
            <Card key={type.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className={`font-medium ${!type.isActive ? 'text-muted-foreground' : ''}`}>{type.name}</h3>
                    <Badge className={categoryColors[type.category]}>{categoryLabels[type.category]}</Badge>
                    <Badge variant={type.isActive ? "default" : "secondary"}>
                      {type.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  {type.description && <p className="text-sm text-muted-foreground">{type.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={type.isActive} onCheckedChange={() => toggleActive(type.id)} />
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(type)}>
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(type.id)}>
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <WrenchScrewdriverIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {statusFilter === 'all' ? 'Nenhum tipo cadastrado' : 
                 statusFilter === 'active' ? 'Nenhum tipo ativo encontrado' : 
                 'Nenhum tipo inativo encontrado'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {statusFilter === 'all' ? 
                  'Comece cadastrando os tipos de manutenção que sua empresa oferece' :
                  statusFilter === 'active' ? 
                    'Todos os tipos estão inativos ou não há tipos cadastrados' :
                    'Não há tipos desativados no momento'
                }
              </p>
              {statusFilter === 'all' && (
                <Button onClick={() => setShowForm(true)}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Tipo
                </Button>
              )}
              {statusFilter === 'inactive' && (
                <Button onClick={() => setStatusFilter('all')} variant="outline">
                  Ver Todos os Tipos
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
