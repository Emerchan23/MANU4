'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMaintenanceSchedules } from '@/src/hooks/useMaintenanceSchedules'
import { MaintenanceScheduleFilters, ScheduleStatus, MaintenancePriority } from '@/types/maintenance-scheduling'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DateInput } from '@/components/ui/date-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PriorityFilterSelect } from '@/components/ui/priority-select'
import { MainLayout } from '@/components/layout/main-layout'
import { 
  Calendar, 
  Search, 
  Filter, 
  Download, 
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Wrench,
  User,
  Building,
  ArrowLeft,
  FileText,
  ArrowRight,
  ThumbsUp,
  Repeat
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
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


function AgendamentosListaPage() {
  const [filters, setFilters] = useState<MaintenanceScheduleFilters>({
    status: undefined,
    page: 1,
    limit: 20
  })
  
  const { 
    schedules, 
    loading, 
    error, 
    totalCount, 
    currentPage, 
    totalPages,
    fetchSchedules,
    deleteSchedule,
    completeSchedule
  } = useMaintenanceSchedules(filters)

  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredSchedules, setFilteredSchedules] = useState(schedules)
  const [convertingSchedules, setConvertingSchedules] = useState<string[]>([])
  const [approvingSchedules, setApprovingSchedules] = useState<string[]>([])
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [scheduleToDelete, setScheduleToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [scheduleRecurrenceInfo, setScheduleRecurrenceInfo] = useState<{[key: string]: any}>({})

  // Verificar se há agendamentos com técnicos atribuídos para mostrar a coluna
  const hasAssignedTechnicians = schedules.some(schedule => schedule.assigned_technician_name)

  useEffect(() => {
    fetchSchedules(filters)
  }, [filters, fetchSchedules])

  // Função para buscar informações de recorrência dos agendamentos
  const fetchRecurrenceInfo = useCallback(async (scheduleId: string) => {
    try {
      console.log(`🔍 Buscando informações de recorrência para agendamento ID: ${scheduleId}`)
      const response = await fetch(`/api/agendamentos/${scheduleId}/recurrence-info`)
      console.log(`📡 Response status para ID ${scheduleId}:`, response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log(`📊 Dados de recorrência para ID ${scheduleId}:`, data)
        
        if (data.success) {
          setScheduleRecurrenceInfo(prev => ({
            ...prev,
            [scheduleId]: data.data
          }))
          console.log(`✅ Informações de recorrência salvas para ID ${scheduleId}:`, data.data)
        } else {
          console.log(`❌ Falha na resposta para ID ${scheduleId}:`, data)
        }
      } else {
        console.log(`❌ Erro HTTP ${response.status} para ID ${scheduleId}`)
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar informações de recorrência para ID ${scheduleId}:`, error)
    }
  }, [])

  // Buscar informações de recorrência para todos os agendamentos quando a lista carrega
  useEffect(() => {
    if (schedules.length > 0) {
      console.log(`🔄 Carregando informações de recorrência para ${schedules.length} agendamentos`)
      schedules.forEach(schedule => {
        if (!scheduleRecurrenceInfo[schedule.id]) {
          console.log(`🆕 Buscando recorrência para novo agendamento ID: ${schedule.id}`)
          fetchRecurrenceInfo(schedule.id)
        } else {
          console.log(`✅ Recorrência já carregada para ID: ${schedule.id}`, scheduleRecurrenceInfo[schedule.id])
        }
      })
    }
  }, [schedules, scheduleRecurrenceInfo, fetchRecurrenceInfo])

  // Função para filtrar agendamentos baseado no termo de busca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSchedules(schedules)
    } else {
      const filtered = schedules.filter(schedule => {
        const searchLower = searchTerm.toLowerCase()
        
        // Buscar por nome do equipamento
        const equipmentMatch = schedule.equipment_name?.toLowerCase().includes(searchLower)
        
        // Buscar por número do patrimônio
        const patrimonioMatch = schedule.equipment_patrimonio_number?.toLowerCase().includes(searchLower)
        
        // Buscar por nome da empresa prestadora (se existir)
        const companyMatch = schedule.company_name?.toLowerCase().includes(searchLower)
        
        // Buscar por data do agendamento (formato brasileiro)
        const dateMatch = schedule.scheduled_date && 
          schedule.scheduled_date.includes && schedule.scheduled_date.includes(searchTerm)
        
        return equipmentMatch || patrimonioMatch || companyMatch || dateMatch
      })
      setFilteredSchedules(filtered)
    }
  }, [schedules, searchTerm])

  const handleFilterChange = (key: keyof MaintenanceScheduleFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleSelectSchedule = (scheduleId: string) => {
    setSelectedSchedules(prev => 
      prev.includes(scheduleId) 
        ? prev.filter(id => id !== scheduleId)
        : [...prev, scheduleId]
    )
  }

  const handleSelectAll = () => {
    if (selectedSchedules.length === schedules.length) {
      setSelectedSchedules([])
    } else {
      setSelectedSchedules(schedules.map(s => s.id))
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedSchedules.length === 0) {
      toast.error('Nenhum agendamento selecionado', {
        description: 'Selecione pelo menos um agendamento para executar esta ação.'
      })
      return
    }

    if (action === 'delete') {
      const confirmMessage = selectedSchedules.length === 1 
        ? 'Tem certeza que deseja excluir este agendamento?' 
        : `Tem certeza que deseja excluir ${selectedSchedules.length} agendamentos selecionados?`
      
      if (!confirm(confirmMessage)) {
        return
      }

      let successCount = 0
      let errorCount = 0
      const totalCount = selectedSchedules.length

      // Mostrar toast de progresso
      toast.info(`Excluindo ${totalCount} agendamento(s)...`, {
        description: 'Por favor, aguarde enquanto processamos a exclusão.'
      })

      // Processar exclusões uma por uma
      for (const scheduleId of selectedSchedules) {
        try {
          const success = await deleteSchedule(scheduleId)
          if (success) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          console.error(`Erro ao excluir agendamento ${scheduleId}:`, error)
          errorCount++
        }
      }

      // Limpar seleção após processamento
      setSelectedSchedules([])

      // Atualizar lista
      await fetchSchedules(filters)

      // Mostrar resultado final
      if (successCount === totalCount) {
        toast.success(`${successCount} agendamento(s) excluído(s) com sucesso!`)
      } else if (successCount > 0) {
        toast.warning(`${successCount} agendamento(s) excluído(s) com sucesso, ${errorCount} falharam.`, {
          description: 'Alguns agendamentos não puderam ser excluídos.'
        })
      } else {
        toast.error('Falha ao excluir os agendamentos', {
          description: 'Nenhum agendamento foi excluído. Verifique se há problemas de conexão.'
        })
      }
    } else if (action === 'cancel') {
      // Limpar seleção
      setSelectedSchedules([])
      toast.info('Seleção cancelada')
    }
  }

  const handleCompleteSchedule = async (scheduleId: string) => {
    const success = await completeSchedule(scheduleId, {
      completed_tasks: [], // Empty array for quick completion
      actual_duration: 60, // Default 1 hour duration
      actual_cost: 0, // This should come from a form
      completion_notes: 'Concluído via lista'
    })
    
    if (success) {
      // Refresh the list
      fetchSchedules(filters)
    }
  }

  const handleDeleteSchedule = async (schedule: any) => {
    setScheduleToDelete(schedule)
    
    // Verificar se o agendamento tem recorrências
    const recurrenceInfo = scheduleRecurrenceInfo[schedule.id]
    if (recurrenceInfo?.hasRecurrence) {
      // Usar modal especial para agendamentos recorrentes
      setDeleteModalOpen(true)
    } else {
      // Usar modal padrão para agendamentos simples
      setDeleteModalOpen(true)
    }
  }

  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return
    
    console.log('handleDeleteSchedule chamado com ID:', scheduleToDelete.id)
    setIsDeleting(true)
    
    console.log('Confirmação aceita, chamando deleteSchedule...')
    const success = await deleteSchedule(scheduleToDelete.id)
    console.log('Resultado da exclusão:', success)
    
    setIsDeleting(false)
    setDeleteModalOpen(false)
    setScheduleToDelete(null)
    
    if (success) {
      console.log('Exclusão bem-sucedida, atualizando lista...')
      fetchSchedules(filters)
    } else {
      console.error('Falha na exclusão')
    }
  }

  const handleCancelSchedule = async (scheduleId: string) => {
    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
      try {
        const response = await fetch(`/api/maintenance-schedules/${scheduleId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'cancelado'
          })
        })

        const data = await response.json()

        if (data.success) {
          toast.success('Agendamento cancelado com sucesso!')
          fetchSchedules(filters)
        } else {
          toast.error('Erro ao cancelar agendamento', {
            description: data.error || 'Erro desconhecido'
          })
        }
      } catch (error) {
        console.error('Erro ao cancelar agendamento:', error)
        toast.error('Erro ao cancelar agendamento', {
          description: 'Ocorreu um erro de comunicação com o servidor'
        })
      }
    }
  }

  // Função para converter agendamento em ordem de serviço
  const handleConvertToServiceOrder = async (scheduleId: string) => {
    if (convertingSchedules.includes(scheduleId)) {
      return // Já está convertendo
    }

    try {
      setConvertingSchedules(prev => [...prev, scheduleId])
      
      const response = await fetch('/api/maintenance-schedules/convert-to-service-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduleId: scheduleId,
          userId: 1 // TODO: Pegar do contexto de autenticação
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Ordem de serviço ${data.data.orderNumber} criada com sucesso!`, {
          description: 'O agendamento foi convertido em ordem de serviço.'
        })
        
        // Atualizar a lista
        fetchSchedules(filters)
      } else {
        toast.error('Erro ao converter agendamento', {
          description: data.error || 'Ocorreu um erro inesperado'
        })
      }
    } catch (error) {
      console.error('Erro ao converter agendamento:', error)
      toast.error('Erro ao converter agendamento', {
        description: 'Ocorreu um erro de comunicação com o servidor'
      })
    } finally {
      setConvertingSchedules(prev => prev.filter(id => id !== scheduleId))
    }
  }

  // Função para aprovar agendamento (mudar status para concluído)
  const handleApproveSchedule = async (scheduleId: string) => {
    if (approvingSchedules.includes(scheduleId)) {
      return // Já está aprovando
    }

    try {
      setApprovingSchedules(prev => [...prev, scheduleId])
      
      const response = await fetch(`/api/maintenance-schedules/${scheduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CONCLUIDA'
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Agendamento aprovado com sucesso!', {
          description: 'O status foi alterado para "Concluído".'
        })
        
        // Atualizar a lista
        fetchSchedules(filters)
      } else {
        toast.error('Erro ao aprovar agendamento', {
          description: data.error || 'Ocorreu um erro inesperado'
        })
      }
    } catch (error) {
      console.error('Erro ao aprovar agendamento:', error)
      toast.error('Erro ao aprovar agendamento', {
        description: 'Ocorreu um erro de comunicação com o servidor'
      })
    } finally {
      setApprovingSchedules(prev => prev.filter(id => id !== scheduleId))
    }
  }

  // Função para traduzir status de inglês para português
  const translateStatus = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'Agendado'
      case 'IN_PROGRESS': return 'Em Andamento'
      case 'COMPLETED': return 'Concluído'
      case 'OS_GERADA': return 'OS Gerada'
      case 'OVERDUE': return 'Em Atraso'
      case 'CANCELLED': return 'Cancelado'
      // Status do banco de dados
      case 'AGENDADA': return 'Agendada'
      case 'EM_ANDAMENTO': return 'Em Andamento'
      case 'CONCLUIDA': return 'Concluída'
      case 'CANCELADA': return 'Cancelada'
      case 'CONVERTIDA': return 'Convertida'
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      // Status em inglês (agendamentos)
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-amber-100 text-amber-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'OS_GERADA': return 'bg-green-100 text-green-800'
      case 'OVERDUE': return 'bg-red-100 text-red-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      // Status do banco de dados
      case 'AGENDADA': return 'bg-blue-100 text-blue-800'
      case 'EM_ANDAMENTO': return 'bg-amber-100 text-amber-800'
      case 'CONCLUIDA': return 'bg-green-100 text-green-800'
      case 'CANCELADA': return 'bg-red-100 text-red-800'
      case 'CONVERTIDA': return 'bg-green-100 text-green-800'
      // Status em português (ordens de serviço)
      case 'aberta': return 'bg-blue-100 text-blue-800'
      case 'em_andamento': return 'bg-amber-100 text-amber-800'
      case 'concluida': return 'bg-green-100 text-green-800'
      case 'cancelada': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Função para traduzir prioridade de inglês para português
  const translatePriority = (priority: string) => {
    if (!priority) return 'Não definida'
    switch (priority.toLowerCase()) {
      case 'critical': return 'Crítica'
      case 'high': return 'Alta'
      case 'medium': return 'Média'
      case 'low': return 'Baixa'
      default: return priority
    }
  }

  const getPriorityColor = (priority: string) => {
    if (!priority) return 'bg-gray-100 text-gray-800'
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return <Clock className="h-4 w-4" />
      case 'IN_PROGRESS': return <Wrench className="h-4 w-4" />
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />
      case 'OS_GERADA': return <FileText className="h-4 w-4" />
      case 'OVERDUE': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (loading && schedules.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/agendamentos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Agendamentos
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lista de Agendamentos</h1>
            <p className="text-gray-600 mt-1">
              {searchTerm ? (
                <>
                  {filteredSchedules.length} de {totalCount} agendamento{filteredSchedules.length !== 1 ? 's' : ''} encontrado{filteredSchedules.length !== 1 ? 's' : ''}
                  {filteredSchedules.length !== totalCount && (
                    <span className="text-blue-600 ml-1">(filtrado por busca)</span>
                  )}
                </>
              ) : (
                <>
                  {totalCount} agendamento{totalCount !== 1 ? 's' : ''} encontrado{totalCount !== 1 ? 's' : ''}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Link href="/agendamentos/novo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </Link>
        </div>
      </div>

      {/* Menu de Navegação */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="flex border-b overflow-x-auto">
          <Link href="/agendamentos/novo">
            <button className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap">
              <Plus className="h-4 w-4" />
              Novo Agendamento
            </button>
          </Link>
          <button className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600 bg-blue-50 whitespace-nowrap">
            <FileText className="h-4 w-4" />
            Lista de Agendamentos
          </button>
          <Link href="/agendamentos/calendario">
            <button className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap">
              <Calendar className="h-4 w-4" />
              Calendário
            </button>
          </Link>
          <Link href="/agendamentos">
            <button className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors whitespace-nowrap">
              <Wrench className="h-4 w-4" />
              Dashboard
            </button>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por equipamento, patrimônio, empresa ou data..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
              >
                ×
              </Button>
            )}
          </div>
          {searchTerm && (
            <p className="text-sm text-gray-500 mt-2">
              Buscando por: <span className="font-medium">&quot;{searchTerm}&quot;</span>
              {filteredSchedules.length === 0 && " - Nenhum resultado encontrado"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Buscar</label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Buscar por equipamento, plano..."
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select 
                  value={filters.status || ''} 
                  onValueChange={(value) => handleFilterChange('status', value === 'all-status' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-status">Todos os status</SelectItem>
                    <SelectItem value="SCHEDULED">Agendado</SelectItem>
                    <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                    <SelectItem value="COMPLETED">Concluído</SelectItem>
                    <SelectItem value="OS_GERADA">OS Gerada</SelectItem>
                    <SelectItem value="OVERDUE">Em Atraso</SelectItem>
                    <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Prioridade</label>
                <PriorityFilterSelect 
                  value={filters.priority || 'all-priorities'} 
                  onValueChange={(value) => handleFilterChange('priority', value === 'all-priorities' ? undefined : value)}
                  variant="schedule"
                  placeholder="Todas as prioridades"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Data Inicial</label>
                <DateInput
                  value={filters.date_from || ''}
                  onChange={(value) => handleFilterChange('date_from', value)}
                  placeholder="dd/mm/aaaa"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {selectedSchedules.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedSchedules.length} agendamento{selectedSchedules.length !== 1 ? 's' : ''} selecionado{selectedSchedules.length !== 1 ? 's' : ''}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBulkAction('complete')}
                >
                  Marcar como Concluído
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleBulkAction('cancel')}
                >
                  Cancelar
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                >
                  Excluir
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedules List */}
      <Card>
        <CardContent className="p-0">
          {error && (
            <div className="p-6 text-center text-red-600">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          )}

          {filteredSchedules.length === 0 && !loading ? (
            <div className="p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum agendamento encontrado'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? `Não foram encontrados agendamentos que correspondam à busca "${searchTerm}". Tente usar outros termos.`
                  : 'Tente ajustar os filtros ou criar um novo agendamento.'
                }
              </p>
              {!searchTerm && (
                <Link href="/agendamentos/novo">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Agendamento
                  </Button>
                </Link>
              )}
              {searchTerm && (
                <Button onClick={() => setSearchTerm('')} variant="outline">
                  Limpar busca
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="border-b bg-gray-50 px-6 py-3">
                <div className={`grid gap-4 items-center text-sm font-medium text-gray-700 ${hasAssignedTechnicians ? 'grid-cols-13' : 'grid-cols-12'}`}>
                  <div className="col-span-1">Nº</div>
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedSchedules.length === filteredSchedules.length && filteredSchedules.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </div>
                  <div className="col-span-4">Equipamento</div>
                  <div className="col-span-1">Plano</div>
                  <div className="col-span-1">Data Agendada</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-1">Prioridade</div>
                  {hasAssignedTechnicians && <div className="col-span-1">Técnico</div>}
                  <div className="col-span-2">Ações</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y">
                {filteredSchedules.map((schedule, index) => (
                  <div key={schedule.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className={`grid gap-4 items-center ${hasAssignedTechnicians ? 'grid-cols-13' : 'grid-cols-12'}`}>
                      <div className="col-span-1">
                        <span className="text-sm font-medium text-gray-600">
                          {(currentPage - 1) * (filters.limit || 20) + index + 1}
                        </span>
                      </div>
                      <div className="col-span-1">
                        <input
                          type="checkbox"
                          checked={selectedSchedules.includes(schedule.id)}
                          onChange={() => handleSelectSchedule(schedule.id)}
                          className="rounded border-gray-300"
                        />
                      </div>
                      
                      <div className="col-span-4">
                        <div className="flex items-start gap-2">
                          <Building className="h-4 w-4 text-gray-400 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 truncate" title={schedule.equipment_name}>
                                {schedule.equipment_name}
                              </p>
                              {/* Indicador de Recorrência */}
                              {(() => {
                                const recurrenceInfo = scheduleRecurrenceInfo[schedule.id];
                                
                                // Log específico para o agendamento 959
                                if (schedule.id === 959) {
                                  console.log(`🎯 AGENDAMENTO 959 - ANÁLISE COMPLETA:`, {
                                    scheduleId: schedule.id,
                                    recurrenceInfo: recurrenceInfo,
                                    hasRecurrence: recurrenceInfo?.hasRecurrence,
                                    recurringCount: recurrenceInfo?.recurringCount,
                                    isParent: recurrenceInfo?.isParent,
                                    shouldShowBadge: !!recurrenceInfo?.hasRecurrence
                                  });
                                }
                                
                                console.log(`🔍 Verificando badge para ID ${schedule.id}:`, recurrenceInfo);
                                
                                if (recurrenceInfo?.hasRecurrence) {
                                  console.log(`✅ Exibindo badge para ID ${schedule.id} com ${recurrenceInfo.recurringCount} filhos`);
                                  return (
                                    <div className="flex items-center gap-1">
                                      <Badge 
                                        variant="secondary" 
                                        className="bg-blue-100 text-blue-800 border-blue-200 text-xs px-2 py-0.5 flex items-center gap-1"
                                        title={`Este agendamento possui ${recurrenceInfo.recurringCount} agendamentos recorrentes`}
                                      >
                                        <Repeat className="h-3 w-3" />
                                        Recorrente ({recurrenceInfo.recurringCount})
                                      </Badge>
                                    </div>
                                  );
                                } else {
                                  console.log(`❌ Não exibindo badge para ID ${schedule.id} - hasRecurrence:`, recurrenceInfo?.hasRecurrence);
                                  return null;
                                }
                              })()}
                            </div>
                            {(schedule.equipment_patrimonio_number || schedule.equipment_code) && (
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                                  Nº {schedule.equipment_patrimonio_number || schedule.equipment_code}
                                </span>
                              </p>
                            )}
                            {schedule.sector_name && (
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <span className="inline-flex items-center">
                                  📍 {schedule.sector_name}
                                  {schedule.subsector_name && (
                                    <span className="text-gray-400 mx-1">•</span>
                                  )}
                                  {schedule.subsector_name && (
                                    <span className="font-medium">{schedule.subsector_name}</span>
                                  )}
                                </span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="col-span-1">
                        <p className="text-sm text-gray-900">{schedule.maintenance_plan_name || 'Sem plano'}</p>
                      </div>

                      <div className="col-span-1">
                        <p className="text-sm text-gray-900">
                          {schedule.scheduled_date || 'Data não informada'}
                        </p>
                        <p className="text-xs text-gray-600">
                          {schedule.scheduled_date && schedule.scheduled_date !== 'Data não informada' ? (
                            (() => {
                              try {
                                // Tentar extrair a hora se a data original estiver disponível
                                const originalDate = new Date(schedule.scheduled_date);
                                if (!isNaN(originalDate.getTime())) {
                                  return originalDate.toLocaleTimeString('pt-BR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  });
                                }
                                return '00:00';
                              } catch {
                                return '00:00';
                              }
                            })()
                          ) : '00:00'}
                        </p>
                      </div>

                      <div className="col-span-1">
                        <Badge className={getStatusColor(schedule.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(schedule.status)}
                            <span className="text-xs">{translateStatus(schedule.status)}</span>
                          </div>
                        </Badge>
                      </div>

                      <div className="col-span-1">
                        <Badge className={getPriorityColor(schedule.priority)}>
                          {translatePriority(schedule.priority)}
                        </Badge>
                      </div>

                      {hasAssignedTechnicians && (
                        <div className="col-span-1">
                          {schedule.assigned_technician_name ? (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-600">
                                {schedule.assigned_technician_name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Não atribuído</span>
                          )}
                        </div>
                      )}

                      <div className="col-span-2">
                        <div className="flex items-center gap-2 justify-start max-w-full overflow-hidden">
                          {/* Botão Aprovar - aparece para status SCHEDULED, IN_PROGRESS, agendado, em_andamento, os_gerada, AGENDADA ou EM_ANDAMENTO */}
                          {(schedule.status === 'SCHEDULED' || schedule.status === 'IN_PROGRESS' || schedule.status === 'agendado' || schedule.status === 'em_andamento' || schedule.status === 'os_gerada' || schedule.status === 'AGENDADA' || schedule.status === 'EM_ANDAMENTO') && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleApproveSchedule(schedule.id)}
                              disabled={approvingSchedules.includes(schedule.id)}
                              className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center shrink-0"
                              title="Aprovar Agendamento"
                            >
                              {approvingSchedules.includes(schedule.id) ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <ThumbsUp className="h-4 w-4" />
                              )}
                            </Button>
                          )}

                          {/* Botão Converter em OS - aparece para status COMPLETED, CONCLUIDA ou agendamentos concluídos */}
                          {(schedule.status === 'COMPLETED' || schedule.status === 'CONCLUIDA' || schedule.status === 'concluido' || schedule.status === '') && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleConvertToServiceOrder(schedule.id)}
                              disabled={convertingSchedules.includes(schedule.id)}
                              className="h-8 w-8 p-0 bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shrink-0"
                              title="Converter em Ordem de Serviço"
                            >
                              {convertingSchedules.includes(schedule.id) ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <span className="text-sm font-medium">OS</span>
                              )}
                            </Button>
                          )}

                          {schedule.status === 'SCHEDULED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCompleteSchedule(schedule.id)}
                              className="h-8 w-8 p-0 flex items-center justify-center shrink-0"
                              title="Marcar como Concluído"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </Button>
                          )}
                          
                          <Link href={`/agendamentos/${schedule.id}/editar`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 flex items-center justify-center shrink-0"
                              title="Editar Agendamento"
                            >
                              <Edit className="h-5 w-5" />
                            </Button>
                          </Link>
                          
                          {/* Botão Cancelar - aparece para agendamentos não concluídos */}
                          {(schedule.status !== 'COMPLETED' && schedule.status !== 'concluido' && schedule.status !== 'cancelado') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelSchedule(schedule.id)}
                              className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 flex items-center justify-center shrink-0"
                              title="Cancelar Agendamento"
                            >
                              <Clock className="h-5 w-5" />
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteSchedule(schedule)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 flex items-center justify-center shrink-0"
                            title="Excluir Agendamento"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando {((currentPage - 1) * (filters.limit || 20)) + 1} a {Math.min(currentPage * (filters.limit || 20), totalCount)} de {totalCount} resultados
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              )
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Próximo
            </Button>
            
            {/* Botão para ir para a página 3 onde está o agendamento 959 */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handlePageChange(3)}
              className="ml-4 bg-blue-100 text-blue-800 hover:bg-blue-200"
            >
              Ir para Página 3 (ID 959)
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {scheduleRecurrenceInfo[scheduleToDelete?.id]?.hasRecurrence ? 
                'Confirmar Exclusão de Agendamento Recorrente' : 
                'Confirmar Exclusão'
              }
            </AlertDialogTitle>
            <AlertDialogDescription>
              {scheduleRecurrenceInfo[scheduleToDelete?.id]?.hasRecurrence ? (
                <div className="space-y-2">
                  <p className="font-medium text-amber-600 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Atenção: Este é um agendamento recorrente!
                  </p>
                  <p>
                    O agendamento &quot;{scheduleToDelete?.equipment_name}&quot; possui{' '}
                    <strong>{scheduleRecurrenceInfo[scheduleToDelete?.id]?.recurringCount} agendamentos recorrentes</strong> vinculados.
                  </p>
                  <p className="text-red-600 font-medium">
                    Ao confirmar, TODOS os {scheduleRecurrenceInfo[scheduleToDelete?.id]?.recurringCount + 1} agendamentos 
                    (principal + recorrentes) serão excluídos permanentemente.
                  </p>
                  <p className="text-sm text-gray-600">
                    Esta ação não pode ser desfeita.
                  </p>
                </div>
              ) : (
                <>
                  Tem certeza que deseja excluir o agendamento &quot;{scheduleToDelete?.equipment_name}&quot;?
                  Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteSchedule} 
              disabled={isDeleting} 
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Excluindo...' : 
                scheduleRecurrenceInfo[scheduleToDelete?.id]?.hasRecurrence ? 
                  `Excluir Todos (${(scheduleRecurrenceInfo[scheduleToDelete?.id]?.recurringCount || 0) + 1})` : 
                  'Excluir'
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </MainLayout>
  )
}

export default AgendamentosListaPage;