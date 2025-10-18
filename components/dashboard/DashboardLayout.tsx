'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Grid3X3, Maximize2, Minimize2, Settings, RefreshCw, Download } from 'lucide-react'

// Importar todos os widgets
import KPICard from './widgets/KPICard'
import TrendChartWidget from './widgets/TrendChartWidget'
import StatusDonutWidget from './widgets/StatusDonutWidget'
import HeatmapWidget from './widgets/HeatmapWidget'
import AlertsTimelineWidget from './widgets/AlertsTimelineWidget'

interface WidgetConfig {
  id: string
  type: string
  title: string
  size: 'small' | 'medium' | 'large' | 'xlarge'
  position: { x: number; y: number }
  props?: any
  visible: boolean
}

interface DashboardLayoutProps {
  title?: string
  subtitle?: string
  showControls?: boolean
  refreshInterval?: number
  customWidgets?: WidgetConfig[]
}

export default function DashboardLayout({
  title = "Dashboard de Manutenção",
  subtitle = "Visão geral do sistema hospitalar",
  showControls = true,
  refreshInterval = 30000, // 30 segundos
  customWidgets
}: DashboardLayoutProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [gridMode, setGridMode] = useState<'auto' | 'custom'>('auto')

  // Configuração padrão dos widgets
  const defaultWidgets: WidgetConfig[] = [
    // KPIs principais - linha superior
    {
      id: 'kpi-equipamentos',
      type: 'kpi',
      title: 'Equipamentos Ativos',
      size: 'small',
      position: { x: 0, y: 0 },
      props: {
        category: 'equipment',
        metric: 'active_count',
        title: 'Equipamentos Ativos',
        icon: 'activity'
      },
      visible: true
    },
    {
      id: 'kpi-manutencoes',
      type: 'kpi',
      title: 'Manutenções Pendentes',
      size: 'small',
      position: { x: 1, y: 0 },
      props: {
        category: 'maintenance',
        metric: 'pending_count',
        title: 'Manutenções Pendentes',
        icon: 'wrench'
      },
      visible: true
    },
    {
      id: 'kpi-alertas',
      type: 'kpi',
      title: 'Alertas Críticos',
      size: 'small',
      position: { x: 2, y: 0 },
      props: {
        category: 'alerts',
        metric: 'critical_count',
        title: 'Alertas Críticos',
        icon: 'alert-triangle'
      },
      visible: true
    },
    {
      id: 'kpi-eficiencia',
      type: 'kpi',
      title: 'Eficiência Operacional',
      size: 'small',
      position: { x: 3, y: 0 },
      props: {
        category: 'performance',
        metric: 'efficiency_rate',
        title: 'Eficiência Operacional',
        icon: 'trending-up'
      },
      visible: true
    },

    // Gráficos principais - segunda linha
    {
      id: 'trend-chart',
      type: 'trend',
      title: 'Tendências de Manutenção',
      size: 'large',
      position: { x: 0, y: 1 },
      props: {
        title: 'Tendências de Manutenção',
        metric: 'maintenance_trends',
        timeRange: '30d'
      },
      visible: true
    },
    {
      id: 'status-donut',
      type: 'donut',
      title: 'Status dos Equipamentos',
      size: 'medium',
      position: { x: 2, y: 1 },
      props: {
        title: 'Status dos Equipamentos',
        category: 'equipment_status'
      },
      visible: true
    },

    // Terceira linha
    {
      id: 'heatmap',
      type: 'heatmap',
      title: 'Mapa de Calor - Setores',
      size: 'large',
      position: { x: 0, y: 2 },
      props: {
        title: 'Atividade por Setor',
        metric: 'sector_activity'
      },
      visible: true
    },
    {
      // Widget 'orders' removido: funcionalidade descontinuada
    },

    // Quarta linha
    {
      id: 'alerts-timeline',
      type: 'timeline',
      title: 'Timeline de Alertas',
      size: 'xlarge',
      position: { x: 0, y: 3 },
      props: {
        title: 'Timeline de Alertas',
        limit: 8,
        showFilters: true
      },
      visible: true
    }
  ]

  const [widgets, setWidgets] = useState<WidgetConfig[]>(customWidgets || defaultWidgets)

  // Auto refresh
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        handleRefresh()
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [refreshInterval])

  // Função para renderizar widget baseado no tipo
  const renderWidget = (widget: WidgetConfig) => {
    switch (widget.type) {
      case 'kpi':
        return (
          <KPICard
            category={widget.props?.category || 'general'}
            metric={widget.props?.metric || 'total'}
            title={widget.title}
            icon={widget.props?.icon}
            animate={true}
          />
        )
      case 'trend':
        return (
          <TrendChartWidget
            title={widget.title}
            metric={widget.props?.metric || 'maintenance_trends'}
            timeRange={widget.props?.timeRange || '30d'}
          />
        )
      case 'donut':
        return (
          <StatusDonutWidget
            title={widget.title}
            category={widget.props?.category || 'equipment_status'}
          />
        )
      case 'heatmap':
        return (
          <HeatmapWidget
            title={widget.title}
            metric={widget.props?.metric || 'sector_activity'}
          />
        )
      // Tipo 'orders' removido: funcionalidade descontinuada
      case 'timeline':
        return (
          <AlertsTimelineWidget
            title={widget.title}
            limit={widget.props?.limit || 8}
            showFilters={widget.props?.showFilters || true}
          />
        )
      default:
        return (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Widget não encontrado: {widget.type}</p>
          </div>
        )
    }
  }

  // Definir classes CSS baseadas no tamanho
  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'small':
        return 'col-span-1 row-span-1'
      case 'medium':
        return 'col-span-2 row-span-1'
      case 'large':
        return 'col-span-2 row-span-2'
      case 'xlarge':
        return 'col-span-4 row-span-1'
      default:
        return 'col-span-1 row-span-1'
    }
  }

  // Função de refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    
    // Simular delay de refresh
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setLastRefresh(new Date())
    setIsRefreshing(false)
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Exportar dados do dashboard
  const handleExport = () => {
    const data = {
      timestamp: new Date().toISOString(),
      widgets: widgets.filter(w => w.visible),
      lastRefresh: lastRefresh.toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:bg-black">
      {/* Header do Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-600 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-10">
            {/* Título */}
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg">
                <Grid3X3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
              </div>
            </div>

            {/* Controles */}
            {showControls && (
              <div className="flex items-center gap-3">
                {/* Última atualização */}
                <div className="text-sm text-gray-500" suppressHydrationWarning>
                  Atualizado: {lastRefresh.toLocaleTimeString('pt-BR')}
                </div>

                {/* Botões de controle */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Atualizar dados"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={handleExport}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                    title="Exportar dados"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                    title={isFullscreen ? "Sair do modo tela cheia" : "Modo tela cheia"}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Configurações do dashboard"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Grid de Widgets */}
      <div className="max-w-7xl mx-auto px-2 py-2 bg-transparent dark:bg-black">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {widgets
            .filter(widget => widget.visible)
            .sort((a, b) => {
              // Ordenar por posição Y primeiro, depois X
              if (a.position.y !== b.position.y) {
                return a.position.y - b.position.y
              }
              return a.position.x - b.position.x
            })
            .map((widget, index) => (
              <motion.div
                key={widget.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  duration: 0.3, 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                className={`${getSizeClasses(widget.size)}`}
              >
                {renderWidget(widget)}
              </motion.div>
            ))}
        </motion.div>
      </div>

      {/* Loading overlay durante refresh - removido para melhor UX */}
    </div>
  )
}