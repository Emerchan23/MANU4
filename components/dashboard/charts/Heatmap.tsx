'use client'

import { HeatmapPoint } from '@/types/dashboard'
import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface HeatmapProps {
  data: HeatmapPoint[]
  title?: string
  width?: number
  height?: number
  cellSize?: number
  colors?: {
    low: string
    medium: string
    high: string
    background: string
  }
  showLabels?: boolean
  animate?: boolean
  onCellClick?: (point: HeatmapPoint) => void
}

const DEFAULT_COLORS = {
  low: '#dcfce7',      // green-100
  medium: '#fbbf24',   // amber-400
  high: '#dc2626',     // red-600
  background: '#f9fafb' // gray-50
}

export default function Heatmap({
  data,
  title,
  width = 600,
  height = 400,
  cellSize = 40,
  colors = DEFAULT_COLORS,
  showLabels = true,
  animate = true,
  onCellClick
}: HeatmapProps) {
  // Processar dados para criar matriz
  const { matrix, xLabels, yLabels, minValue, maxValue } = useMemo(() => {
    if (!data.length) return { matrix: [], xLabels: [], yLabels: [], minValue: 0, maxValue: 0 }

    const xSet = new Set<string>()
    const ySet = new Set<string>()
    const values: number[] = []

    data.forEach(point => {
      xSet.add(String(point.x_axis))
      ySet.add(String(point.y_axis))
      values.push(point.value)
    })

    const xLabels = Array.from(xSet).sort()
    const yLabels = Array.from(ySet).sort()
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)

    // Criar matriz
    const matrix: (HeatmapPoint | null)[][] = []
    for (let y = 0; y < yLabels.length; y++) {
      matrix[y] = []
      for (let x = 0; x < xLabels.length; x++) {
        const point = data.find(p => 
          String(p.x_axis) === xLabels[x] && String(p.y_axis) === yLabels[y]
        )
        matrix[y][x] = point || null
      }
    }

    return { matrix, xLabels, yLabels, minValue, maxValue }
  }, [data])

  // Função para calcular cor baseada no valor
  const getColor = (value: number) => {
    if (maxValue === minValue) return colors.low
    
    const normalized = (value - minValue) / (maxValue - minValue)
    
    if (normalized <= 0.33) return colors.low
    if (normalized <= 0.66) return colors.medium
    return colors.high
  }

  // Função para calcular opacidade
  const getOpacity = (value: number) => {
    if (maxValue === minValue) return 0.5
    const normalized = (value - minValue) / (maxValue - minValue)
    return 0.3 + (normalized * 0.7) // Entre 0.3 e 1.0
  }

  const HeatmapCell = ({ point, x, y, index }: { 
    point: HeatmapPoint | null, 
    x: number, 
    y: number, 
    index: number 
  }) => {
    if (!point) {
      return (
        <div
          className="border border-gray-200 flex items-center justify-center cursor-default"
          style={{
            width: cellSize,
            height: cellSize,
            backgroundColor: colors.background
          }}
        />
      )
    }

    const cellColor = getColor(point.value)
    const opacity = getOpacity(point.value)

    return (
      <motion.div
        initial={animate ? { opacity: 0, scale: 0 } : {}}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: animate ? index * 0.01 : 0 }}
        className="border border-gray-200 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
        style={{
          width: cellSize,
          height: cellSize,
          backgroundColor: cellColor,
          opacity
        }}
        onClick={() => onCellClick?.(point)}
        title={`${yLabels[y]} - ${xLabels[x]}: ${point.value.toLocaleString('pt-BR')}`}
      >
        {showLabels && cellSize >= 30 && (
          <span className="text-xs font-medium text-gray-800">
            {point.value > 999 ? `${Math.round(point.value / 1000)}k` : point.value}
          </span>
        )}
      </motion.div>
    )
  }

  if (!data.length) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">Nenhum dado disponível para o heatmap</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 20 } : {}}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      
      <div className="overflow-auto bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex">
          {/* Labels do eixo Y */}
          <div className="flex flex-col">
            <div style={{ height: cellSize }} /> {/* Espaço para labels do X */}
            {yLabels.map((label, index) => (
              <div
                key={index}
                className="flex items-center justify-end pr-2 text-sm text-gray-600"
                style={{ height: cellSize }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Matriz do heatmap */}
          <div>
            {/* Labels do eixo X */}
            <div className="flex">
              {xLabels.map((label, index) => (
                <div
                  key={index}
                  className="flex items-center justify-center text-sm text-gray-600 transform -rotate-45 origin-center"
                  style={{ width: cellSize, height: cellSize }}
                >
                  <span className="truncate max-w-8">{label}</span>
                </div>
              ))}
            </div>

            {/* Células do heatmap */}
            {matrix.map((row, yIndex) => (
              <div key={yIndex} className="flex">
                {row.map((point, xIndex) => (
                  <HeatmapCell
                    key={`${xIndex}-${yIndex}`}
                    point={point}
                    x={xIndex}
                    y={yIndex}
                    index={yIndex * row.length + xIndex}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legenda */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <span className="text-sm text-gray-600">Baixo</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: colors.low }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: colors.medium }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: colors.high }} />
          </div>
          <span className="text-sm text-gray-600">Alto</span>
          <div className="ml-4 text-sm text-gray-500">
            Min: {minValue.toLocaleString('pt-BR')} | Max: {maxValue.toLocaleString('pt-BR')}
          </div>
        </div>
      </div>
    </motion.div>
  )
}