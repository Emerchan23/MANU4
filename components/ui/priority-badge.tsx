import React from 'react'
import { cn } from '@/lib/utils'

export interface PriorityBadgeProps {
  priority: string
  variant?: 'default' | 'compact'
  className?: string
}

// Mapeamento de prioridades para cores e textos consistentes
const PRIORITY_CONFIG = {
  // Valores em português (minúsculo)
  'baixa': {
    color: 'bg-green-100 text-green-800 border-green-200',
    darkColor: 'dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    text: 'BAIXA',
    icon: '●'
  },
  'media': {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    darkColor: 'dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
    text: 'MÉDIA',
    icon: '●'
  },
  'alta': {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    darkColor: 'dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
    text: 'ALTA',
    icon: '●'
  },
  'urgente': {
    color: 'bg-red-100 text-red-800 border-red-200',
    darkColor: 'dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    text: 'URGENTE',
    icon: '●'
  },
  // Valores em inglês (minúsculo)
  'low': {
    color: 'bg-green-100 text-green-800 border-green-200',
    darkColor: 'dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    text: 'BAIXA',
    icon: '●'
  },
  'medium': {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    darkColor: 'dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
    text: 'MÉDIA',
    icon: '●'
  },
  'high': {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    darkColor: 'dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
    text: 'ALTA',
    icon: '●'
  },
  // Valores em inglês (maiúsculo)
  'LOW': {
    color: 'bg-green-100 text-green-800 border-green-200',
    darkColor: 'dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
    text: 'BAIXA',
    icon: '●'
  },
  'MEDIUM': {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    darkColor: 'dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
    text: 'MÉDIA',
    icon: '●'
  },
  'HIGH': {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    darkColor: 'dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
    text: 'ALTA',
    icon: '●'
  },
  'CRITICAL': {
    color: 'bg-red-100 text-red-800 border-red-200',
    darkColor: 'dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
    text: 'URGENTE',
    icon: '●'
  }
}

export function PriorityBadge({ priority, variant = 'default', className }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG]
  
  if (!config) {
    // Fallback para prioridades não mapeadas
    return (
      <span className={cn(
        'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border',
        'bg-gray-100 text-gray-800 border-gray-200',
        'dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
        className
      )}>
        <span className="text-gray-400">●</span>
        {priority?.toUpperCase() || 'N/A'}
      </span>
    )
  }

  if (variant === 'compact') {
    return (
      <span className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded border',
        config.color,
        config.darkColor,
        className
      )}>
        <span className="text-current">{config.icon}</span>
        {config.text}
      </span>
    )
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border',
      config.color,
      config.darkColor,
      className
    )}>
      <span className="text-current text-sm">{config.icon}</span>
      {config.text}
    </span>
  )
}

// Hook para obter a configuração de cor de uma prioridade
export function usePriorityConfig(priority: string) {
  return PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] || null
}

// Função utilitária para obter a classe CSS de cor de uma prioridade
export function getPriorityColorClass(priority: string, type: 'background' | 'text' | 'border' = 'background') {
  const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG]
  if (!config) return ''
  
  const colorClasses = config.color.split(' ')
  const darkColorClasses = config.darkColor.split(' ')
  
  switch (type) {
    case 'background':
      return colorClasses.find(c => c.startsWith('bg-')) + ' ' + darkColorClasses.find(c => c.startsWith('dark:bg-'))
    case 'text':
      return colorClasses.find(c => c.startsWith('text-')) + ' ' + darkColorClasses.find(c => c.startsWith('dark:text-'))
    case 'border':
      return colorClasses.find(c => c.startsWith('border-')) + ' ' + darkColorClasses.find(c => c.startsWith('dark:border-'))
    default:
      return config.color + ' ' + config.darkColor
  }
}