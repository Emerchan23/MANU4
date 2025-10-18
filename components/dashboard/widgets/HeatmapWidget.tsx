'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Map, MoreVertical, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface HeatmapData {
  sector: string
  subsector?: string
  value: number
  intensity: number
  trend: 'up' | 'down' | 'stable'
  metadata?: any
}

interface HeatmapWidgetProps {
  title: string
  metric: 'maintenance' | 'alerts' | 'performance' | 'utilization'
  gridSize?: 'small' | 'medium' | 'large'
  showLabels?: boolean
  animate?: boolean
}

export default function HeatmapWidget({ 
  title, 
  metric, 
  gridSize = 'medium',
  showLabels = true,
  animate = true 
}: HeatmapWidgetProps) {
  const [data, setData] = useState<HeatmapData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCell, setSelectedCell] = useState<HeatmapData | null>(null)

  useEffect(() => {
    fetchHeatmapData()
  }, [metric])

  const fetchHeatmapData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboard/heatmap?metric=${metric}`)
      const result = await response.json()
      
      if (result.success) {
        // Normalizar intensidade (0-1)
        const maxValue = Math.max(...result.data.map((item: any) => item.value))
        const normalizedData = result.data.map((item: any) => ({
          ...item,
          intensity: maxValue > 0 ? item.value / maxValue : 0
        }))
        
        setData(normalizedData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do heatmap:', error)
    } finally {
      setLoading(false)
    }
  }

  // Definir cores baseadas na intensidade e métrica
  const getIntensityColor = (intensity: number) => {
    const colors = {
      maintenance: {
        low: 'rgba(59, 130, 246, 0.2)',
        medium: 'rgba(59, 130, 246, 0.6)',
        high: 'rgba(59, 130, 246, 0.8)'
      },
      alerts: {
        low: 'rgba(34, 197, 94, 0.2)',
        medium: 'rgba(251, 191, 36, 0.6)',
        high: 'rgba(239, 68, 68, 0.8)'
      },
      performance: {
        low: 'rgba(239, 68, 68, 0.2)',     // red for low performance
        medium: 'rgba(251, 191, 36, 0.6)',
        high: 'rgba(34, 197, 94, 0.8)'     // green for high performance
      },
      utilization: {
        low: 'rgba(156, 163, 175, 0.2)',   // gray for low utilization
        medium: 'rgba(59, 130, 246, 0.6)', // blue for medium
        high: 'rgba(34, 197, 94, 0.8)'     // green for high utilization
      }
    }

    const colorSet = colors[metric] || colors.maintenance // Fallback para maintenance se metric não existir
    
    // Verificar se colorSet existe e tem as propriedades necessárias
    if (!colorSet || !colorSet.low || !colorSet.medium || !colorSet.high) {
      return 'rgba(156, 163, 175, 0.2)' // Cor padrão cinza
    }
    
    if (intensity <= 0.33) return colorSet.low
    if (intensity <= 0.66) return colorSet.medium
    return colorSet.high
  }

  // Definir tamanho das células
  const getCellSize = () => {
    switch (gridSize) {
      case 'small':
        return 'w-8 h-8'
      case 'large':
        return 'w-16 h-16'
      default:
        return 'w-12 h-12'
    }
  }

  // Organizar dados em grid
  const organizeDataInGrid = () => {
    const sectors = [...new Set(data.map(item => item.sector))]
    const maxItemsPerRow = Math.ceil(Math.sqrt(data.length))
    
    const grid = []
    for (let i = 0; i < data.length; i += maxItemsPerRow) {
      grid.push(data.slice(i, i + maxItemsPerRow))
    }
    
    return grid
  }

  const gridData = organizeDataInGrid()

  // Ícone de tendência
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-500" />
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-500" />
      default:
        return <Minus className="w-3 h-3 text-gray-400" />
    }
  }

  // Estatísticas do heatmap
  const getStats = () => {
    if (data.length === 0) return { average: 0, max: 0, min: 0, hotspots: 0 }
    
    const values = data.map(d => d.value)
    const average = values.reduce((a, b) => a + b, 0) / values.length
    const max = Math.max(...values)
    const min = Math.min(...values)
    const hotspots = data.filter(d => d.intensity > 0.7).length
    
    return { average, max, min, hotspots }
  }

  const stats = getStats()

  const widgetContent = (
    <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="p-2 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Map className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Mapa de calor por setor</p>
            </div>
          </div>
          
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <MoreVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </button>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      <div className="px-2 py-1 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {stats.average.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Média</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600 dark:text-red-400">
              {stats.max.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Máximo</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {stats.min.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Mínimo</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
              {stats.hotspots}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Hotspots</div>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="p-2">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Grid do heatmap */}
            <div className="flex flex-col gap-1">
              {gridData.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1 justify-center">
                  {row.map((cell, cellIndex) => (
                    <motion.div
                      key={`${rowIndex}-${cellIndex}`}
                      className={`${getCellSize()} rounded cursor-pointer border border-gray-200 hover:border-gray-400 transition-all duration-200 flex items-center justify-center relative group`}
                      style={{ backgroundColor: getIntensityColor(cell.intensity) }}
                      onClick={() => setSelectedCell(cell)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        <div className="font-medium">{cell.sector}</div>
                        {cell.subsector && (
                          <div className="text-gray-300">{cell.subsector}</div>
                        )}
                        <div>Valor: {cell.value.toFixed(1)}</div>
                        <div className="flex items-center gap-1">
                          Tendência: {getTrendIcon(cell.trend)}
                        </div>
                      </div>
                      
                      {/* Label da célula */}
                      {showLabels && (
                        <span className="text-xs font-medium text-gray-700 truncate">
                          {cell.sector.substring(0, 3)}
                        </span>
                      )}
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>

            {/* Legenda de cores */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: getIntensityColor(0.2) }}></div>
                <span className="text-xs text-gray-600">Baixo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: getIntensityColor(0.5) }}></div>
                <span className="text-xs text-gray-600">Médio</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: getIntensityColor(0.8) }}></div>
                <span className="text-xs text-gray-600">Alto</span>
              </div>
            </div>

            {/* Detalhes da célula selecionada */}
            {selectedCell && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-gray-50 rounded-lg border"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{selectedCell.sector}</h4>
                  <button
                    onClick={() => setSelectedCell(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                {selectedCell.subsector && (
                  <p className="text-sm text-gray-600 mb-2">{selectedCell.subsector}</p>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Valor:</span>
                    <span className="ml-2 font-medium">{selectedCell.value.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-500">Tendência:</span>
                    <span className="ml-2">{getTrendIcon(selectedCell.trend)}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="h-full"
      >
        {widgetContent}
      </motion.div>
    )
  }

  return widgetContent
}