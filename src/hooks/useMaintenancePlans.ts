import { useState, useEffect, useCallback } from 'react'
import { 
  MaintenancePlan, 
  MaintenancePlanFilters, 
  CreateMaintenancePlanRequest,
  UpdateMaintenancePlanRequest,
  MaintenancePlanResponse 
} from '@/types/maintenance-scheduling'

interface UseMaintenancePlansReturn {
  plans: MaintenancePlan[]
  loading: boolean
  error: string | null
  totalCount: number
  currentPage: number
  totalPages: number
  fetchPlans: (filters?: MaintenancePlanFilters) => Promise<void>
  createPlan: (plan: CreateMaintenancePlanRequest) => Promise<MaintenancePlan | null>
  updatePlan: (id: string, plan: UpdateMaintenancePlanRequest) => Promise<MaintenancePlan | null>
  deletePlan: (id: string) => Promise<boolean>
  getPlanById: (id: string) => Promise<MaintenancePlan | null>
  refreshPlans: () => Promise<void>
}

export function useMaintenancePlans(initialFilters?: MaintenancePlanFilters): UseMaintenancePlansReturn {
  const [plans, setPlans] = useState<MaintenancePlan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [filters, setFilters] = useState<MaintenancePlanFilters>(initialFilters || {})

  const fetchPlans = useCallback(async (newFilters?: MaintenancePlanFilters) => {
    setLoading(true)
    setError(null)

    try {
      const activeFilters = newFilters || filters
      setFilters(activeFilters)

      const queryParams = new URLSearchParams()
      
      if (activeFilters.company_id) queryParams.append('company_id', activeFilters.company_id)
      if (activeFilters.type) queryParams.append('type', activeFilters.type)
      if (activeFilters.frequency) queryParams.append('frequency', activeFilters.frequency)
      if (activeFilters.is_active !== undefined) queryParams.append('is_active', activeFilters.is_active.toString())
      if (activeFilters.search) queryParams.append('search', activeFilters.search)
      if (activeFilters.page) queryParams.append('page', activeFilters.page.toString())
      if (activeFilters.limit) queryParams.append('limit', activeFilters.limit.toString())

      const response = await fetch(`/api/maintenance-plans?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar planos: ${response.status}`)
      }

      const data: MaintenancePlanResponse = await response.json()
      
      if (data.success) {
        setPlans(data.data)
        setTotalCount(data.pagination?.total || 0)
        setCurrentPage(data.pagination?.page || 1)
        setTotalPages(data.pagination?.totalPages || 0)
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar planos de manutenção'
      setError(errorMessage)
      console.error('Erro ao buscar planos:', err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const createPlan = useCallback(async (planData: CreateMaintenancePlanRequest): Promise<MaintenancePlan | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/maintenance-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erro ao criar plano: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Refresh the plans list
        await fetchPlans()
        return data.data
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar plano de manutenção'
      setError(errorMessage)
      console.error('Erro ao criar plano:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [fetchPlans])

  const updatePlan = useCallback(async (id: string, planData: UpdateMaintenancePlanRequest): Promise<MaintenancePlan | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/maintenance-plans', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...planData }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erro ao atualizar plano: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Update the plan in the local state
        setPlans(prevPlans => 
          prevPlans.map(plan => 
            plan.id === id ? data.data : plan
          )
        )
        return data.data
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar plano de manutenção'
      setError(errorMessage)
      console.error('Erro ao atualizar plano:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deletePlan = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/maintenance-plans/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erro ao excluir plano: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        // Remove the plan from local state
        setPlans(prevPlans => prevPlans.filter(plan => plan.id !== id))
        setTotalCount(prev => prev - 1)
        return true
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir plano de manutenção'
      setError(errorMessage)
      console.error('Erro ao excluir plano:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const getPlanById = useCallback(async (id: string): Promise<MaintenancePlan | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/maintenance-plans/${id}`)
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar plano: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        return data.data
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar plano de manutenção'
      setError(errorMessage)
      console.error('Erro ao buscar plano por ID:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshPlans = useCallback(async () => {
    await fetchPlans()
  }, [fetchPlans])

  // Load initial data
  useEffect(() => {
    fetchPlans()
  }, [fetchPlans])

  return {
    plans,
    loading,
    error,
    totalCount,
    currentPage,
    totalPages,
    fetchPlans,
    createPlan,
    updatePlan,
    deletePlan,
    getPlanById,
    refreshPlans,
  }
}