import { useState, useEffect, useCallback } from 'react'
import { 
  MaintenanceSchedule, 
  MaintenanceScheduleFilters, 
  CreateMaintenanceScheduleRequest,
  UpdateMaintenanceScheduleRequest,
  MaintenanceScheduleResponse,
  CompleteMaintenanceScheduleRequest 
} from '@/types/maintenance-scheduling'

interface UseMaintenanceSchedulesReturn {
  schedules: MaintenanceSchedule[]
  loading: boolean
  error: string | null
  totalCount: number
  currentPage: number
  totalPages: number
  fetchSchedules: (filters?: MaintenanceScheduleFilters) => Promise<void>
  createSchedule: (schedule: CreateMaintenanceScheduleRequest) => Promise<MaintenanceSchedule | null>
  updateSchedule: (id: string, schedule: UpdateMaintenanceScheduleRequest) => Promise<MaintenanceSchedule | null>
  deleteSchedule: (id: string) => Promise<boolean>
  getScheduleById: (id: string) => Promise<MaintenanceSchedule | null>
  completeSchedule: (id: string, completion: CompleteMaintenanceScheduleRequest) => Promise<MaintenanceSchedule | null>
  refreshSchedules: () => Promise<void>
}

export function useMaintenanceSchedules(initialFilters?: MaintenanceScheduleFilters): UseMaintenanceSchedulesReturn {
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [filters, setFilters] = useState<MaintenanceScheduleFilters>(initialFilters || {})

  const fetchSchedules = useCallback(async (newFilters?: MaintenanceScheduleFilters) => {
    setLoading(true)
    setError(null)

    try {
      const activeFilters = newFilters || filters
      setFilters(activeFilters)

      const queryParams = new URLSearchParams()
      
      if (activeFilters.company_id) queryParams.append('company_id', activeFilters.company_id)
      if (activeFilters.status) queryParams.append('status', activeFilters.status)
      if (activeFilters.priority) queryParams.append('priority', activeFilters.priority)
      if (activeFilters.equipment_id) queryParams.append('equipment_id', activeFilters.equipment_id)
      if (activeFilters.plan_id) queryParams.append('plan_id', activeFilters.plan_id)
      if (activeFilters.assigned_to) queryParams.append('assigned_to', activeFilters.assigned_to)
      if (activeFilters.date_from) queryParams.append('date_from', activeFilters.date_from)
      if (activeFilters.date_to) queryParams.append('date_to', activeFilters.date_to)
      if (activeFilters.search) queryParams.append('search', activeFilters.search)
      if (activeFilters.page) queryParams.append('page', activeFilters.page.toString())
      if (activeFilters.limit) queryParams.append('limit', activeFilters.limit.toString())

      const response = await fetch(`/api/agendamentos?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar agendamentos: ${response.status}`)
      }

      const data: MaintenanceScheduleResponse = await response.json()
      
      if (data.success) {
        setSchedules(data.data)
        setTotalCount(data.pagination?.total || 0)
        setCurrentPage(data.pagination?.page || 1)
        setTotalPages(data.pagination?.totalPages || 0)
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar agendamentos de manutenção'
      setError(errorMessage)
      console.error('Erro ao buscar agendamentos:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const createSchedule = useCallback(async (scheduleData: CreateMaintenanceScheduleRequest): Promise<MaintenanceSchedule | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/agendamentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erro ao criar agendamento: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Refresh the schedules list
        await fetchSchedules()
        return data.data
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar agendamento de manutenção'
      setError(errorMessage)
      console.error('Erro ao criar agendamento:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [fetchSchedules])

  const updateSchedule = useCallback(async (id: string, scheduleData: UpdateMaintenanceScheduleRequest): Promise<MaintenanceSchedule | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/agendamentos', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...scheduleData }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erro ao atualizar agendamento: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Update the schedule in the local state
        setSchedules(prevSchedules => 
          prevSchedules.map(schedule => 
            schedule.id === id ? data.data : schedule
          )
        )
        return data.data
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar agendamento de manutenção'
      setError(errorMessage)
      console.error('Erro ao atualizar agendamento:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteSchedule = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/agendamentos/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erro ao excluir agendamento: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Remove the schedule from local state
        setSchedules(prevSchedules => prevSchedules.filter(schedule => schedule.id !== id))
        setTotalCount(prev => prev - 1)
        return true
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir agendamento de manutenção'
      setError(errorMessage)
      console.error('Erro ao excluir agendamento:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const getScheduleById = useCallback(async (id: string): Promise<MaintenanceSchedule | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/agendamentos/${id}`)
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar agendamento: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        return data.data
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar agendamento de manutenção'
      setError(errorMessage)
      console.error('Erro ao buscar agendamento por ID:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const completeSchedule = useCallback(async (id: string, completionData: CompleteMaintenanceScheduleRequest): Promise<MaintenanceSchedule | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/agendamentos/${id}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erro ao completar agendamento: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Update the schedule in the local state
        setSchedules(prevSchedules => 
          prevSchedules.map(schedule => 
            schedule.id === id ? data.data : schedule
          )
        )
        return data.data
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao completar agendamento de manutenção'
      setError(errorMessage)
      console.error('Erro ao completar agendamento:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshSchedules = useCallback(async () => {
    await fetchSchedules()
  }, [fetchSchedules])

  // Load initial data
  useEffect(() => {
    fetchSchedules()
  }, [])

  return {
    schedules,
    loading,
    error,
    totalCount,
    currentPage,
    totalPages,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getScheduleById,
    completeSchedule,
    refreshSchedules,
  }
}