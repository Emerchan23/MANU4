"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, Plus, Trash2, Loader2 } from "lucide-react"
import { MainLayout } from '@/components/layout/main-layout'
import { useMaintenancePlans } from '@/src/hooks/useMaintenancePlans'
import { 
  MaintenanceFrequency, 
  MaintenanceType, 
  MAINTENANCE_FREQUENCIES, 
  MAINTENANCE_TYPES,
  UpdateMaintenancePlanRequest,
  MaintenancePlan
} from '@/types/maintenance-scheduling'
import { toast } from 'sonner'

interface Equipment {
  id: string
  name: string
  code: string
  sector_name?: string
}

interface MaintenanceTask {
  task_name: string
  description: string
  is_required: boolean
  order_sequence: number
}

export default function EditarPlanoPage() {
  const router = useRouter()
  const params = useParams()
  const planId = params.id as string
  
  const { updatePlan, getPlanById, loading } = useMaintenancePlans()
  
  const [plan, setPlan] = useState<MaintenancePlan | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: '' as MaintenanceFrequency,
    maintenance_type: '' as MaintenanceType,
    estimated_duration: 60,
    estimated_cost: 0,
    is_active: true,
    equipment_ids: [] as string[]
  })

  const [tasks, setTasks] = useState<MaintenanceTask[]>([
    {
      task_name: '',
      description: '',
      is_required: true,
      order_sequence: 1
    }
  ])

  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [loadingEquipments, setLoadingEquipments] = useState(false)
  const [equipmentSearchTerm, setEquipmentSearchTerm] = useState('')

  // Carregar dados do plano
  useEffect(() => {
    const loadPlan = async () => {
      if (!planId) return
      
      setLoadingPlan(true)
      try {
        const planData = await getPlanById(planId)
        if (planData) {
          setPlan(planData)
          setFormData({
            name: planData.name,
            description: planData.description || '',
            frequency: planData.frequency,
            maintenance_type: planData.maintenance_type,
            estimated_duration: planData.estimated_duration || 60,
            estimated_cost: typeof planData.estimated_cost === 'number' 
              ? planData.estimated_cost 
              : parseFloat(planData.estimated_cost) || 0,
            is_active: planData.is_active,
            equipment_ids: planData.equipment_ids || []
          })
          
          // Carregar tarefas se existirem
          if (planData.tasks && planData.tasks.length > 0) {
            setTasks(planData.tasks)
          }
        } else {
          toast.error('Plano não encontrado')
          router.push('/agendamentos/planos')
        }
      } catch (error) {
        console.error('Erro ao carregar plano:', error)
        toast.error('Erro ao carregar dados do plano')
        router.push('/agendamentos/planos')
      } finally {
        setLoadingPlan(false)
      }
    }

    loadPlan()
  }, [planId, getPlanById, router])

  // Carregar equipamentos
  useEffect(() => {
    const fetchEquipments = async () => {
      setLoadingEquipments(true)
      try {
        const response = await fetch('/api/equipment')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setEquipments(data.data)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar equipamentos:', error)
      } finally {
        setLoadingEquipments(false)
      }
    }

    fetchEquipments()
  }, [])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleEquipmentToggle = (equipmentId: string) => {
    setFormData(prev => ({
      ...prev,
      equipment_ids: prev.equipment_ids.includes(equipmentId)
        ? prev.equipment_ids.filter(id => id !== equipmentId)
        : [...prev.equipment_ids, equipmentId]
    }))
  }

  // Filtrar equipamentos baseado no termo de busca
  const filteredEquipments = equipments.filter(equipment => 
    (equipment.name?.toLowerCase() || '').includes(equipmentSearchTerm.toLowerCase()) ||
    (equipment.code?.toLowerCase() || '').includes(equipmentSearchTerm.toLowerCase())
  )

  const addTask = () => {
    setTasks(prev => [...prev, {
      task_name: '',
      description: '',
      is_required: true,
      order_sequence: prev.length + 1
    }])
  }

  const removeTask = (index: number) => {
    if (tasks.length > 1) {
      setTasks(prev => prev.filter((_, i) => i !== index))
    }
  }

  const updateTask = (index: number, field: keyof MaintenanceTask, value: any) => {
    setTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, [field]: value } : task
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Nome do plano é obrigatório')
      return
    }

    if (!formData.frequency) {
      toast.error('Frequência é obrigatória')
      return
    }

    if (!formData.maintenance_type) {
      toast.error('Tipo de manutenção é obrigatório')
      return
    }

    if (formData.equipment_ids.length === 0) {
      toast.error('Selecione pelo menos um equipamento')
      return
    }

    // Validar tarefas
    const validTasks = tasks.filter(task => task.task_name.trim())
    if (validTasks.length === 0) {
      toast.error('Adicione pelo menos uma tarefa')
      return
    }

    const updateData: UpdateMaintenancePlanRequest = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      frequency: formData.frequency,
      maintenance_type: formData.maintenance_type,
      estimated_duration: formData.estimated_duration,
      estimated_cost: formData.estimated_cost,
      is_active: formData.is_active,
      equipment_ids: formData.equipment_ids,
      tasks: validTasks.map((task, index) => ({
        ...task,
        order_sequence: index + 1
      }))
    }

    try {
      const result = await updatePlan(planId, updateData)
      if (result) {
        toast.success('Plano atualizado com sucesso!')
        router.push('/agendamentos/planos')
      } else {
        toast.error('Erro ao atualizar plano')
      }
    } catch (error) {
      console.error('Erro ao atualizar plano:', error)
      toast.error('Erro ao atualizar plano')
    }
  }

  if (loadingPlan) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Carregando dados do plano...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!plan) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-500 text-xl mb-4">Plano não encontrado</p>
            <Button onClick={() => router.push('/agendamentos/planos')}>
              Voltar para Planos
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/agendamentos/planos')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Planos
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Editar Plano de Manutenção
            </h1>
            <p className="text-gray-600 mt-1">
              Edite as informações do plano de manutenção
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome do Plano *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ex: Manutenção Preventiva Mensal"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="frequency">Frequência *</Label>
                  <Select 
                    value={formData.frequency} 
                    onValueChange={(value) => handleInputChange('frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MAINTENANCE_FREQUENCIES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maintenance_type">Tipo de Manutenção *</Label>
                  <Select 
                    value={formData.maintenance_type} 
                    onValueChange={(value) => handleInputChange('maintenance_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MAINTENANCE_TYPES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="estimated_duration">Duração Estimada (minutos) *</Label>
                  <Input
                    id="estimated_duration"
                    type="number"
                    min="1"
                    value={formData.estimated_duration}
                    onChange={(e) => handleInputChange('estimated_duration', parseInt(e.target.value) || 60)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="estimated_cost">Custo Estimado (R$)</Label>
                  <Input
                    id="estimated_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.estimated_cost}
                    onChange={(e) => handleInputChange('estimated_cost', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                  <Label htmlFor="is_active">Plano Ativo</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descreva o plano de manutenção..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Equipamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Equipamentos Associados</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Campo de busca */}
              <div className="mb-4">
                <Label htmlFor="equipment-search">Buscar Equipamento</Label>
                <Input
                  id="equipment-search"
                  type="text"
                  placeholder="Busque por nome ou patrimônio..."
                  value={equipmentSearchTerm}
                  onChange={(e) => setEquipmentSearchTerm(e.target.value)}
                  className="mt-1"
                />
              </div>

              {loadingEquipments ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Carregando equipamentos...</p>
                </div>
              ) : filteredEquipments.length === 0 ? (
                <p className="text-gray-600 text-center py-4">
                  {equipmentSearchTerm ? 'Nenhum equipamento encontrado com esse termo' : 'Nenhum equipamento encontrado'}
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                  {filteredEquipments.map((equipment) => (
                    <div
                      key={equipment.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.equipment_ids.includes(equipment.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleEquipmentToggle(equipment.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.equipment_ids.includes(equipment.id)}
                          onChange={() => handleEquipmentToggle(equipment.id)}
                          className="rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {equipment.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {equipment.code} {equipment.sector_name && `• ${equipment.sector_name}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tarefas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tarefas do Plano</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addTask}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Tarefa
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {tasks.map((task, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Tarefa {index + 1}</h4>
                    {tasks.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTask(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Nome da Tarefa *</Label>
                      <Input
                        value={task.task_name}
                        onChange={(e) => updateTask(index, 'task_name', e.target.value)}
                        placeholder="Ex: Verificar filtros"
                        required
                      />
                    </div>

                    <div className="flex items-center space-x-2 pt-6">
                      <Switch
                        checked={task.is_required}
                        onCheckedChange={(checked) => updateTask(index, 'is_required', checked)}
                      />
                      <Label>Tarefa Obrigatória</Label>
                    </div>
                  </div>

                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={task.description}
                      onChange={(e) => updateTask(index, 'description', e.target.value)}
                      placeholder="Descreva como executar esta tarefa..."
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/agendamentos/planos')}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  )
}