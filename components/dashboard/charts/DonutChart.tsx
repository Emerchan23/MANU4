'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { StatusDistribution } from '@/types/dashboard'
import { motion } from 'framer-motion'

interface DonutChartProps {
  data: StatusDistribution[]
  title?: string
  colors?: string[]
  height?: number
  showLegend?: boolean
  showPercentage?: boolean
  animate?: boolean
  innerRadius?: number
  outerRadius?: number
}

const DEFAULT_COLORS = [
  '#10b981', // green-500 - Operacional
  '#f59e0b', // amber-500 - Manutenção  
  '#ef4444', // red-500 - Inativo
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16'  // lime-500
]

export default function DonutChart({ 
  data, 
  title, 
  colors = DEFAULT_COLORS,
  height = 300,
  showLegend = true,
  showPercentage = true,
  animate = true,
  innerRadius = 60,
  outerRadius = 100
}: DonutChartProps) {
  // Transformar dados para o formato do Recharts
  const chartData = data.map((item, index) => ({
    name: item.status,
    value: item.count,
    percentage: item.percentage,
    color: colors[index % colors.length]
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Quantidade: {data.value.toLocaleString('pt-BR')}
          </p>
          {showPercentage && (
            <p className="text-sm font-semibold" style={{ color: data.color }}>
              Percentual: {data.percentage}%
            </p>
          )}
        </div>
      )
    }
    return null
  }

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-700">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  // Componente de label personalizado para mostrar percentuais
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (!showPercentage) return null
    
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  const chartComponent = (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderLabel}
          outerRadius={outerRadius}
          innerRadius={innerRadius}
          fill="#8884d8"
          dataKey="value"
          animationBegin={0}
          animationDuration={animate ? 800 : 0}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend content={<CustomLegend />} />}
      </PieChart>
    </ResponsiveContainer>
  )

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">{title}</h3>
        )}
        {chartComponent}
      </motion.div>
    )
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">{title}</h3>
      )}
      {chartComponent}
    </div>
  )
}