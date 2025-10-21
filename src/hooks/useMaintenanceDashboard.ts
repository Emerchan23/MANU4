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

  console.log('🎯 [useMaintenanceDashboard] Hook inicializado com company_id:', company_id)
  console.log('🎯 [useMaintenanceDashboard] Estado inicial - dashboard:', dashboard, 'loading:', loading, 'error:', error)

  const fetchDashboard = useCallback(async () => {
    console.log('🔄 [useMaintenanceDashboard] Iniciando fetchDashboard...')
    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      if (company_id) {
        queryParams.append('company_id', company_id)
        console.log('🏢 [useMaintenanceDashboard] Company ID:', company_id)
      }

      const url = `/api/maintenance-dashboard?${queryParams.toString()}`
      console.log('🌐 [useMaintenanceDashboard] Fazendo requisição para:', url)

      const response = await fetch(url)
      console.log('📡 [useMaintenanceDashboard] Resposta recebida:', response.status, response.statusText)
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados do dashboard: ${response.status}`)
      }

      const data = await response.json()
      console.log('📊 [useMaintenanceDashboard] Dados recebidos da API:', JSON.stringify(data, null, 2))
      
      if (data.success) {
        console.log('✅ [useMaintenanceDashboard] Dados processados com sucesso:', data.data)
        console.log('📈 [useMaintenanceDashboard] Métricas:', data.data.metrics)
        
        // Mapear os dados da API para o formato esperado pelo componente
        const mappedData = {
          pending_count: data.data.metrics?.pending || 0,
          overdue_count: data.data.metrics?.overdue || 0,
          completed_this_month: data.data.metrics?.completedThisMonth || 0,
          completion_rate: data.data.metrics?.completionRate || 0,
          upcoming_7_days: data.data.upcomingSchedules || [],
          overdue_schedules: data.data.overdueSchedules || [],
          monthly_stats: data.data.monthlyStats || [],
          cost_analysis: {
            estimated_total: 0,
            actual_total: 0,
            variance: 0
          }
        }
        
        console.log('🔄 [useMaintenanceDashboard] Dados mapeados:', mappedData)
        setDashboard(mappedData)
      } else {
        console.error('❌ [useMaintenanceDashboard] API retornou erro:', data.error)
        throw new Error(data.error || 'Erro desconhecido')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar dashboard de manutenção'
      console.error('💥 [useMaintenanceDashboard] Erro capturado:', err)
      setError(errorMessage)
    } finally {
      console.log('🏁 [useMaintenanceDashboard] fetchDashboard finalizado')
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