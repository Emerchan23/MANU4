'use client'

import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendData } from '@/types/dashboard'
import { motion } from 'framer-motion'

interface LineChartProps {
  data: TrendData[]
  title?: string
  color?: string
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  animate?: boolean
}

export default function LineChart({ 
  data, 
  title, 
  color = '#0ea5e9', 
  height = 300,
  showGrid = true,
  showLegend = false,
  animate = true
}: LineChartProps) {
  // Transformar dados para o formato do Recharts
  const chartData = data.map(item => ({
    name: new Date(item.recorded_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }),
    value: item.value,
    fullDate: item.recorded_at
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Data: {new Date(data.fullDate).toLocaleString('pt-BR')}
          </p>
          <p className="text-sm font-semibold" style={{ color }}>
            Valor: {payload[0].value.toLocaleString('pt-BR')}
          </p>
        </div>
      )
    }
    return null
  }

  const chartComponent = (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 12, fill: '#6b7280' }}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis 
          tick={{ fontSize: 12, fill: '#6b7280' }}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend />}
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: '#fff' }}
          animationDuration={animate ? 1000 : 0}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  )

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        )}
        {chartComponent}
      </motion.div>
    )
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      {chartComponent}
    </div>
  )
}