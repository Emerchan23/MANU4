'use client'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  className?: string
  valueClassName?: string
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className = '',
  valueClassName = ''
}: StatsCardProps) {
  return (
    <div className={`bg-white overflow-hidden shadow rounded-lg ${className}`}>
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {icon && (
              <div className="text-gray-400">
                {icon}
              </div>
            )}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className={`text-lg font-medium text-gray-900 ${valueClassName}`}>
                {typeof value === 'number' && title.toLowerCase().includes('custo') || title.toLowerCase().includes('gasto') ? 
                  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 
                  value
                }
              </dd>
              {subtitle && (
                <dd className="text-sm text-gray-500 mt-1">
                  {subtitle}
                </dd>
              )}
            </dl>
          </div>
        </div>
        
        {trend && (
          <div className="mt-4 flex items-center text-sm">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              trend.isPositive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="ml-2 text-gray-500">
              {trend.label}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}