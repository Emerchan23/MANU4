'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, Calendar, Filter, MoreVertical } from 'lucide-react'

interface TrendData {
  date: string
  value: number
  category: string
  metadata?: any
}

interface TrendChartWidgetProps {
  title: string
  category: string
  timeRange?: '7d' | '30d' | '90d' | '1y'
  height?: number
  showLegend?: boolean
  animate?: boolean
}

export default function TrendChartWidget({ 
  title, 
  category, 
  timeRange = '30d', 
  height = 300,
  showLegend = true,
  animate = true 
}: TrendChartWidgetProps) {
  const [data, setData] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRange, setSelectedRange] = useState(timeRange)

  useEffect(() => {
    fetchTrendData()
  }, [category, selectedRange])

  const fetchTrendData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboard/trends?category=${category}&range=${selectedRange}`)
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Erro ao carregar dados de tendência:', error)
    } finally {
      setLoading(false)
    }
  }

  // Formatar dados para o gráfico
  const formatChartData = () => {
    const groupedData = data.reduce((acc, item) => {
      const date = new Date(item.date).toLocaleDateString('pt-BR', { 
        month: 'short', 
        day: 'numeric' 
      })
      
      if (!acc[date]) {
        acc[date] = { date, total: 0, count: 0 }
      }
      
      acc[date].total += item.value
      acc[date].count += 1
      
      return acc
    }, {} as Record<string, any>)

    return Object.values(groupedData).map((item: any) => ({
      date: item.date,
      value: Math.round(item.total / item.count * 100) / 100
    }))
  }

  const chartData = formatChartData()

  // Calcular estatísticas
  const getStats = () => {
    if (data.length === 0) return { trend: 0, average: 0, peak: 0 }
    
    const values = data.map(d => d.value)
    const average = values.reduce((a, b) => a + b, 0) / values.length
    const peak = Math.max(...values)
    
    // Calcular tendência (comparar primeira e última semana)
    const firstWeek = values.slice(0, 7).reduce((a, b) => a + b, 0) / 7
    const lastWeek = values.slice(-7).reduce((a, b) => a + b, 0) / 7
    const trend = ((lastWeek - firstWeek) / firstWeek) * 100
    
    return { trend, average, peak }
  }

  const stats = getStats()

  // Definir cor baseada na categoria
  const getCategoryColor = () => {
    switch (category) {
      case 'maintenance':
        return '#3B82F6' // blue
      case 'equipment':
        return '#10B981' // green
      case 'alerts':
        return '#EF4444' // red
      case 'performance':
        return '#8B5CF6' // purple
      default:
        return '#6B7280' // gray
    }
  }

  // Definir cor da tendência
  const getTrendColor = () => {
    return stats.trend >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const timeRangeOptions = [
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: '90d', label: '90 dias' },
    { value: '1y', label: '1 ano' }
  ]

  const widgetContent = (
    <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="p-2 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tendência nos últimos {timeRange}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <select 
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value as any)}
              className="text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">7 dias</option>
              <option value="30d">30 dias</option>
              <option value="90d">90 dias</option>
            </select>
            
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <MoreVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      <div className="px-1 py-0 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {stats.average.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Média</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {stats.peak.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Pico</div>
          </div>
          <div className="text-center">
            <div className={`text-lg font-semibold ${getTrendColor()}`}>
              {stats.trend > 0 ? '+' : ''}{stats.trend.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Tendência</div>
          </div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="p-2">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                labelStyle={{ color: '#374151' }}
              />
              {showLegend && <Legend />}
              <Line
                type="monotone"
                dataKey="value"
                stroke={getCategoryColor()}
                strokeWidth={2}
                dot={{ fill: getCategoryColor(), strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: getCategoryColor(), strokeWidth: 2 }}
                name={title}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
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