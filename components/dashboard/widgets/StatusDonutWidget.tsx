'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Activity, AlertCircle, CheckCircle, Clock, Wrench, MoreVertical } from 'lucide-react'

interface StatusData {
  status: string
  count: number
  percentage: number
  color: string
}

interface StatusDonutWidgetProps {
  title: string
  category: 'equipment' | 'maintenance' | 'orders'
  size?: 'small' | 'medium' | 'large'
  showLegend?: boolean
  animate?: boolean
}

export default function StatusDonutWidget({ 
  title, 
  category, 
  size = 'medium',
  showLegend = true,
  animate = true 
}: StatusDonutWidgetProps) {
  const [data, setData] = useState<StatusData[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchStatusData()
  }, [category])

  const fetchStatusData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboard/status?category=${category}`)
      const result = await response.json()
      
      if (result.success) {
        const statusData = result.data
        const totalCount = statusData.reduce((sum: number, item: any) => sum + item.count, 0)
        
        const formattedData = statusData.map((item: any) => ({
          status: item.status,
          count: item.count,
          percentage: Math.round((item.count / totalCount) * 100),
          color: getStatusColor(item.status, category)
        }))
        
        setData(formattedData)
        setTotal(totalCount)
      }
    } catch (error) {
      console.error('Erro ao carregar dados de status:', error)
    } finally {
      setLoading(false)
    }
  }

  // Definir cores baseadas no status e categoria
  const getStatusColor = (status: string, category: string) => {
    const colorMap: Record<string, Record<string, string>> = {
      equipment: {
        'ativo': '#10B981',      // green
        'inativo': '#EF4444',    // red
        'manutencao': '#F59E0B', // amber
        'reserva': '#6B7280'     // gray
      },
      maintenance: {
        'concluida': '#10B981',   // green
        'pendente': '#F59E0B',    // amber
        'em_andamento': '#3B82F6', // blue
        'atrasada': '#EF4444'     // red
      },
      orders: {
        'aberta': '#3B82F6',      // blue - indica início/pendência
        'em_andamento': '#F59E0B', // amber - indica atenção/prioridade
        'concluida': '#10B981',   // green - indica sucesso
        'cancelada': '#EF4444'    // red - indica problema/parado
      }
    }
    
    return colorMap[category]?.[status] || '#6B7280'
  }

  // Definir ícone baseado no status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativo':
      case 'concluida':
        return <CheckCircle className="w-4 h-4" />
      case 'inativo':
      case 'atrasada':
      case 'cancelada':
        return <AlertCircle className="w-4 h-4" />
      case 'manutencao':
      case 'em_andamento':
        return <Wrench className="w-4 h-4" />
      case 'pendente':
      case 'aberta':
        return <Clock className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  // Definir tamanhos
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { 
          containerHeight: 200, 
          chartSize: 120, 
          innerRadius: 40, 
          outerRadius: 60,
          padding: 'p-2'
        }
      case 'large':
        return { 
          containerHeight: 400, 
          chartSize: 200, 
          innerRadius: 80, 
          outerRadius: 100,
          padding: 'p-4'
        }
      default:
        return { 
          containerHeight: 300, 
          chartSize: 160, 
          innerRadius: 60, 
          outerRadius: 80,
          padding: 'p-3'
        }
    }
  }

  const sizeConfig = getSizeConfig()

  // Componente customizado para tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.status.replace(/_/g, ' ').toUpperCase()}</p>
          <p className="text-sm text-gray-600">
            {data.count} itens ({data.percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  // Componente customizado para label central
  const CenterLabel = () => (
    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
      <tspan x="50%" dy="-0.5em" className="text-2xl font-bold fill-gray-900">
        {total}
      </tspan>
      <tspan x="50%" dy="1.2em" className="text-sm fill-gray-500">
        Total
      </tspan>
    </text>
  )

  const widgetContent = (
    <div className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className={`border-b border-gray-100 dark:border-gray-700 ${sizeConfig.padding}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Distribuição por status</p>
            </div>
          </div>
          
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <MoreVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className={sizeConfig.padding}>
        {loading ? (
          <div className="flex items-center justify-center" style={{ height: sizeConfig.containerHeight }}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* Gráfico */}
            <div className="flex-shrink-0">
              <ResponsiveContainer width={sizeConfig.chartSize} height={sizeConfig.chartSize}>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={sizeConfig.innerRadius}
                    outerRadius={sizeConfig.outerRadius}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <CenterLabel />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Lista de status */}
            <div className="flex-1 min-w-0">
              <div className="space-y-3">
                {data.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="flex items-center gap-2">
                        <span style={{ color: item.color }}>
                          {getStatusIcon(item.status)}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {item.count}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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