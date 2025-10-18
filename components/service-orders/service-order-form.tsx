'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Combobox } from '@/components/ui/combobox'
import { PrioritySelect } from '@/components/ui/priority-select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarIcon, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { formatCurrency, parseCurrencyValue, applyCurrencyMask } from '@/lib/currency'
import { 
  Equipment, 
  Company,
  ServiceTemplate,
  User
} from '@/types/service-orders'

interface ServiceOrderFormProps {
  onSave?: () => void
  onCancel?: () => void
}

interface MaintenanceType {
  id: number
  name: string
  description?: string
  category?: string
  isActive: boolean
}

export default function ServiceOrderForm({ onSave, onCancel }: ServiceOrderFormProps) {
  const router = useRouter()
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [templates, setTemplates] = useState<ServiceTemplate[]>([])
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  // Estados do formulário
  const [formData, setFormData] = useState({
    companyId: '',
    equipmentId: '',
    sectorName: '', // Campo informativo
    subsectorName: '', // Campo informativo
    maintenanceType: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    estimatedCost: 0,
    scheduledDate: null as Date | null,
    observations: '',
    templateId: '',
    responsibleUserId: 'none'
  })

  // Carregar dados iniciais
  useEffect(() => {
    loadEquipment()
    loadCompanies()
    loadTemplates()
    loadMaintenanceTypes()
    loadUsers()
  }, [])

  // Atualizar setor e subsetor quando equipamento for selecionado
  useEffect(() => {
    if (formData.equipmentId) {
      const selectedEquipment = equipment.find(eq => eq.id === parseInt(formData.equipmentId))
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
  }, [formData.equipmentId, equipment])

  const loadEquipment = async () => {
    try {
      const response = await fetch('/api/equipment')
      const data = await response.json()
      if (data.success) {
        setEquipment(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error)
    }
  }

  const loadCompanies = async () => {
    try {
      console.log('🔄 Carregando empresas...')
      const response = await fetch('/api/companies')
      console.log('📡 Response status:', response.status)
      const data = await response.json()
      console.log('📊 Data received:', data)
      if (data.success) {
        console.log('✅ Empresas carregadas:', data.companies?.length || 0)
        setCompanies(data.companies)
      } else {
        console.error('❌ Falha ao carregar empresas:', data.error)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar empresas:', error)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/service-templates')
      const data = await response.json()
      if (data.success) {
        setTemplates(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    }
  }

  const loadMaintenanceTypes = async () => {
    try {
      const response = await fetch('/api/maintenance-types')
      const data = await response.json()
      if (data.success) {
        setMaintenanceTypes(data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de manutenção:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      if (Array.isArray(data)) {
        setUsers(data)
      } else {
        console.error('Formato de resposta inesperado da API de usuários:', data)
        toast.error('Erro ao carregar usuários')
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      toast.error('Erro ao carregar usuários')
    }
  }

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



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Debug: Mostrar estado atual de todos os campos
      console.log('🔍 [FRONTEND DEBUG] Estado completo do formData:', formData)
      console.log('🔍 [FRONTEND DEBUG] Campos obrigatórios:')
      console.log('  - companyId:', formData.companyId, '(tipo:', typeof formData.companyId, ')')
      console.log('  - equipmentId:', formData.equipmentId, '(tipo:', typeof formData.equipmentId, ')')
      console.log('  - maintenanceType:', formData.maintenanceType, '(tipo:', typeof formData.maintenanceType, ')')
      console.log('  - description:', formData.description, '(tipo:', typeof formData.description, ', length:', formData.description.length, ')')

      // Validação client-side
      if (!formData.companyId) {
        console.log('❌ [FRONTEND DEBUG] Falha na validação: companyId vazio')
        toast.error('Selecione uma empresa')
        setLoading(false)
        return
      }
      
      if (!formData.equipmentId) {
        console.log('❌ [FRONTEND DEBUG] Falha na validação: equipmentId vazio')
        toast.error('Selecione um equipamento')
        setLoading(false)
        return
      }
      
      if (!formData.maintenanceType) {
        console.log('❌ [FRONTEND DEBUG] Falha na validação: maintenanceType vazio')
        toast.error('Selecione o tipo de manutenção')
        setLoading(false)
        return
      }
      
      if (!formData.description.trim()) {
        console.log('❌ [FRONTEND DEBUG] Falha na validação: description vazio')
        toast.error('Preencha a descrição do serviço')
        setLoading(false)
        return
      }

      console.log('✅ [FRONTEND DEBUG] Todas as validações client-side passaram')

      const submitData = {
        equipmentId: parseInt(formData.equipmentId),
        companyId: parseInt(formData.companyId),
        maintenanceTypeId: formData.maintenanceType ? parseInt(formData.maintenanceType) : null,
        description: formData.description,
        priority: formData.priority,
        estimatedCost: formData.estimatedCost,
        scheduledDate: formData.scheduledDate ? format(formData.scheduledDate, 'yyyy-MM-dd') : null,
        observations: formData.observations,
        templateId: formData.templateId && formData.templateId !== 'none' ? parseInt(formData.templateId) : null,
        assignedTo: formData.responsibleUserId && formData.responsibleUserId !== 'none' ? parseInt(formData.responsibleUserId) : null,
        createdBy: 1 // TODO: Pegar do contexto de autenticação
      }

      console.log('🔍 [FRONTEND] Dados sendo enviados:', submitData)
      console.log('🔍 [FRONTEND] Campo responsibleUserId:', formData.responsibleUserId)
      console.log('🔍 [FRONTEND] Campo assignedTo no payload:', submitData.assignedTo)
      console.log('🔍 [FRONTEND] Campo maintenanceType:', formData.maintenanceType)
      console.log('🔍 [FRONTEND] Campo maintenanceTypeId no payload:', submitData.maintenanceTypeId)

      // Verificar se os campos obrigatórios estão presentes no payload
      console.log('🔍 [FRONTEND DEBUG] Verificação final dos campos obrigatórios no payload:')
      console.log('  - equipmentId:', submitData.equipmentId, '(válido:', !!submitData.equipmentId, ')')
      console.log('  - companyId:', submitData.companyId, '(válido:', !!submitData.companyId, ')')
      console.log('  - maintenanceTypeId:', submitData.maintenanceTypeId, '(válido:', !!submitData.maintenanceTypeId, ')')
      console.log('  - description:', submitData.description, '(válido:', !!submitData.description, ')')
      console.log('  - createdBy:', submitData.createdBy, '(válido:', !!submitData.createdBy, ')')

      const response = await fetch('/api/service-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Ordem de serviço criada com sucesso!')
        if (onSave) {
          onSave()
        } else {
          router.push('/ordens-servico')
        }
      } else {
        console.log('❌ [FRONTEND DEBUG] Erro da API:', result.error)
        toast.error(result.error || 'Erro ao criar ordem de serviço')
      }
    } catch (error) {
      console.error('Erro ao salvar ordem de serviço:', error)
      toast.error('Erro ao salvar ordem de serviço')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Nova Ordem de Serviço</h1>
          <p className="text-muted-foreground">
            Preencha os dados para criar uma nova ordem de serviço
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Ordem de Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Empresa - Linha separada */}
            <div>
              <Label htmlFor="company">Empresa *</Label>
              <Combobox
                value={formData.companyId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, companyId: value }))}
                options={companies?.map((company) => ({
                  value: company.id.toString(),
                  label: `${company.name}${company.cnpj ? ` - ${company.cnpj}` : ''}`
                })) || []}
                placeholder="Selecione a empresa que vai prestar o serviço"
                searchPlaceholder="Buscar por nome ou CNPJ..."
                emptyText="Nenhuma empresa encontrada"
                allowCustomValue={false}
              />
            </div>

            {/* Campo Equipamento e campos informativos de Setor/Subsetor */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1">
                <Label htmlFor="equipment">Equipamento *</Label>
                <Combobox
                  value={formData.equipmentId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, equipmentId: value }))}
                  options={equipment?.map((eq) => ({
                    value: eq.id.toString(),
                    label: `${eq.name}${eq.patrimonio_number ? ` - ${eq.patrimonio_number}` : ''}`
                  })) || []}
                  placeholder="Selecione o equipamento"
                  searchPlaceholder="Buscar por nome ou patrimônio..."
                  emptyText="Nenhum equipamento encontrado"
                  allowCustomValue={false}
                />
              </div>

              <div>
                <Label htmlFor="sector">Setor</Label>
                <Input
                  id="sector"
                  value={formData.sectorName}
                  disabled
                  placeholder="Será preenchido automaticamente"
                  className="bg-muted"
                />
              </div>

              <div>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="maintenanceType">Tipo de Manutenção *</Label>
                <Select
                  value={formData.maintenanceType}
                  onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, maintenanceType: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de manutenção" />
                  </SelectTrigger>
                  <SelectContent>
                    {maintenanceTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="responsibleUser">Responsável (opcional)</Label>
                <Select
                  value={formData.responsibleUserId}
                  onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, responsibleUserId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum responsável</SelectItem>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <PrioritySelect
                  value={formData.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high') => 
                    setFormData(prev => ({ ...prev, priority: value }))}
                  variant="service-order"
                  placeholder="Selecione a prioridade"
                />
              </div>
            </div>

            <div>
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

            <div>
              <Label htmlFor="description">Descrição do Serviço *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o serviço a ser realizado..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimatedCost">Custo Estimado (R$)</Label>
                <Input
                  id="estimatedCost"
                  type="text"
                  value={formData.estimatedCost > 0 ? formatCurrency(formData.estimatedCost) : ''}
                  onChange={(e) => {
                    const maskedValue = applyCurrencyMask(e.target.value)
                    e.target.value = maskedValue
                    const numericValue = parseCurrencyValue(maskedValue)
                    setFormData(prev => ({ 
                      ...prev, 
                      estimatedCost: numericValue
                    }))
                  }}
                  placeholder="R$ 0,00"
                />
              </div>
            </div>

            <div>
              <Label>Data de Agendamento (opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.scheduledDate ? (
                      format(formData.scheduledDate, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.scheduledDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, scheduledDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                placeholder="Observações adicionais..."
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (onCancel) {
                    onCancel()
                  } else {
                    router.push('/ordens-servico')
                  }
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Criando...' : 'Criar Ordem'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}