"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react"
import { useMaintenancePlans } from '@/src/hooks/useMaintenancePlans'
import { 
  MaintenanceFrequency, 
  MaintenanceType, 
  MAINTENANCE_FREQUENCIES, 
  MAINTENANCE_TYPES,
  CreateMaintenancePlanRequest
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

export default function NovoPlanoPage() {
  const router = useRouter()
  const { createPlan, loading } = useMaintenancePlans()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: '' as MaintenanceFrequency,
    maintenance_type: '' as MaintenanceType,
    estimated_duration: 60,
    estimated_cost: 0,
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

  const handleTaskChange = (index: number, field: string, value: any) => {
    setTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, [field]: value } : task
    ))
  }

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
      setTasks(prev => prev.filter((_, i) => i !== index)
        .map((task, i) => ({ ...task, order_sequence: i + 1 })))
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações
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

    if (formData.estimated_duration <= 0) {
      toast.error('Duração estimada deve ser maior que zero')
      return
    }

    // Filtrar tarefas válidas
    const validTasks = tasks.filter(task => task.task_name.trim())

    const planData: CreateMaintenancePlanRequest = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      frequency: formData.frequency,
      maintenance_type: formData.maintenance_type,
      estimated_duration: formData.estimated_duration,
      estimated_cost: formData.estimated_cost,
      equipment_ids: formData.equipment_ids,
      tasks: validTasks
    }

    try {
      const result = await createPlan(planData)
      if (result) {
        toast.success('Plano de manutenção criado com sucesso!')
        router.push('/agendamentos/planos')
      }
    } catch (error) {
      console.error('Erro ao criar plano:', error)
      toast.error('Erro ao criar plano de manutenção')
    }
  }

  return (
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
            Novo Plano de Manutenção
          </h1>
          <p className="text-gray-600 mt-1">
            Crie um novo plano de manutenção preventiva
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
                  onChange={(e) => handleInputChange('estimated_duration', parseInt(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="estimated_cost">Custo Estimado (R$)</Label>
                <Input
                  id="estimated_cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.estimated_cost}
                  onChange={(e) => handleInputChange('estimated_cost', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descreva o plano de manutenção..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Equipamentos */}
        <Card>
          <CardHeader>
            <CardTitle>Equipamentos</CardTitle>
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
                    <Label>Nome da Tarefa</Label>
                    <Input
                      value={task.task_name}
                      onChange={(e) => handleTaskChange(index, 'task_name', e.target.value)}
                      placeholder="Ex: Verificar filtros"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id={`required-${index}`}
                      checked={task.is_required}
                      onChange={(e) => handleTaskChange(index, 'is_required', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor={`required-${index}`}>Tarefa obrigatória</Label>
                  </div>

                  <div className="md:col-span-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={task.description}
                      onChange={(e) => handleTaskChange(index, 'description', e.target.value)}
                      placeholder="Descreva como executar esta tarefa..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="flex justify-end space-x-3">
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Plano
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}