'use client'

import { useMaintenanceDashboard } from '@/src/hooks/useMaintenanceDashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Wrench,
  Plus,
  RefreshCw,
  ArrowLeft
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'

export default function AgendamentosPage() {
  console.log('🚀 [AgendamentosPage] Componente renderizando...')
  
  const router = useRouter()
  
  // Usar company_id padrão (1) para buscar dados do dashboard
  const { dashboard, loading, error, refreshDashboard } = useMaintenanceDashboard('1')

  console.log('🎯 [AgendamentosPage] Estado atual:', {
    dashboard,
    loading,
    error,
    pending_count: dashboard?.pending_count,
    overdue_count: dashboard?.overdue_count,
    completed_this_month: dashboard?.completed_this_month,
    completion_rate: dashboard?.completion_rate
  })
  
  console.log('🔍 [AgendamentosPage] Dashboard completo:', JSON.stringify(dashboard, null, 2))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refreshDashboard}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      // Status em inglês (agendamentos)
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-amber-100 text-amber-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'OVERDUE': return 'bg-red-100 text-red-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      // Status em português (ordens de serviço)
      case 'aberta': return 'bg-blue-100 text-blue-800'
      case 'em_andamento': return 'bg-amber-100 text-amber-800'
      case 'concluida': return 'bg-green-100 text-green-800'
      case 'cancelada': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agendamentos de Manutenção</h1>
          <p className="text-gray-600 mt-1">Gerencie e monitore todas as manutenções preventivas</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={refreshDashboard} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Link href="/agendamentos/novo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link href="/agendamentos/novo">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                <Plus className="h-6 w-6 mb-2" />
                Novo Agendamento
              </Button>
            </Link>
            <Link href="/agendamentos/lista">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                <Calendar className="h-6 w-6 mb-2" />
                Ver Lista Completa
              </Button>
            </Link>
            <Link href="/agendamentos/planos">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                <Wrench className="h-6 w-6 mb-2" />
                Gerenciar Planos
              </Button>
            </Link>
            <Link href="/agendamentos/calendario">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
                <Calendar className="h-6 w-6 mb-2" />
                Visualizar Calendário
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {(() => {
                console.log('🔍 [RENDER] Renderizando pending_count:', dashboard?.pending_count)
                return dashboard?.pending_count || 0
              })()}
            </div>
            <p className="text-xs text-gray-600">Aguardando execução</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {(() => {
                console.log('🔍 [RENDER] Renderizando overdue_count:', dashboard?.overdue_count)
                return dashboard?.overdue_count || 0
              })()}
            </div>
            <p className="text-xs text-gray-600">Requer atenção imediata</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas este Mês</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(() => {
                console.log('🔍 [RENDER] Renderizando completed_this_month:', dashboard?.completed_this_month)
                return dashboard?.completed_this_month || 0
              })()}
            </div>
            <p className="text-xs text-gray-600">Manutenções realizadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {(() => {
                console.log('🔍 [RENDER] Renderizando completion_rate:', dashboard?.completion_rate)
                return dashboard?.completion_rate || 0
              })()}%
            </div>
            <p className="text-xs text-gray-600">Meta: 95%</p>
          </CardContent>
        </Card>
      </div>



      {/* Upcoming and Overdue Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Schedules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximos 7 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard?.upcoming_7_days?.length ? (
                dashboard.upcoming_7_days.map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Wrench className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-sm">{schedule.equipment_name}</span>
                        <Badge className={getPriorityColor(schedule.priority)}>
                          {schedule.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{schedule.plan_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(schedule.scheduled_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Badge className={getStatusColor(schedule.status)}>
                      {schedule.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhum agendamento nos próximos 7 dias</p>
              )}
            </div>
            <div className="mt-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  
                  console.log('🔥 [DEBUG] Botão "Ver Calendário Completo" clicado!')
                  console.log('🔥 [DEBUG] Router disponível:', !!router)
                  console.log('🔥 [DEBUG] Tentando navegar para: /agendamentos/calendario')
                  
                  // Método 1: Tentar router.push
                  try {
                    console.log('🔥 [DEBUG] Método 1: router.push()')
                    router.push('/agendamentos/calendario')
                    console.log('🔥 [DEBUG] router.push() executado')
                    
                    // Aguardar um pouco e verificar se a navegação funcionou
                    setTimeout(() => {
                      if (window.location.pathname !== '/agendamentos/calendario') {
                        console.log('🔥 [DEBUG] router.push() falhou, tentando método alternativo')
                        window.location.href = '/agendamentos/calendario'
                      }
                    }, 100)
                    
                  } catch (error) {
                    console.error('🔥 [DEBUG] Erro no router.push():', error)
                    console.log('🔥 [DEBUG] Método 2: window.location.href')
                    window.location.href = '/agendamentos/calendario'
                  }
                }}
              >
                Ver Calendário Completo
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Overdue Schedules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Manutenções em Atraso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboard?.overdue_schedules?.length ? (
                dashboard.overdue_schedules.map((schedule) => (
                  <div key={schedule.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Wrench className="h-4 w-4 text-red-500" />
                        <span className="font-medium text-sm">{schedule.equipment_name}</span>
                        <Badge className={getPriorityColor(schedule.priority)}>
                          {schedule.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">{schedule.plan_name}</p>
                      <p className="text-xs text-red-600 font-medium">
                        Atrasado desde {new Date(schedule.scheduled_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Badge className="bg-red-100 text-red-800">
                      ATRASADO
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhuma manutenção em atraso</p>
              )}
            </div>
            <div className="mt-4">
              <Link href="/agendamentos/lista?status=OVERDUE">
                <Button variant="outline" className="w-full">
                  Ver Todas em Atraso
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      </div>
    </MainLayout>
  )
}