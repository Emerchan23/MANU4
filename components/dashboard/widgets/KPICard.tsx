'use client'

import { KPIMetric } from '@/types/dashboard'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Activity, AlertTriangle, CheckCircle, Clock, Wrench } from 'lucide-react'
import { WidgetEntrance, CounterAnimation, TooltipAnimation } from '../animations/microinteractions'

interface KPICardProps {
  kpi?: KPIMetric
  category?: string
  metric?: string
  title?: string
  icon?: string
  animate?: boolean
  size?: 'small' | 'medium' | 'large'
}

export default function KPICard({ 
  kpi, 
  category, 
  metric, 
  title, 
  icon, 
  animate = true, 
  size = 'medium' 
}: KPICardProps) {
  // Se kpi for fornecido, usar seus dados; caso contrário, usar props individuais
  const cardData = kpi || {
    metric_name: metric || title || 'Métrica',
    value: 42, // Valor fixo para evitar hidratação
    category: category as any || 'operations',
    variation: 5.2, // Variação fixa
    trend: 'up' as any,
    recorded_at: '2024-01-15T10:00:00Z', // Data fixa
    unit: category === 'performance' ? '%' : undefined
  }

  // Traduzir nomes de métricas para português brasileiro
  const getMetricDisplayName = (metricName: string) => {
    const translations: { [key: string]: string } = {
      'active_count': 'Equipamentos Ativos',
      'pending_count': 'Manutenções Pendentes', 
      'critical_count': 'Alertas Críticos',
      'efficiency_rate': 'Taxa de Eficiência',
      'equipment_count': 'Total de Equipamentos',
      'maintenance_count': 'Total de Manutenções',
      'alert_count': 'Total de Alertas',
      'completion_rate': 'Taxa de Conclusão',
      'availability_rate': 'Taxa de Disponibilidade',
      'downtime_hours': 'Horas de Inatividade',
      'cost_total': 'Custo Total',
      'orders_completed': 'Ordens Concluídas'
    }
    
    return translations[metricName] || metricName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Definir ícones baseados na categoria
  const getIcon = () => {
    switch (cardData.category) {
      case 'critical':
        return <AlertTriangle className="w-6 h-6" />
      case 'operations':
        return <Activity className="w-6 h-6" />
      case 'performance':
        return <CheckCircle className="w-6 h-6" />
      case 'inventory':
        return <Clock className="w-6 h-6" />
      default:
        return <Activity className="w-6 h-6" />
    }
  }

  // Traduzir categoria para português brasileiro
  const getCategoryLabel = () => {
    switch (cardData.category) {
      case 'critical':
        return 'CRÍTICO'
      case 'operations':
        return 'OPERAÇÕES'
      case 'performance':
        return 'DESEMPENHO'
      case 'inventory':
        return 'INVENTÁRIO'
      case 'equipment':
        return 'EQUIPAMENTOS'
      case 'maintenance':
        return 'MANUTENÇÃO'
      case 'alerts':
        return 'ALERTAS'
      default:
        return 'GERAL'
    }
  }

  // Definir cores baseadas na categoria
  const getCategoryColor = () => {
    switch (cardData.category) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'operations':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'performance':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'inventory':
        return 'text-amber-600 bg-amber-50 border-amber-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  // Definir ícone de tendência
  const getTrendIcon = () => {
    switch (cardData.trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-gray-400" />
    }
  }

  // Definir cor da variação
  const getVariationColor = () => {
    if (cardData.variation > 0) return 'text-green-600'
    if (cardData.variation < 0) return 'text-red-600'
    return 'text-gray-500'
  }

  // Definir tamanhos baseados na prop size
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { 
          containerClass: 'p-4 min-h-[140px]', 
          iconSize: 'w-5 h-5', 
          titleSize: 'text-sm', 
          valueSize: 'text-2xl',
          changeSize: 'text-sm'
        }
      case 'large':
        return { 
          containerClass: 'p-6 min-h-[180px]', 
          iconSize: 'w-8 h-8', 
          titleSize: 'text-base', 
          valueSize: 'text-4xl',
          changeSize: 'text-base'
        }
      default:
        return { 
          containerClass: 'p-5 min-h-[160px]', 
          iconSize: 'w-6 h-6', 
          titleSize: 'text-sm', 
          valueSize: 'text-3xl',
          changeSize: 'text-sm'
        }
    }
  }

  const sizeConfig = getSizeConfig()

  const cardContent = (
    <TooltipAnimation tooltip={`${cardData.metric_name.replace(/_/g, ' ')}: ${cardData.value.toLocaleString('pt-BR')}${cardData.unit || ''}`}>
      <div className={`bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300 ${sizeConfig.containerClass} group cursor-pointer`}>
        {/* Header com ícone e categoria */}
        <div className="flex items-center justify-between mb-1">
          <motion.div 
            className="p-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-200"
            whileHover={{ rotate: 5 }}
          >
            {getIcon()}
          </motion.div>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {getCategoryLabel()}
          </span>
        </div>

        {/* Valor principal com animação */}
        <div className="mb-1">
          <div className="flex items-baseline gap-2">
            <CounterAnimation 
              value={cardData.value}
              className="text-2xl font-bold text-gray-900 dark:text-white"
            />
            {cardData.unit && (
              <span className="text-sm text-gray-500 dark:text-gray-400">{cardData.unit}</span>
            )}
          </div>
        </div>

        {/* Nome da métrica */}
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
          {getMetricDisplayName(cardData.metric_name)}
        </h3>

        {/* Tendência e variação com animação */}
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-1"
            whileHover={{ scale: 1.05 }}
          >
            {getTrendIcon()}
            <span className={`text-sm font-medium ${getVariationColor()}`}>
              {cardData.variation > 0 ? '+' : ''}{cardData.variation.toFixed(1)}%
            </span>
          </motion.div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {new Date(cardData.recorded_at).toLocaleDateString('pt-BR')}
          </span>
        </div>

        {/* Descrição (se disponível) */}
        {cardData.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {cardData.description}
          </p>
        )}

        {/* Indicador de hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white dark:via-gray-600 to-transparent opacity-0 group-hover:opacity-20"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        />
      </div>
    </TooltipAnimation>
  )

  if (animate) {
    return (
      <WidgetEntrance delay={Math.random() * 0.3}>
        {cardContent}
      </WidgetEntrance>
    )
  }

  return cardContent
}