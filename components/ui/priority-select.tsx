import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PriorityBadge, getPriorityColorClass } from '@/components/ui/priority-badge'
import { cn } from '@/lib/utils'

export interface PrioritySelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  variant?: 'service-order' | 'schedule' | 'maintenance-plan'
}

// Opções de prioridade baseadas no contexto
const PRIORITY_OPTIONS = {
  'service-order': [
    { value: 'baixa', label: 'Baixa' },
    { value: 'media', label: 'Média' },
    { value: 'alta', label: 'Alta' },
    { value: 'urgente', label: 'Urgente' }
  ],
  'schedule': [
    { value: 'baixa', label: 'Baixa' },
    { value: 'media', label: 'Média' },
    { value: 'alta', label: 'Alta' },
    { value: 'critica', label: 'Crítica' }
  ],
  'maintenance-plan': [
    { value: 'baixa', label: 'Baixa' },
    { value: 'media', label: 'Média' },
    { value: 'alta', label: 'Alta' }
  ]
}

export function PrioritySelect({ 
  value, 
  onValueChange, 
  placeholder = "Selecione a prioridade",
  className,
  disabled = false,
  variant = 'service-order'
}: PrioritySelectProps) {
  const options = PRIORITY_OPTIONS[variant]

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder}>
          {value && (
            <div className="flex items-center gap-2">
              <PriorityBadge priority={value} variant="compact" />
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem 
            key={option.value} 
            value={option.value}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2 w-full">
              <PriorityBadge priority={option.value} variant="compact" />
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Componente específico para filtros (sem badge, apenas com indicador de cor)
export function PriorityFilterSelect({ 
  value, 
  onValueChange, 
  placeholder = "Todas as prioridades",
  className,
  variant = 'service-order'
}: PrioritySelectProps) {
  const options = PRIORITY_OPTIONS[variant]

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder}>
          {value && value !== 'all' && value !== 'all-priorities' && (
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                getPriorityColorClass(value, 'background')
              )} />
              <span>{options.find(opt => opt.value === value)?.label}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all-priorities">Todas as prioridades</SelectItem>
        {options.map((option) => (
          <SelectItem 
            key={option.value} 
            value={option.value}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2 w-full">
              <div className={cn(
                "w-2 h-2 rounded-full",
                getPriorityColorClass(option.value, 'background')
              )} />
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}