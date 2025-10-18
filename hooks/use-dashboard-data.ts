import { useState, useEffect } from 'react'
import { apiCall } from '@/lib/api'

export interface DashboardStats {
  totalEquipment: {
    value: number
    change: string
    changeType: 'positive' | 'negative' | 'neutral'
  }
  openOrders: {
    value: number
    change: string
    changeType: 'positive' | 'negative' | 'neutral'
  }
  activeAlerts: {
    value: number
    change: string
    changeType: 'positive' | 'negative' | 'neutral'
  }
  completedToday: {
    value: number
    change: string
    changeType: 'positive' | 'negative' | 'neutral'
  }
  notifications: {
    value: number
    change: string
    changeType: 'positive' | 'negative' | 'neutral'
  }
}

export interface RecentOrder {
  id: number
  number: string
  title: string
  equipment: string
  sector: string
  priority: string
  status: string
  timeAgo: string
  requester: string
}

export interface PriorityAlert {
  id: number
  equipment: string
  sector: string
  priority: 'Alta' | 'Média' | 'Baixa'
  daysUntil: number
  maintenanceDate: string
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiCall('/api/dashboard/stats')
        setStats(data)
      } catch (err) {
        console.error('Erro ao buscar estatísticas:', err)
        setError('Erro ao carregar estatísticas do dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading, error, refetch: () => setLoading(true) }
}

export function useRecentOrders() {
  const [orders, setOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Funcionalidade descontinuada: service_orders removido
    setOrders([])
    setLoading(false)
    setError(null)
  }, [])

  return { orders, loading, error }
}

export function usePriorityAlerts() {
  const [alerts, setAlerts] = useState<PriorityAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiCall('/api/dashboard/priority-alerts')
        setAlerts(data)
      } catch (err) {
        console.error('Erro ao buscar alertas:', err)
        setError('Erro ao carregar alertas prioritários')
      } finally {
        setLoading(false)
      }
    }

    fetchAlerts()
  }, [])

  return { alerts, loading, error }
}