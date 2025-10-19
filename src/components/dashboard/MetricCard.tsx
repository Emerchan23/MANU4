import React from 'react';

interface MetricCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'yellow';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    text: 'text-blue-900',
    border: 'border-blue-200',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    text: 'text-green-900',
    border: 'border-green-200',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    text: 'text-red-900',
    border: 'border-red-200',
  },
  yellow: {
    bg: 'bg-yellow-50',
    icon: 'text-yellow-600',
    text: 'text-yellow-900',
    border: 'border-yellow-200',
  },
};

export function MetricCard({ 
  title, 
  value, 
  icon, 
  color, 
  trend, 
  loading = false 
}: MetricCardProps) {
  const colors = colorClasses[color];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
          <div className="mt-4 h-8 bg-gray-200 rounded w-16"></div>
          {trend && (
            <div className="mt-2 h-4 bg-gray-200 rounded w-20"></div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${colors.border} p-6 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${colors.text} mt-2`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend && (
            <div className="flex items-center mt-2">
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500 ml-2">vs. mês anterior</span>
            </div>
          )}
        </div>
        <div className={`${colors.bg} p-3 rounded-lg`}>
          <div className={`${colors.icon} h-6 w-6`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}