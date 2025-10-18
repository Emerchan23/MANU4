'use client'

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { motion } from 'framer-motion'

interface BarChartData {
  name: string
  value: number
  category?: string
  [key: string]: any
}

interface BarChartProps {
  data: BarChartData[]
  title?: string
  color?: string
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  animate?: boolean
  horizontal?: boolean
  dataKey?: string
}

export default function BarChart({ 
  data, 
  title, 
  color = '#3b82f6', 
  height = 300,
  showGrid = true,
  showLegend = false,
  animate = true,
  horizontal = false,
  dataKey = 'value'
}: BarChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-sm font-semibold" style={{ color }}>
            Valor: {payload[0].value.toLocaleString('pt-BR')}
          </p>
          {data.category && (
            <p className="text-sm text-gray-600">
              Categoria: {data.category}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  const chartComponent = (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart 
        data={data} 
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        layout={horizontal ? 'horizontal' : 'vertical'}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
        <XAxis 
          type={horizontal ? 'number' : 'category'}
          dataKey={horizontal ? undefined : 'name'}
          tick={{ fontSize: 12, fill: '#6b7280' }}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis 
          type={horizontal ? 'category' : 'number'}
          dataKey={horizontal ? 'name' : undefined}
          tick={{ fontSize: 12, fill: '#6b7280' }}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend />}
        <Bar 
          dataKey={dataKey}
          fill={color}
          radius={[4, 4, 0, 0]}
          animationDuration={animate ? 800 : 0}
        />
      </RechartsBarChart>
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