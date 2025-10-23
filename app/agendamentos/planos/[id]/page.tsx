"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Calendar, Clock, DollarSign, Wrench, AlertTriangle, CheckCircle, Users, Building2, FileText, Loader2 } from "lucide-react"
import { MainLayout } from '@/components/layout/main-layout'
import { useMaintenancePlans } from '@/src/hooks/useMaintenancePlans'
import { MaintenancePlan } from '@/types/maintenance-scheduling'
import { toast } from 'sonner'
import Link from 'next/link'

interface Equipment {
  id: string
  name: string
  code: string
  sector_name?: string
  model?: string
  patrimonio?: string
}

interface MaintenanceTask {
  task_name: string
  description: string
  is_required: boolean
  order_sequence: number
}

export default function VisualizarPlanoPage() {
  const router = useRouter()
  const params = useParams()
  const planId = params.id as string
  
  const { getPlanById, loading } = useMaintenancePlans()
  
  const [plan, setPlan] = useState<MaintenancePlan | null>(null)
  const [loadingPlan, setLoadingPlan] = useState(true)
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [tasks, setTasks] = useState<MaintenanceTask[]>([])

  // Buscar dados do plano
  useEffect(() => {
    const fetchPlanData = async () => {
      if (!planId) return

      try {
        setLoadingPlan(true)
        
        // Buscar dados do plano
        const planData = await getPlanById(planId)
        if (planData) {
          setPlan(planData)
          
          // Buscar equipamentos associados
          await fetchEquipment(planId)
          
          // Buscar tarefas do plano
          await fetchTasks(planId)
        } else {
          toast.error('Plano de manutenção não encontrado')
          router.push('/agendamentos/planos')
        }
      } catch (error) {
        console.error('Erro ao buscar plano:', error)
        toast.error('Erro ao carregar dados do plano')
      } finally {
        setLoadingPlan(false)
      }
    }

    fetchPlanData()
  }, [planId, getPlanById, router])

  // Buscar equipamentos associados ao plano
  const fetchEquipment = async (planId: string) => {
    try {
      const response = await fetch(`/api/maintenance-plans/${planId}/equipment`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setEquipment(data.data || [])
          console.log('Equipamentos carregados:', data.data?.length || 0)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error)
    }
  }

  // Buscar tarefas do plano
  const fetchTasks = async (planId: string) => {
    try {
      const response = await fetch(`/api/maintenance-plans/${planId}/tasks`)
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTasks(data.data || [])
          console.log('Tarefas carregadas:', data.data?.length || 0)
        }
      }
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error)
    }
  }

  // Função para formatar frequência
  const formatFrequency = (frequency: string) => {
    const frequencies: { [key: string]: string } = {
      'DAILY': 'Diário',
      'WEEKLY': 'Semanal',
      'MONTHLY': 'Mensal',
      'QUARTERLY': 'Trimestral',
      'BIANNUAL': 'Semestral',
      'ANNUAL': 'Anual'
    }
    return frequencies[frequency] || frequency
  }

  // Função para formatar tipo de manutenção
  const formatMaintenanceType = (type: string) => {
    const types: { [key: string]: string } = {
      'PREVENTIVE': 'Preventiva',
      'CORRECTIVE': 'Corretiva',
      'PREDICTIVE': 'Preditiva',
      'EMERGENCY': 'Emergencial'
    }
    return types[type] || type
  }

  // Função para formatar moeda
  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue)
  }

  // Função para calcular dias baseado na frequência
  const calculateFrequencyDays = (frequency: string) => {
    const frequencyDays: { [key: string]: number } = {
      'DAILY': 1,
      'WEEKLY': 7,
      'MONTHLY': 30,
      'QUARTERLY': 90,
      'BIANNUAL': 180,
      'SEMIANNUAL': 180,
      'ANNUAL': 365
    }
    return frequencyDays[frequency] || 0
  }

  if (loadingPlan || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Carregando dados do plano...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!plan) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Plano não encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              O plano de manutenção solicitado não foi encontrado.
            </p>
            <Link href="/agendamentos/planos">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar aos Planos
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{plan.name}</h1>
              <p className="text-gray-600 mt-1">Detalhes do plano de manutenção</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant={plan.is_active ? "default" : "secondary"}>
              {plan.is_active ? 'Ativo' : 'Inativo'}
            </Badge>
            <Link href={`/agendamentos/planos/${planId}/editar`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Editar Plano
              </Button>
            </Link>
          </div>
        </div>

        {/* Informações Principais */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Básicas */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Descrição</label>
                <p className="mt-1 text-gray-900">{plan.description || 'Sem descrição'}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Tipo de Manutenção</label>
                  <p className="mt-1 text-gray-900">{formatMaintenanceType(plan.maintenance_type)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Frequência</label>
                  <p className="mt-1 text-gray-900">{formatFrequency(plan.frequency)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Duração Estimada</label>
                  <p className="mt-1 text-gray-900 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {plan.estimated_duration_hours}h
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Custo Estimado</label>
                  <p className="mt-1 text-gray-900 flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(plan.estimated_cost)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Data de Criação</label>
                  <p className="mt-1 text-gray-900 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(plan.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Última Atualização</label>
                  <p className="mt-1 text-gray-900 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(plan.updated_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{equipment.length}</div>
                <div className="text-sm text-blue-700">Equipamentos Associados</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{tasks.length}</div>
                <div className="text-sm text-green-700">Tarefas Definidas</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {calculateFrequencyDays(plan.frequency)}
                </div>
                <div className="text-sm text-purple-700">Dias de Frequência</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Equipamentos Associados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Equipamentos Associados ({equipment.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {equipment.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {equipment.map((eq, index) => (
                  <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{eq.name}</h4>
                        <p className="text-sm text-gray-600">Código: {eq.code}</p>
                        {eq.sector_name && (
                          <p className="text-sm text-gray-600">Setor: {eq.sector_name}</p>
                        )}
                        {eq.model && (
                          <p className="text-sm text-gray-600">Modelo: {eq.model}</p>
                        )}
                        {eq.patrimonio && (
                          <p className="text-sm text-gray-600">Patrimônio: {eq.patrimonio}</p>
                        )}
                      </div>
                      <Wrench className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum equipamento associado
                </h3>
                <p className="text-gray-600">
                  Este plano ainda não possui equipamentos associados.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tarefas do Plano */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Tarefas do Plano ({tasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length > 0 ? (
              <div className="space-y-4">
                {tasks
                  .sort((a, b) => a.order_sequence - b.order_sequence)
                  .map((task, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-gray-500">
                              #{task.order_sequence}
                            </span>
                            <h4 className="font-medium text-gray-900">{task.task_name}</h4>
                            {task.is_required && (
                              <Badge variant="destructive" className="text-xs">
                                Obrigatória
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{task.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhuma tarefa definida
                </h3>
                <p className="text-gray-600">
                  Este plano ainda não possui tarefas definidas.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}