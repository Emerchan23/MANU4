import { useState, useEffect, useCallback } from 'react'
import { MaintenanceDashboard } from '@/types/maintenance-scheduling'

interface UseMaintenanceDashboardReturn {
  dashboard: MaintenanceDashboard | null
  loading: boolean
  error: string | null
  refreshDashboard: () => Promise<void>
}

export function useMaintenanceDashboard(company_id?: string): UseMaintenanceDashboardReturn {
  const [dashboard, setDashboard] = useState<MaintenanceDashboard | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      if (company_id) {
        queryParams.append('company_id', company_id)
      }

      const response = await fetch(`/api/maintenance-dashboard?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados do dashboard: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setDashboard(data.data)
      } else {
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dashboard de manutenção'
      setError(errorMessage)
      console.error('Erro ao buscar dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [company_id])

  const refreshDashboard = useCallback(async () => {
    await fetchDashboard()
  }, [fetchDashboard])

  // Load initial data
  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboard()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [fetchDashboard])

  return {
    dashboard,
    loading,
    error,
    refreshDashboard,
  }
}