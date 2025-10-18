'use client'

import { useState, useEffect, useCallback } from 'react'

// Tipos para os dados do dashboard
export interface DashboardStats {
  totalEquipment: number
  activeEquipment: number
  pendingMaintenance: number
  criticalAlerts: number
  completedOrders: number
  efficiency: number
  changes: {
    totalEquipment: number
    activeEquipment: number
    pendingMaintenance: number
    criticalAlerts: number
    completedOrders: number
    efficiency: number
  }
}

export interface TrendData {
  date: string
  value: number
  category?: string
}

export interface StatusData {
  name: string
  value: number
  color: string
  percentage: number
}

export interface HeatmapData {
  x_axis: string
  y_axis: string
  value: number
  intensity: number
  metadata?: any
}

export interface RecentOrder {
  id: string
  order_number: string
  title: string
  description: string
  status: string
  priority: string
  sector: string
  requester: string
  created_at: string
  assigned_to?: string
  equipment_name?: string
}

export interface Alert {
  id: string
  alert_type: string
  title: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  is_read: boolean
  created_at: string
  metadata?: any
}

// Hook principal para estatísticas do dashboard
export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/dashboard/stats')
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data)
      } else {
        setError(result.error || 'Erro ao carregar estatísticas')
      }
    } catch (err) {
      setError('Erro de conexão ao carregar estatísticas')
      console.error('Erro ao carregar estatísticas:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return { stats, loading, error, refetch: fetchStats }
}

// Hook para dados de tendência
export function useTrendData(metric: string, timeRange: string = '30d') {
  const [data, setData] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTrendData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        metric,
        timeRange
      })
      
      const response = await fetch(`/api/dashboard/trends?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Erro ao carregar dados de tendência')
      }
    } catch (err) {
      setError('Erro de conexão ao carregar tendências')
      console.error('Erro ao carregar tendências:', err)
    } finally {
      setLoading(false)
    }
  }, [metric, timeRange])

  useEffect(() => {
    fetchTrendData()
  }, [fetchTrendData])

  return { data, loading, error, refetch: fetchTrendData }
}

// Hook para dados de status (donut chart)
export function useStatusData(category: string) {
  const [data, setData] = useState<StatusData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatusData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({ category })
      
      const response = await fetch(`/api/dashboard/status?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Erro ao carregar dados de status')
      }
    } catch (err) {
      setError('Erro de conexão ao carregar status')
      console.error('Erro ao carregar status:', err)
    } finally {
      setLoading(false)
    }
  }, [category])

  useEffect(() => {
    fetchStatusData()
  }, [fetchStatusData])

  return { data, loading, error, refetch: fetchStatusData }
}

// Hook para dados do heatmap
export function useHeatmapData(metric: string) {
  const [data, setData] = useState<HeatmapData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHeatmapData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({ metric })
      
      const response = await fetch(`/api/dashboard/heatmap?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Erro ao carregar dados do heatmap')
      }
    } catch (err) {
      setError('Erro de conexão ao carregar heatmap')
      console.error('Erro ao carregar heatmap:', err)
    } finally {
      setLoading(false)
    }
  }, [metric])

  useEffect(() => {
    fetchHeatmapData()
  }, [fetchHeatmapData])

  return { data, loading, error, refetch: fetchHeatmapData }
}

// Hook para ordens recentes
export function useRecentOrders(limit: number = 10, status?: string) {
  const [orders, setOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    // Funcionalidade descontinuada: service_orders removido
    setOrders([])
    setLoading(false)
    setError(null)
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { orders, loading, error, refetch }
}

// Hook para alertas
export function useAlerts(limit: number = 10, filter?: 'all' | 'unread' | 'critical') {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(filter === 'unread' && { unread: 'true' }),
        ...(filter === 'critical' && { severity: 'critical' })
      })
      
      const response = await fetch(`/api/dashboard/alerts?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setAlerts(result.data)
      } else {
        setError(result.error || 'Erro ao carregar alertas')
      }
    } catch (err) {
      setError('Erro de conexão ao carregar alertas')
      console.error('Erro ao carregar alertas:', err)
    } finally {
      setLoading(false)
    }
  }, [limit, filter])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  // Função para marcar alerta como lido
  const markAsRead = useCallback(async (alertId: string) => {
    try {
      const response = await fetch(`/api/dashboard/alerts/${alertId}/read`, {
        method: 'PATCH'
      })
      
      if (response.ok) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, is_read: true } : alert
        ))
      }
    } catch (err) {
      console.error('Erro ao marcar alerta como lido:', err)
    }
  }, [])

  return { alerts, loading, error, refetch: fetchAlerts, markAsRead }
}

// Hook para KPI específico
export function useKPIData(category: string, metric: string) {
  const [data, setData] = useState<{
    value: number
    change: number
    trend: 'up' | 'down' | 'stable'
    formatted: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchKPIData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({ category, metric })
      
      const response = await fetch(`/api/dashboard/kpi?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Erro ao carregar KPI')
      }
    } catch (err) {
      setError('Erro de conexão ao carregar KPI')
      console.error('Erro ao carregar KPI:', err)
    } finally {
      setLoading(false)
    }
  }, [category, metric])

  useEffect(() => {
    fetchKPIData()
  }, [fetchKPIData])

  return { data, loading, error, refetch: fetchKPIData }
}

// Hook para refresh automático
export function useAutoRefresh(callback: () => void, interval: number = 30000) {
  useEffect(() => {
    if (interval > 0) {
      const intervalId = setInterval(callback, interval)
      return () => clearInterval(intervalId)
    }
  }, [callback, interval])
}

// Hook combinado para todos os dados do dashboard
export function useDashboard(refreshInterval: number = 30000) {
  const stats = useDashboardStats()
  const trends = useTrendData('maintenance_trends')
  const equipmentStatus = useStatusData('equipment_status')
  const heatmap = useHeatmapData('sector_activity')
  const recentOrders = useRecentOrders(6)
  const alerts = useAlerts(8)

  // Auto refresh
  const refreshAll = useCallback(() => {
    stats.refetch()
    trends.refetch()
    equipmentStatus.refetch()
    heatmap.refetch()
    recentOrders.refetch()
    alerts.refetch()
  }, [stats, trends, equipmentStatus, heatmap, recentOrders, alerts])

  useAutoRefresh(refreshAll, refreshInterval)

  const loading = stats.loading || trends.loading || equipmentStatus.loading || 
                  heatmap.loading || recentOrders.loading || alerts.loading

  const error = stats.error || trends.error || equipmentStatus.error || 
                heatmap.error || recentOrders.error || alerts.error

  return {
    stats: stats.stats,
    trends: trends.data,
    equipmentStatus: equipmentStatus.data,
    heatmap: heatmap.data,
    recentOrders: recentOrders.orders,
    alerts: alerts.alerts,
    loading,
    error,
    refreshAll,
    markAlertAsRead: alerts.markAsRead
  }
}