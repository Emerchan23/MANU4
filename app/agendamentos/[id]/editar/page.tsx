'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { MainLayout } from '@/components/layout/main-layout'
import { CalendarIcon, ArrowLeft, Save, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { formatCurrency, applyCurrencyMask, parseCurrencyValue } from '@/lib/currency'
import { PrioritySelect } from '@/components/ui/priority-select'

interface Equipment {
  id: number
  name: string
  model: string
  patrimonio: string
}

interface Company {
  id: number
  name: string
}

interface MaintenanceType {
  id: number
  nome: string
}

interface MaintenancePlan {
  id: number
  name: string
  description: string
  maintenance_type: string
  frequency_days: number
  estimated_cost: number
  estimated_duration_hours: number
  active: boolean
}

interface Schedule {
  id: number
  equipment_id: number
  maintenance_type: string
  description: string
  scheduled_date: string
  priority: string
  assigned_user_id?: number
  estimated_cost?: number
  status: string
  equipment_name?: string
  company_name?: string
  company_id?: number
  observations?: string
}

export default function EditarAgendamento() {
  const router = useRouter()
  const params = useParams()
  const scheduleId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([])
  const [maintenancePlans, setMaintenancePlans] = useState<MaintenancePlan[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>()

  const [formData, setFormData] = useState({
    equipment_id: '',
    maintenance_type: '',
    description: '',
    scheduled_date: '',
    priority: 'media',
    assigned_user_id: '',
    estimated_cost: '',
    status: 'pending',
    maintenance_plan_id: '',
    company_id: '',
    observations: ''
  })

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Carregar agendamento específico
        const scheduleResponse = await fetch(`/api/maintenance-schedules/${scheduleId}`)
        if (!scheduleResponse.ok) {
          throw new Error('Agendamento não encontrado')
        }
        const scheduleData = await scheduleResponse.json()
        
        if (scheduleData.success && scheduleData.data) {
          const scheduleItem = scheduleData.data
          setSchedule(scheduleItem)
          
          // DEBUG: Log dos dados recebidos
          console.log('=== DEBUG DADOS RECEBIDOS ===')
          console.log('scheduleItem completo:', scheduleItem)
          console.log('estimated_cost:', scheduleItem.estimated_cost, 'tipo:', typeof scheduleItem.estimated_cost)
          console.log('company_id:', scheduleItem.company_id, 'tipo:', typeof scheduleItem.company_id)
          console.log('observations:', scheduleItem.observations, 'tipo:', typeof scheduleItem.observations)
          console.log('company_name:', scheduleItem.company_name)
          
          // Preencher formulário com dados existentes
          setFormData({
            equipment_id: scheduleItem.equipment_id?.toString() || '',
            maintenance_type: scheduleItem.maintenance_type || '',
            description: scheduleItem.description || '',
            scheduled_date: scheduleItem.scheduled_date || '',
            priority: scheduleItem.priority || 'media',
            assigned_user_id: scheduleItem.assigned_user_id?.toString() || '',
            estimated_cost: scheduleItem.estimated_cost?.toString() || '0',
            status: scheduleItem.status || 'agendado', // Use database value directly
            maintenance_plan_id: scheduleItem.maintenance_plan_id?.toString() || '',
            company_id: scheduleItem.company_id?.toString() || '',
            observations: scheduleItem.observations || ''
          })
          
          // DEBUG: Log dos dados do formulário
          console.log('=== DEBUG FORM DATA ===')
          console.log('formData.estimated_cost:', scheduleItem.estimated_cost?.toString() || '0')
          console.log('formData.company_id:', scheduleItem.company_id?.toString() || '')
          console.log('formData.observations:', scheduleItem.observations || '')

          // Definir data selecionada
          if (scheduleItem.scheduled_date) {
            const date = new Date(scheduleItem.scheduled_date)
            setSelectedDate(date)
          }
        }

        // Carregar equipamentos
        const equipmentResponse = await fetch('/api/equipment')
        if (equipmentResponse.ok) {
          const equipmentData = await equipmentResponse.json()
          if (equipmentData.success) {
            setEquipment(equipmentData.data || [])
          }
        }

        // Carregar empresas
        const companiesResponse = await fetch('/api/companies')
        if (companiesResponse.ok) {
          const companiesData = await companiesResponse.json()
          console.log('=== DEBUG COMPANIES ===')
          console.log('companiesResponse:', companiesData)
          if (companiesData.success) {
            setCompanies(companiesData.companies || [])
            console.log('companies carregadas:', companiesData.companies || [])
          }
        }

        // Carregar tipos de manutenção
        const typesResponse = await fetch('/api/maintenance-types')
        if (typesResponse.ok) {
          const typesData = await typesResponse.json()
          if (typesData.success) {
            setMaintenanceTypes(typesData.data || [])
          }
        }

        // Carregar planos de manutenção
        const plansResponse = await fetch('/api/maintenance-plans?active=true')
        if (plansResponse.ok) {
          const plansData = await plansResponse.json()
          if (plansData.success) {
            setMaintenancePlans(plansData.data || [])
          }
        }

        // Carregar usuários
        const usersResponse = await fetch('/api/users')
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          if (Array.isArray(usersData)) {
            setUsers(usersData)
          }
        }

      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        toast.error('Erro ao carregar dados do agendamento')
        router.push('/agendamentos')
      } finally {
        setLoading(false)
      }
    }

    if (scheduleId) {
      loadData()
    }
  }, [scheduleId, router])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd')
      handleInputChange('scheduled_date', formattedDate)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.equipment_id || !formData.description || !formData.scheduled_date) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    try {
      setSaving(true)

      // Status já está no formato correto do banco de dados
      const updateData = {
        equipment_id: parseInt(formData.equipment_id),
        maintenance_type: formData.maintenance_type,
        description: formData.description,
        scheduled_date: formData.scheduled_date,
        priority: formData.priority,
        assigned_user_id: formData.assigned_user_id ? parseInt(formData.assigned_user_id) : null,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
        status: formData.status, // Use status directly without mapping
        maintenance_plan_id: formData.maintenance_plan_id && formData.maintenance_plan_id !== "none" ? parseInt(formData.maintenance_plan_id) : null,
        company_id: formData.company_id && formData.company_id !== "none" ? parseInt(formData.company_id) : null,
        observations: formData.observations
      }

      console.log('📊 Dados sendo enviados:', updateData);

      const response = await fetch(`/api/maintenance-schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Agendamento atualizado com sucesso!')
        router.push('/agendamentos')
      } else {
        throw new Error(result.error || 'Erro ao atualizar agendamento')
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao atualizar agendamento')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando agendamento...</span>
        </div>
      </MainLayout>
    )
  }

  if (!schedule) {
    return (
      <MainLayout>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Agendamento não encontrado</h1>
          <Button onClick={() => router.push('/agendamentos')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Agendamentos
          </Button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/agendamentos')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Editar Agendamento #{scheduleId}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Agendamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Equipamento */}
              <div className="space-y-2">
                <Label htmlFor="equipment_id">Equipamento *</Label>
                <Select
                  value={formData.equipment_id}
                  onValueChange={(value) => handleInputChange('equipment_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o equipamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.name} - {item.model} ({item.patrimonio})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Empresa Prestadora */}
              <div className="space-y-2">
                <Label htmlFor="company_id">Empresa Prestadora</Label>
                <Select
                  value={formData.company_id}
                  onValueChange={(value) => handleInputChange('company_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma empresa prestadora" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma empresa</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de Manutenção e Plano de Manutenção */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maintenance_type">Tipo de Manutenção</Label>
                  <Select
                    value={formData.maintenance_type}
                    onValueChange={(value) => handleInputChange('maintenance_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventiva">Preventiva</SelectItem>
                      <SelectItem value="corretiva">Corretiva</SelectItem>
                      <SelectItem value="preditiva">Preditiva</SelectItem>
                      <SelectItem value="emergencial">Emergencial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenance_plan">Plano de Manutenção (opcional)</Label>
                  <Select
                    value={formData.maintenance_plan_id}
                    onValueChange={(value) => handleInputChange('maintenance_plan_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum plano</SelectItem>
                      {maintenancePlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id.toString()}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Data Agendada */}
              <div className="space-y-2">
                <Label>Data Agendada *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione a data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    value={formData.scheduled_date ? format(new Date(formData.scheduled_date), 'HH:mm') : ''}
                    onChange={(e) => {
                      if (selectedDate && e.target.value) {
                        const [hours, minutes] = e.target.value.split(':')
                        const newDate = new Date(selectedDate)
                        newDate.setHours(parseInt(hours), parseInt(minutes))
                        const formattedDateTime = format(newDate, 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\'')
                        handleInputChange('scheduled_date', formattedDateTime)
                        setSelectedDate(newDate)
                      }
                    }}
                    placeholder="00:00"
                  />
                </div>
              </div>

              {/* Prioridade */}
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <PrioritySelect
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange('priority', value)}
                  variant="schedule"
                  placeholder="Selecione a prioridade"
                />
              </div>

              {/* Status */}
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
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Responsável */}
              <div className="space-y-2">
                <Label htmlFor="assigned_user_id">Responsável (opcional)</Label>
                <Select
                  value={formData.assigned_user_id}
                  onValueChange={(value) => handleInputChange('assigned_user_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum responsável</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custo Estimado */}
              <div className="space-y-2">
                <Label htmlFor="estimated_cost">Custo Estimado (R$)</Label>
                <Input
                  id="estimated_cost"
                  type="text"
                  value={formData.estimated_cost && parseFloat(formData.estimated_cost) > 0 ? formatCurrency(parseFloat(formData.estimated_cost)) : ''}
                  onChange={(e) => {
                    const maskedValue = applyCurrencyMask(e.target.value)
                    e.target.value = maskedValue
                    const numericValue = parseCurrencyValue(maskedValue)
                    handleInputChange('estimated_cost', numericValue.toString())
                  }}
                  placeholder="R$ 0,00"
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva o serviço de manutenção..."
                rows={4}
                required
              />
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) => handleInputChange('observations', e.target.value)}
                placeholder="Observações adicionais..."
                rows={3}
              />
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/agendamentos')}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
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
        </CardContent>
      </Card>
      </div>
    </MainLayout>
  )
}