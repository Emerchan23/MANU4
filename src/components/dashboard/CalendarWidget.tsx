import React from 'react';
import { useRouter } from 'next/navigation';
import { CalendarEvent } from '@/hooks/useCalendarEvents';

interface CalendarWidgetProps {
  events: CalendarEvent[];
  loading?: boolean;
}

const priorityColors = {
  ALTA: 'border-l-red-500 bg-red-50 dark:bg-red-900/20',
  MEDIA: 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
  BAIXA: 'border-l-green-500 bg-green-50 dark:bg-green-900/20',
};

const statusColors = {
  SCHEDULED: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
  agendado: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
  'em_andamento': 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30',
  COMPLETED: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
};

export function CalendarWidget({ events, loading = false }: CalendarWidgetProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border-l-4 border-gray-200 dark:border-gray-600 pl-4 py-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-1"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Próximos Agendamentos
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Próximos 30 dias
        </span>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">Nenhum agendamento nos próximos 30 dias</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {events.map((event) => (
            <div
              key={event.id}
              className={`border-l-4 pl-4 py-3 rounded-r-lg ${
                priorityColors[event.priority as keyof typeof priorityColors] || 'border-l-gray-300 bg-gray-50 dark:border-l-gray-600 dark:bg-gray-700/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {event.equipment.name}
                    </h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      statusColors[event.status as keyof typeof statusColors] || 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700'
                    }`}>
                      {event.status === 'SCHEDULED' || event.status === 'agendado' ? 'Agendado' : event.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {event.title}
                  </p>
                  
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                    <span>📅 {formatDate(event.date)}</span>
                    <span>🏢 {event.sector}</span>
                    <span>👤 {event.assignedUser || 'Não atribuído'}</span>
                  </div>
                  
                  {event.estimatedCost && (
                    <div className="mt-1">
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        Custo estimado: {formatCurrency(event.estimatedCost)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {events.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button 
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            onClick={() => router.push('/agendamentos/calendario')}
          >
            Ver calendário completo →
          </button>
        </div>
      )}
    </div>
  );
}