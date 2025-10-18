'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Building,
  Wrench,
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Download
} from 'lucide-react'
import { toast } from 'sonner'

interface ServiceOrder {
  id: number
  order_number: string
  equipment_id: number
  equipment_name: string
  equipment_model: string
  equipment_serial: string
  company_id: number
  company_name: string
  company_phone: string
  description: string
  priority: string
  status: string
  maintenance_type_id: number
  maintenance_type_name: string
  cost: number
  actual_cost: number
  scheduled_date: string
  completion_date: string
  created_at: string
  updated_at: string
  created_by: number
  created_by_name: string
  assigned_to: number
  assigned_to_name: string
  template_id: number
  template_name: string
  description_template: string
}

interface MaintenanceHistory {
  id: number
  description: string
  performed_date: string
  performed_by: number
  performed_by_name: string
  cost: number
  notes: string
}

export default function ServiceOrderDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [serviceOrder, setServiceOrder] = useState<ServiceOrder | null>(null)
  const [history, setHistory] = useState<MaintenanceHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadServiceOrder()
    }
  }, [id])

  const loadServiceOrder = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/service-orders/${id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar ordem de serviço')
      }

      if (data.success) {
        setServiceOrder(data.order)
        setHistory(data.history || [])
      } else {
        throw new Error(data.error || 'Ordem de serviço não encontrada')
      }
    } catch (error) {
      console.error('Erro ao carregar ordem de serviço:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
      toast.error('Erro ao carregar ordem de serviço')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'aberta': { label: 'Aberta', variant: 'secondary' as const, icon: Clock },
      'em_andamento': { label: 'Em Andamento', variant: 'default' as const, icon: Wrench },
      'concluida': { label: 'Concluída', variant: 'default' as const, icon: CheckCircle },
      'cancelada': { label: 'Cancelada', variant: 'destructive' as const, icon: XCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['aberta']
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      'baixa': { label: 'Baixa', variant: 'secondary' as const },
      'media': { label: 'Média', variant: 'default' as const },
      'alta': { label: 'Alta', variant: 'destructive' as const },
      'critica': { label: 'Crítica', variant: 'destructive' as const }
    }

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig['media']

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Não informado'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Não informado'
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const handleEdit = () => {
    // Navegar para página de edição (quando implementada)
    toast.info('Funcionalidade de edição em desenvolvimento')
  }

  const handleGeneratePDF = async () => {
    try {
      const response = await fetch(`/api/pdf/new-download/${id}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `OS-${serviceOrder?.order_number}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('PDF gerado com sucesso')
      } else {
        throw new Error('Erro ao gerar PDF')
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast.error('Erro ao gerar PDF')
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <div className="text-center py-8">
            <p>Carregando ordem de serviço...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !serviceOrder) {
    return (
      <MainLayout>
        <div className="container mx-auto p-6">
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error || 'Ordem de serviço não encontrada'}</p>
            <Button onClick={() => router.push('/ordens-servico')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Ordens de Serviço
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/ordens-servico')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{serviceOrder.order_number}</h1>
              <p className="text-muted-foreground">
                Detalhes da ordem de serviço
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
            <Button variant="outline" onClick={handleGeneratePDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {/* Status e Prioridade */}
        <div className="flex items-center gap-4">
          {getStatusBadge(serviceOrder.status)}
          {getPriorityBadge(serviceOrder.priority)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informações Principais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Descrição</h4>
                <p className="mt-1">{serviceOrder.description}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Tipo de Manutenção</h4>
                  <p className="mt-1">{serviceOrder.maintenance_type_name || 'Não informado'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Template</h4>
                  <p className="mt-1">{serviceOrder.template_name || 'Não informado'}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Custo Estimado</h4>
                  <p className="mt-1 font-medium">{formatCurrency(serviceOrder.cost)}</p>
                </div>
                {serviceOrder.actual_cost && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Custo Real</h4>
                    <p className="mt-1 font-medium">{formatCurrency(serviceOrder.actual_cost)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Equipamento e Empresa */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Equipamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Nome</h4>
                <p className="mt-1 font-medium">{serviceOrder.equipment_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Modelo</h4>
                  <p className="mt-1">{serviceOrder.equipment_model || 'Não informado'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Série</h4>
                  <p className="mt-1">{serviceOrder.equipment_serial || 'Não informado'}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Empresa
                </h4>
                <p className="mt-1 font-medium">{serviceOrder.company_name}</p>
                {serviceOrder.company_phone && (
                  <p className="text-sm text-muted-foreground">{serviceOrder.company_phone}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Datas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Cronograma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Criado em</h4>
                <p className="mt-1">{formatDateTime(serviceOrder.created_at)}</p>
              </div>

              {serviceOrder.scheduled_date && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Agendado para</h4>
                  <p className="mt-1">{formatDate(serviceOrder.scheduled_date)}</p>
                </div>
              )}

              {serviceOrder.completion_date && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Concluído em</h4>
                  <p className="mt-1">{formatDate(serviceOrder.completion_date)}</p>
                </div>
              )}

              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Última atualização</h4>
                <p className="mt-1">{formatDateTime(serviceOrder.updated_at)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Responsáveis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Responsáveis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Criado por</h4>
                <p className="mt-1">{serviceOrder.created_by_name || 'Não informado'}</p>
              </div>

              {serviceOrder.assigned_to_name && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Atribuído para</h4>
                  <p className="mt-1">{serviceOrder.assigned_to_name}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Histórico de Manutenção */}
        {history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Histórico de Manutenção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.map((item, index) => (
                  <div key={item.id} className="border-l-2 border-blue-200 pl-4 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{item.description}</p>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span>Executado em: {formatDate(item.performed_date)}</span>
                          <span>Por: {item.performed_by_name}</span>
                          {item.cost > 0 && <span>Custo: {formatCurrency(item.cost)}</span>}
                        </div>
                      </div>
                    </div>
                    {index < history.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}