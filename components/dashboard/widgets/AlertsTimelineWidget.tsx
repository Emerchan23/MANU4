'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, AlertTriangle, Info, CheckCircle, Clock, MoreVertical, Filter } from 'lucide-react'

interface Alert {
  id: string
  alert_type: string
  title: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  is_read: boolean
  created_at: string
  metadata?: any
}

interface AlertsTimelineWidgetProps {
  title?: string
  limit?: number
  showFilters?: boolean
  animate?: boolean
}

export default function AlertsTimelineWidget({ 
  title = "Timeline de Alertas", 
  limit = 8,
  showFilters = true,
  animate = true 
}: AlertsTimelineWidgetProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all')

  useEffect(() => {
    fetchAlerts()
  }, [limit, filter])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(filter === 'unread' && { unread: 'true' }),
        ...(filter === 'critical' && { severity: 'critical' })
      })
      
      const response = await fetch(`/api/dashboard/alerts?${params}`)
      const result = await response.json()
      
      if (result?.success) {
        // O endpoint pode retornar { data: { alerts: [] } } ou { data: [] }
        const data = result.data
        const alertsArray = Array.isArray(data)
          ? data
          : Array.isArray(data?.alerts)
            ? data.alerts
            : []
        setAlerts(alertsArray)
      }
    } catch (error) {
      console.error('Erro ao carregar alertas:', error)
    } finally {
      setLoading(false)
    }
  }

  // Definir ícone baseado no tipo de alerta
  const getAlertIcon = (alertType: string, severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />
      case 'medium':
        return <Info className="w-4 h-4 text-yellow-500" />
      case 'low':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  // Definir cores baseadas na severidade
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-200 bg-red-50'
      case 'high':
        return 'border-orange-200 bg-orange-50'
      case 'medium':
        return 'border-yellow-200 bg-yellow-50'
      case 'low':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  // Definir cor do ponto na timeline
  const getTimelineColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500'
      case 'high':
        return 'bg-orange-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'low':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Formatar tempo relativo
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Agora'
    if (diffInMinutes < 60) return `${diffInMinutes}min`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d`
    
    return date.toLocaleDateString('pt-BR')
  }

  // Marcar alerta como lido
  const markAsRead = async (alertId: string) => {
    try {
      await fetch(`/api/dashboard/alerts/${alertId}/read`, {
        method: 'PATCH'
      })
      
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ))
    } catch (error) {
      console.error('Erro ao marcar alerta como lido:', error)
    }
  }

  const filterOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'unread', label: 'Não lidos' },
    { value: 'critical', label: 'Críticos' }
  ]

  // Estatísticas dos alertas
  const getStats = () => {
    const unreadCount = alerts.filter(a => !a.is_read).length
    const criticalCount = alerts.filter(a => a.severity === 'critical').length
    return { unreadCount, criticalCount }
  }

  const stats = getStats()

  const widgetContent = (
    <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <Bell className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {stats.unreadCount} não lidos • {stats.criticalCount} críticos
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {showFilters && (
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {filterOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <MoreVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline de alertas */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 dark:border-red-400"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Nenhum alerta encontrado</p>
          </div>
        ) : (
          <div className="relative">
            {/* Linha da timeline */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-600"></div>
            
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={animate ? { opacity: 0, x: -20 } : {}}
                  animate={animate ? { opacity: 1, x: 0 } : {}}
                  transition={animate ? { duration: 0.3, delay: index * 0.1 } : {}}
                  className="relative flex items-start gap-4"
                >
                  {/* Ponto na timeline */}
                  <div className={`relative z-10 w-3 h-3 rounded-full ${getTimelineColor(alert.severity)} flex-shrink-0 mt-2`}>
                    {!alert.is_read && (
                      <div className="absolute -inset-1 rounded-full bg-current opacity-30 animate-pulse"></div>
                    )}
                  </div>
                  
                  {/* Conteúdo do alerta */}
                  <div 
                    className={`flex-1 p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-sm ${getSeverityColor(alert.severity)} ${!alert.is_read ? 'border-l-4' : ''}`}
                    onClick={() => !alert.is_read && markAsRead(alert.id)}
                  >
                    {/* Header do alerta */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getAlertIcon(alert.alert_type, alert.severity)}
                        <h4 className={`text-sm font-medium ${!alert.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                          {alert.title}
                        </h4>
                        {!alert.is_read && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            NOVO
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{getTimeAgo(alert.created_at)}</span>
                      </div>
                    </div>
                    
                    {/* Mensagem do alerta */}
                    <p className={`text-sm ${!alert.is_read ? 'text-gray-700' : 'text-gray-500'} mb-2`}>
                      {alert.message}
                    </p>
                    
                    {/* Tipo e severidade */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                          {alert.alert_type.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                          alert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                          alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      
                      {!alert.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(alert.id)
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Marcar como lido
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {alerts.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <button className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors">
              Ver todos os alertas
            </button>
            
            {stats.unreadCount > 0 && (
              <button
                onClick={() => {
                  // Marcar todos como lidos
                  alerts.forEach(alert => {
                    if (!alert.is_read) markAsRead(alert.id)
                  })
                }}
                className="text-sm text-gray-600 hover:text-gray-700 font-medium transition-colors"
              >
                Marcar todos como lidos
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="h-full"
      >
        {widgetContent}
      </motion.div>
    )
  }

  return widgetContent
}