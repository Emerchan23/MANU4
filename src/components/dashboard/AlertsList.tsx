import React from 'react';
import { Alert } from '@/hooks/useAlerts';

interface AlertsListProps {
  alerts: Alert[];
  loading?: boolean;
}

const priorityColors = {
  ALTA: 'bg-red-100 text-red-800 border-red-200',
  MEDIA: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  BAIXA: 'bg-green-100 text-green-800 border-green-200',
};

const priorityLabels = {
  ALTA: 'Alta',
  MEDIA: 'Média',
  BAIXA: 'Baixa',
};

export function AlertsList({ alerts, loading = false }: AlertsListProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 w-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Alertas Críticos</h3>
        <span className="text-sm text-gray-500">
          {alerts.length} {alerts.length === 1 ? 'alerta' : 'alertas'}
        </span>
      </div>
      
      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500">Nenhum alerta crítico no momento</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-start space-x-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className={`w-3 h-3 rounded-full mt-1 ${
                  alert.priority === 'ALTA' ? 'bg-red-500' :
                  alert.priority === 'MEDIA' ? 'bg-yellow-500' : 'bg-green-500'
                }`}></div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {alert.equipment.name}
                  </p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    priorityColors[alert.priority as keyof typeof priorityColors]
                  }`}>
                    {priorityLabels[alert.priority as keyof typeof priorityLabels]}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {alert.description}
                </p>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {alert.sector} • {alert.equipment.code}
                  </span>
                  {alert.daysOverdue > 0 && (
                    <span className="text-xs text-red-600 font-medium">
                      {alert.daysOverdue} {alert.daysOverdue === 1 ? 'dia' : 'dias'} em atraso
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {alerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Ver todos os alertas →
          </button>
        </div>
      )}
    </div>
  );
}