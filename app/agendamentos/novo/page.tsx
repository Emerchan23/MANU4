"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MainLayout } from "@/components/layout/main-layout"
import { ArrowLeft, Calendar, Clock, AlertTriangle, FileText, BarChart3, CalendarDays, Settings, List, History } from "lucide-react"
import { toast } from "sonner"
import EquipmentHistory from "@/components/EquipmentHistory"
import { PrioritySelect } from "@/components/ui/priority-select"

import type { Equipment } from "@/types/equipment"

interface ScheduleFormData {
  equipmentId: string
  maintenanceType: string
  description: string
  scheduledDate: string
  priority: string
  estimatedValue: string
  assignedTo: string
  companyId: string
  observations: string
  recurrenceType: string
  recurrenceInterval: number
  sectorName: string
  subsectorName: string
  templateId: string
  maintenancePlanId: string
}

interface User {
  id: string
  name: string
  email: string
}

interface Company {
  id: string
  name: string
  cnpj: string
}

interface ServiceTemplate {
  id: number
  name: string
  description: string
  content: string
  category_id: number
  active: number
  created_at: string
  updated_at: string
  category_name: string | null
  category_color: string | null
}

interface MaintenanceType {
  id: number
  name: string
  description: string
  category: string
  isActive: boolean
  createdAt: string
  updatedAt: string
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

export default function NovoAgendamentoPage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState<ScheduleFormData>({
    equipmentId: "",
    maintenanceType: "",
    description: "",
    scheduledDate: "",
    priority: "media",
    estimatedValue: "",
    assignedTo: "none",
    companyId: "none",
    observations: "",
    recurrenceType: "none",
    recurrenceInterval: 1,
    sectorName: "",
    subsectorName: "",
    templateId: "",
    maintenancePlanId: "",
  })

  // Funções auxiliares para formato brasileiro de data
  const formatDateToBR = (isoDate: string): string => {
    if (!isoDate) return ""
    const date = new Date(isoDate)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${minutes}`
  }

  const formatDateFromBR = (brDate: string): string => {
    if (!brDate) return ""
    // Formato esperado: dd/mm/yyyy hh:mm
    const dateTimeRegex = /^(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2})$/
    const match = brDate.match(dateTimeRegex)
    
    if (match) {
      const [, day, month, year, hours, minutes] = match
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes))
      return date.toISOString().slice(0, 16)
    }
    return ""
  }

  const validateBRDate = (brDate: string): boolean => {
    const dateTimeRegex = /^(\d{2})\/(\d{2})\/(\d{4})\s(\d{2}):(\d{2})$/
    return dateTimeRegex.test(brDate)
  }
  
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [templates, setTemplates] = useState<ServiceTemplate[]>([])
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([])
  const [maintenancePlans, setMaintenancePlans] = useState<MaintenancePlan[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar equipamentos
  const fetchEquipments = async () => {
    try {
      const response = await fetch('/api/equipment')
      if (!response.ok) throw new Error('Erro ao buscar equipamentos')
      
      const data = await response.json()
      setEquipments(data.data || data)
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error)
      setError('Erro ao carregar equipamentos')
      toast.error('Erro ao carregar equipamentos')
    }
  }

  // Buscar usuários
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('Erro ao buscar usuários')
      
      const data = await response.json()
      setUsers(data.data || data)
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      setError('Erro ao carregar usuários')
      toast.error('Erro ao carregar usuários')
    }
  }

  // Buscar empresas
  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      if (!response.ok) throw new Error('Erro ao buscar empresas')
      
      const data = await response.json()
      
      if (data.success) {
        setCompanies(data.companies || [])
      } else {
        console.warn('API retornou success: false:', data)
        setCompanies([])
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error)
      setError('Erro ao carregar empresas')
      toast.error('Erro ao carregar empresas')
      setCompanies([]) // Garantir que seja um array vazio em caso de erro
    }
  }

  // Buscar templates
  const loadTemplates = async () => {
    try {
      console.log('Carregando templates...')
      const response = await fetch('/api/service-templates')
      const data = await response.json()
      console.log('Resposta da API:', data)
      if (data.success) {
        console.log('Templates carregados:', data.data)
        setTemplates(data.data)
      } else {
        console.error('Erro na resposta da API:', data)
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    }
  }

  // Buscar tipos de manutenção
  const fetchMaintenanceTypes = async () => {
    try {
      console.log('Carregando tipos de manutenção...')
      const response = await fetch('/api/maintenance-types')
      if (!response.ok) throw new Error('Erro ao buscar tipos de manutenção')
      
      const data = await response.json()
      console.log('Resposta da API maintenance-types:', data)
      
      if (data.success) {
        console.log('Tipos de manutenção carregados:', data.data)
        setMaintenanceTypes(data.data)
      } else {
        console.error('Erro na resposta da API:', data)
        setMaintenanceTypes([])
      }
    } catch (error) {
      console.error('Erro ao buscar tipos de manutenção:', error)
      setError('Erro ao carregar tipos de manutenção')
      toast.error('Erro ao carregar tipos de manutenção')
      setMaintenanceTypes([])
    }
  }

  // Buscar planos de manutenção
  const fetchMaintenancePlans = async () => {
    try {
      console.log('Carregando planos de manutenção...')
      const response = await fetch('/api/maintenance-plans?active=true')
      if (!response.ok) throw new Error('Erro ao buscar planos de manutenção')
      
      const data = await response.json()
      console.log('Resposta da API maintenance-plans:', data)
      
      if (data.success) {
        console.log('Planos de manutenção carregados:', data.data)
        setMaintenancePlans(data.data)
      } else {
        console.error('Erro na resposta da API:', data)
        setMaintenancePlans([])
      }
    } catch (error) {
      console.error('Erro ao buscar planos de manutenção:', error)
      setError('Erro ao carregar planos de manutenção')
      toast.error('Erro ao carregar planos de manutenção')
      setMaintenancePlans([])
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchEquipments(), fetchUsers(), fetchCompanies(), loadTemplates(), fetchMaintenanceTypes(), fetchMaintenancePlans()])
      setLoading(false)
    }
    
    loadData()
  }, [])

  // Atualizar setor e subsetor quando equipamento for selecionado
  useEffect(() => {
    if (formData.equipmentId) {
      const selectedEquipment = equipments.find(eq => eq.id === parseInt(formData.equipmentId))
      if (selectedEquipment) {
        setFormData(prev => ({
          ...prev,
          sectorName: selectedEquipment.sector_name || '',
          subsectorName: selectedEquipment.subsector_name || ''
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        sectorName: '',
        subsectorName: ''
      }))
    }
  }, [formData.equipmentId, equipments])

  // Função para lidar com seleção de template
  const handleTemplateSelect = (templateId: string) => {
    setFormData(prev => ({ ...prev, templateId }))
    
    if (templateId && templateId !== 'none') {
      const template = templates.find(t => t.id.toString() === templateId)
      if (template) {
        setFormData(prev => ({
          ...prev,
          description: template.content || template.description || '',
        }))
      }
    }
  }

  // Validar formulário
  const validateForm = (): boolean => {
    if (!formData.equipmentId) {
      toast.error('Selecione um equipamento')
      return false
    }
    
    if (!formData.maintenanceType) {
      toast.error('Selecione o tipo de manutenção')
      return false
    }
    
    if (!formData.description.trim()) {
      toast.error('Informe a descrição do serviço')
      return false
    }
    
    if (!formData.scheduledDate) {
      toast.error('Selecione a data agendada')
      return false
    }

    // Validar formato da data brasileira
    if (!validateBRDate(formData.scheduledDate)) {
      toast.error('Formato de data inválido. Use dd/mm/yyyy hh:mm')
      return false
    }

    // Validar se a data não é no passado
    const isoDate = formatDateFromBR(formData.scheduledDate)
    if (!isoDate) {
      toast.error('Data inválida')
      return false
    }
    
    const selectedDate = new Date(isoDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (selectedDate < today) {
      toast.error('A data agendada não pode ser no passado')
      return false
    }
    
    if (!formData.companyId || formData.companyId === 'none') {
      toast.error('Selecione uma empresa prestadora')
      return false
    }
    
    return true
  }

  // Submeter formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/service-orders/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
           equipmentId: parseInt(formData.equipmentId),
           maintenanceType: formData.maintenanceType,
           description: formData.description,
           scheduledDate: formatDateFromBR(formData.scheduledDate),
           priority: formData.priority,
           estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue.replace(/[^\d,]/g, '').replace(',', '.')) : null,
           assignedTo: formData.assignedTo !== "none" ? parseInt(formData.assignedTo) : null,
           companyId: formData.companyId !== "none" ? parseInt(formData.companyId) : null,
           observations: formData.observations || null,
           maintenancePlanId: formData.maintenancePlanId && formData.maintenancePlanId !== "none" ? parseInt(formData.maintenancePlanId) : null,
           recurrenceType: formData.recurrenceType,
           recurrenceInterval: formData.recurrenceInterval,
           createdBy: 1, // TODO: Pegar do contexto de autenticação
         }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message || 'Agendamento criado com sucesso!')
        router.push('/agendamentos')
      } else {
        toast.error(result.error || 'Erro ao criar agendamento')
      }
    } catch (error) {
      console.error('Erro ao criar agendamento:', error)
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Voltar para lista
  const handleBack = () => {
    router.push('/agendamentos')
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span>Carregando...</span>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar dados</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 p-0 h-auto font-normal text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Agendamentos
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Novo Agendamento
            </h1>
            <p className="text-gray-600 mt-1">
              Preencha as informações para criar um novo agendamento de manutenção
            </p>
          </div>
        </div>

        {/* Menu de Navegação */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="flex border-b overflow-x-auto">
            <button className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600 bg-blue-50 whitespace-nowrap">
              <Calendar className="h-4 w-4" />
              Novo Agendamento
            </button>
            <button 
              onClick={() => router.push('/agendamentos/lista')}
              className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <List className="h-4 w-4" />
              Lista de Agendamentos
            </button>
            <button 
              onClick={() => router.push('/agendamentos/calendario')}
              className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <CalendarDays className="h-4 w-4" />
              Calendário
            </button>
            <button 
              onClick={() => router.push('/agendamentos')}
              className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <Settings className="h-4 w-4" />
              Gerenciar Planos
            </button>
          </div>
        </div>

        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Dados do Agendamento</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Empresa Prestadora - Campo prioritário no topo */}
              <div className="space-y-2">
                <Label htmlFor="companyId">Empresa Prestadora *</Label>
                <Combobox
                  value={formData.companyId === 'none' ? '' : formData.companyId}
                  onValueChange={(value) => setFormData({ ...formData, companyId: value })}
                  options={Array.isArray(companies) ? companies.map((company) => ({
                    value: company.id.toString(),
                    label: `${company.name}${company.cnpj ? ` - ${company.cnpj}` : ''}`
                  })) : []}
                  placeholder="Selecione uma empresa prestadora"
                  searchPlaceholder="Buscar por nome ou CNPJ..."
                  emptyText="Nenhuma empresa encontrada"
                  allowCustomValue={false}
                  className={!formData.companyId || formData.companyId === 'none' ? 'border-red-300' : ''}
                />
                {(!formData.companyId || formData.companyId === 'none') && (
                  <p className="text-xs text-red-500">Selecione uma empresa prestadora</p>
                )}
              </div>

              {/* Equipamento, Setor e Subsetor */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="space-y-2 lg:col-span-3">
                  <Label htmlFor="equipmentId">Equipamento *</Label>
                  <Combobox
                    value={formData.equipmentId}
                    onValueChange={(value) => setFormData({ ...formData, equipmentId: value })}
                    options={equipments.map((equipment) => ({
                      value: equipment.id.toString(),
                      label: `${equipment.name}${equipment.patrimonio || equipment.serial_number ? ` - ${equipment.patrimonio || equipment.serial_number}` : ''}`
                    }))}
                    placeholder="Selecione um equipamento"
                    searchPlaceholder="Buscar por nome ou patrimônio..."
                    emptyText="Nenhum equipamento encontrado"
                    allowCustomValue={false}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sector">Setor</Label>
                  <Input
                    id="sector"
                    value={formData.sectorName}
                    disabled
                    placeholder="Será preenchido automaticamente"
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subsector">Subsetor</Label>
                  <Input
                    id="subsector"
                    value={formData.subsectorName}
                    disabled
                    placeholder="Será preenchido automaticamente"
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* Tipo de Manutenção e Plano de Manutenção */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maintenanceType">Tipo de Manutenção *</Label>
                  <Select
                    value={formData.maintenanceType}
                    onValueChange={(value) => setFormData({ ...formData, maintenanceType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {maintenanceTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenancePlan">Plano de Manutenção (opcional)</Label>
                  <Select
                    value={formData.maintenancePlanId}
                    onValueChange={(value) => setFormData({ ...formData, maintenancePlanId: value })}
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

              {/* Template */}
              <div className="space-y-2">
                <Label htmlFor="template">Template (opcional)</Label>
                <Select
                  value={formData.templateId}
                  onValueChange={handleTemplateSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum template</SelectItem>
                    {templates
                      .filter(t => t.active === 1)
                      .map((template) => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição do Serviço *</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva detalhadamente o serviço a ser realizado..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Data Agendada e Prioridade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledDate">Data Agendada *</Label>
                  <div className="relative">
                    <Input
                      id="scheduledDate"
                      type="text"
                      placeholder="__/__/____ __:__"
                      value={formData.scheduledDate}
                      onChange={(e) => {
                        const input = e.target.value
                        let value = input.replace(/\D/g, '')
                        
                        // Limitar a 12 dígitos (ddmmyyyyhhmm)
                        if (value.length > 12) {
                          value = value.substring(0, 12)
                        }
                        
                        // Aplicar máscara dd/mm/yyyy hh:mm
                        let masked = ''
                        
                        // Dia (2 dígitos)
                        if (value.length >= 1) {
                          masked += value.substring(0, Math.min(2, value.length))
                        }
                        if (value.length >= 2) {
                          masked += '/'
                        }
                        
                        // Mês (2 dígitos)
                        if (value.length >= 3) {
                          masked += value.substring(2, Math.min(4, value.length))
                        }
                        if (value.length >= 4) {
                          masked += '/'
                        }
                        
                        // Ano (4 dígitos)
                        if (value.length >= 5) {
                          masked += value.substring(4, Math.min(8, value.length))
                        }
                        if (value.length >= 8) {
                          masked += ' '
                        }
                        
                        // Hora (2 dígitos)
                        if (value.length >= 9) {
                          masked += value.substring(8, Math.min(10, value.length))
                        }
                        if (value.length >= 10) {
                          masked += ':'
                        }
                        
                        // Minuto (2 dígitos)
                        if (value.length >= 11) {
                          masked += value.substring(10, Math.min(12, value.length))
                        }
                        
                        setFormData({ ...formData, scheduledDate: masked })
                      }}
                      onKeyDown={(e) => {
                        // Permitir backspace, delete, tab, escape, enter
                        if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
                            // Permitir Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                            (e.keyCode === 65 && e.ctrlKey === true) ||
                            (e.keyCode === 67 && e.ctrlKey === true) ||
                            (e.keyCode === 86 && e.ctrlKey === true) ||
                            (e.keyCode === 88 && e.ctrlKey === true)) {
                          return
                        }
                        // Permitir apenas números
                        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                          e.preventDefault()
                        }
                      }}
                      className={`font-mono ${
                        formData.scheduledDate && formData.scheduledDate.length === 16 
                          ? 'border-green-300 focus:border-green-500' 
                          : formData.scheduledDate && formData.scheduledDate.length > 0
                          ? 'border-yellow-300 focus:border-yellow-500'
                          : ''
                      }`}
                      maxLength={16}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-xs text-gray-400 font-mono">dd/mm/yyyy hh:mm</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      formData.scheduledDate && formData.scheduledDate.length === 16 
                        ? 'bg-green-500' 
                        : formData.scheduledDate && formData.scheduledDate.length > 0
                        ? 'bg-yellow-500'
                        : 'bg-gray-300'
                    }`}></div>
                    <p className="text-xs text-gray-500">
                      {formData.scheduledDate && formData.scheduledDate.length === 16 
                        ? 'Data completa ✓' 
                        : formData.scheduledDate && formData.scheduledDate.length > 0
                        ? `Continue digitando... (${formData.scheduledDate.length}/16)`
                        : 'Digite a data e hora do agendamento'
                      }
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <PrioritySelect
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    variant="schedule"
                    placeholder="Selecione a prioridade"
                  />
                </div>
              </div>

              {/* Valor Estimado */}
              <div className="space-y-2">
                <Label htmlFor="estimatedValue">Valor Estimado (R$)</Label>
                <Input
                  id="estimatedValue"
                  type="text"
                  placeholder="R$ 0,00"
                  value={formData.estimatedValue}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '')
                    
                    // Aplicar máscara de moeda brasileira
                    if (value.length === 0) {
                      setFormData({ ...formData, estimatedValue: '' })
                      return
                    }
                    
                    // Converter para centavos
                    const numericValue = parseInt(value)
                    
                    // Formatar como moeda
                    const formatted = (numericValue / 100).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      minimumFractionDigits: 2
                    })
                    
                    setFormData({ ...formData, estimatedValue: formatted })
                  }}
                />
              </div>

              {/* Responsável */}
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Responsável (opcional)</Label>
                <Select
                  value={formData.assignedTo}
                  onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum responsável</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>



              {/* Recorrência */}
              <div className="space-y-4">
                <Label>Recorrência (opcional)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recurrenceType">Tipo de Recorrência</Label>
                    <Select
                      value={formData.recurrenceType}
                      onValueChange={(value) => setFormData({ ...formData, recurrenceType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem recorrência</SelectItem>
                        <SelectItem value="daily">Diária</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.recurrenceType !== 'none' && (
                    <div className="space-y-2">
                      <Label htmlFor="recurrenceInterval">Intervalo</Label>
                      <Input
                        id="recurrenceInterval"
                        type="number"
                        min="1"
                        max="365"
                        value={formData.recurrenceInterval}
                        onChange={(e) => setFormData({ ...formData, recurrenceInterval: parseInt(e.target.value) || 1 })}
                        placeholder="Ex: 1 (a cada 1 semana)"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  placeholder="Observações adicionais (opcional)..."
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Criar Agendamento
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Histórico do Equipamento */}
        {formData.equipmentId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="h-5 w-5" />
                <span>Histórico do Equipamento</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EquipmentHistory
                equipmentId={parseInt(formData.equipmentId)}
                equipmentName={equipments.find(eq => eq.id === parseInt(formData.equipmentId))?.name}
                mode="compact"
                maxItems={5}
                onViewFullHistory={() => {
                  // Abrir em nova aba ou modal com histórico completo
                  window.open(`/equipamentos/${formData.equipmentId}/historico`, '_blank');
                }}
                className="border-0 shadow-none p-0"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}