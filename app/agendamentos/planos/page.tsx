'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MainLayout } from '@/components/layout/main-layout'
import { 
  Search, 
  Plus, 
  Download, 
  Filter, 
  Calendar, 
  Clock, 
  DollarSign,
  Settings,
  Eye,
  Edit,
  Trash2,
  ArrowLeft,
  Wrench
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useMaintenancePlans } from '@/src/hooks/useMaintenancePlans'
import { MaintenancePlan, MaintenanceFrequency, MaintenanceType } from '@/types/maintenance-scheduling'

// Mapeamento de frequências para português
const FREQUENCY_LABELS: Record<MaintenanceFrequency, string> = {
  DAILY: "Diário",
  WEEKLY: "Semanal", 
  MONTHLY: "Mensal",
  QUARTERLY: "Trimestral",
  SEMIANNUAL: "Semestral",
  ANNUAL: "Anual"
}

// Mapeamento de tipos para português
const TYPE_LABELS: Record<MaintenanceType, string> = {
  PREVENTIVE: "Preventiva",
  CORRECTIVE: "Corretiva",
  PREDICTIVE: "Preditiva"
}

// Função para obter cor do badge baseado no tipo
const getTypeColor = (type: MaintenanceType) => {
  switch (type) {
    case 'PREVENTIVE':
      return 'bg-blue-100 text-blue-800'
    case 'CORRECTIVE':
      return 'bg-red-100 text-red-800'
    case 'PREDICTIVE':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Função para obter cor do badge baseado na frequência
const getFrequencyColor = (frequency: MaintenanceFrequency) => {
  switch (frequency) {
    case 'DAILY':
      return 'bg-purple-100 text-purple-800'
    case 'WEEKLY':
      return 'bg-indigo-100 text-indigo-800'
    case 'MONTHLY':
      return 'bg-blue-100 text-blue-800'
    case 'QUARTERLY':
      return 'bg-green-100 text-green-800'
    case 'SEMIANNUAL':
      return 'bg-yellow-100 text-yellow-800'
    case 'ANNUAL':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function PlanosManutencaoPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [frequencyFilter, setFrequencyFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Usar o hook para buscar dados reais
  const { 
    plans, 
    loading, 
    error, 
    totalCount, 
    currentPage, 
    totalPages,
    fetchPlans,
    deletePlan 
  } = useMaintenancePlans()

  // Carregar dados ao montar o componente
  useEffect(() => {
    const filters = {
      search: searchTerm || undefined,
      maintenance_type: typeFilter !== 'all' ? typeFilter as MaintenanceType : undefined,
      frequency: frequencyFilter !== 'all' ? frequencyFilter as MaintenanceFrequency : undefined,
      is_active: statusFilter !== 'all' ? statusFilter === 'active' : undefined,
      page: 1,
      limit: 20
    }
    fetchPlans(filters)
  }, [searchTerm, typeFilter, frequencyFilter, statusFilter])

  // Filtrar planos localmente para busca em tempo real
  const filteredPlans = plans.filter(plan => {
    const matchesSearch = !searchTerm || 
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (plan.description && plan.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = typeFilter === 'all' || plan.maintenance_type === typeFilter
    const matchesFrequency = frequencyFilter === 'all' || plan.frequency === frequencyFilter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && plan.is_active) ||
      (statusFilter === 'inactive' && !plan.is_active)
    
    return matchesSearch && matchesType && matchesFrequency && matchesStatus
  })

  const handleDeletePlan = (planId: string) => {
    setPlanToDelete(planId)
    setDeleteDialogOpen(true)
  }

  const confirmDeletePlan = async () => {
    if (!planToDelete) return
    
    setIsDeleting(true)
    try {
      await deletePlan(planToDelete)
      toast.success('Plano de manutenção excluído com sucesso!')
      setDeleteDialogOpen(false)
      setPlanToDelete(null)
    } catch (error: any) {
      console.error('Erro ao excluir plano:', error)
      toast.error(error.message || 'Erro ao excluir plano de manutenção')
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">Erro ao carregar planos</div>
            <div className="text-gray-600 mb-4">{error}</div>
            <Button onClick={() => fetchPlans()}>Tentar novamente</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para Agendamentos
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Planos de Manutenção
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Gerencie e monitore seus planos de manutenção preventiva
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => router.push('/agendamentos/planos/novo')}
                >
                  <Plus className="h-4 w-4" />
                  Novo Plano
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="container mx-auto px-6 py-6">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar planos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="PREVENTIVE">Preventiva</SelectItem>
                    <SelectItem value="CORRECTIVE">Corretiva</SelectItem>
                    <SelectItem value="PREDICTIVE">Preditiva</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Frequência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as frequências</SelectItem>
                    <SelectItem value="DAILY">Diário</SelectItem>
                    <SelectItem value="WEEKLY">Semanal</SelectItem>
                    <SelectItem value="MONTHLY">Mensal</SelectItem>
                    <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                    <SelectItem value="SEMIANNUAL">Semestral</SelectItem>
                    <SelectItem value="ANNUAL">Anual</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros Avançados
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Plans Grid */}
          {filteredPlans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map((plan) => (
                <Card key={plan.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                          {plan.name}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={getTypeColor(plan.maintenance_type)}>
                            {TYPE_LABELS[plan.maintenance_type]}
                          </Badge>
                          <Badge className={getFrequencyColor(plan.frequency)}>
                            {FREQUENCY_LABELS[plan.frequency]}
                          </Badge>
                          <Badge variant={plan.is_active ? "default" : "secondary"}>
                            {plan.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Description */}
                    {plan.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {plan.description}
                      </p>
                    )}

                    {/* Plan Details */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 text-sm">
                          Próxima execução: {plan.next_execution_date ? 
                            new Date(plan.next_execution_date).toLocaleDateString('pt-BR') : 
                            'Não agendada'
                          }
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            {plan.estimated_duration} min
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">
                            R$ {typeof plan.estimated_cost === 'number' ? plan.estimated_cost.toFixed(2) : (parseFloat(plan.estimated_cost) || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Equipment Count */}
                      <div className="flex items-center gap-2 text-sm">
                        <Settings className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {plan.equipment_ids?.length || 0} equipamentos
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/agendamentos/planos/${plan.id}`)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/agendamentos/planos/${plan.id}/editar`)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePlan(plan.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm || typeFilter !== 'all' || frequencyFilter !== 'all' || statusFilter !== 'all'
                    ? 'Nenhum plano encontrado'
                    : 'Nenhum plano de manutenção cadastrado'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || typeFilter !== 'all' || frequencyFilter !== 'all' || statusFilter !== 'all'
                    ? 'Tente ajustar os filtros para encontrar o que procura.'
                    : 'Você ainda não possui planos de manutenção cadastrados.'}
                </p>
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => router.push('/agendamentos/planos/novo')}
                >
                  <Plus className="h-4 w-4" />
                  Criar Primeiro Plano
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este plano de manutenção? Esta ação não pode ser desfeita e todos os agendamentos relacionados também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePlan}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  )
}